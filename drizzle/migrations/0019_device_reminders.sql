CREATE TABLE public.device_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE CHECK(length(endpoint)<=3000 AND endpoint ~ '^https://(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|web\.push\.apple\.com|[a-z0-9.-]+\.notify\.windows\.com)/[^[:space:]]+$'),
  p256dh text NOT NULL CHECK(p256dh ~ '^[A-Za-z0-9_-]{87}$'),
  auth_key text NOT NULL CHECK(auth_key ~ '^[A-Za-z0-9_-]{22}$'),
  locale text NOT NULL CHECK(locale IN ('en','bs','de')), created_at timestamptz NOT NULL DEFAULT now(), last_test_at timestamptz
);
CREATE INDEX device_subscription_owner ON public.device_subscriptions(owner_id);
ALTER TABLE public.device_subscriptions ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,DELETE ON public.device_subscriptions TO authenticated;
GRANT UPDATE(last_test_at) ON public.device_subscriptions TO authenticated;
GRANT ALL ON public.device_subscriptions TO service_role;
CREATE POLICY "Own notification devices" ON public.device_subscriptions TO authenticated USING(owner_id=auth.uid()) WITH CHECK(owner_id=auth.uid());
CREATE FUNCTION public.kinra_claim_push_test(subscription_endpoint text,expected_owner uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE device public.device_subscriptions;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM expected_owner THEN RAISE EXCEPTION 'Matching account required' USING ERRCODE='42501'; END IF;
  UPDATE public.device_subscriptions d SET last_test_at=now() WHERE d.owner_id=auth.uid() AND d.endpoint=subscription_endpoint AND (d.last_test_at IS NULL OR d.last_test_at<now()-interval '1 minute') RETURNING d.* INTO device;
  IF device.id IS NULL THEN RAISE EXCEPTION 'Enable this device and wait one minute between tests' USING ERRCODE='23514'; END IF;
  RETURN jsonb_build_object('endpoint',device.endpoint,'p256dh',device.p256dh,'auth_key',device.auth_key,'locale',device.locale);
END $$;
REVOKE ALL ON FUNCTION public.kinra_claim_push_test(text,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.kinra_claim_push_test(text,uuid) TO authenticated,service_role;
CREATE TABLE public.push_dispatch_config (singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton), token_hash bytea NOT NULL);
ALTER TABLE public.push_dispatch_config ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.push_dispatch_config FROM PUBLIC,anon,authenticated;
CREATE TABLE public.push_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), subscription_id uuid NOT NULL REFERENCES public.device_subscriptions(id) ON DELETE CASCADE,
  reminder_id uuid NOT NULL REFERENCES public.feature_records(id) ON DELETE CASCADE, local_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sent','failed')), attempts int NOT NULL DEFAULT 0,
  lease_until timestamptz, sent_at timestamptz, error_code int,
  UNIQUE(subscription_id,reminder_id,local_date)
);
CREATE INDEX push_delivery_reminder ON public.push_deliveries(reminder_id);
ALTER TABLE public.push_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.push_deliveries FROM PUBLIC,anon,authenticated;
-- Narrow dispatcher capability, unrelated to the Supabase service-role key.
-- Only a hash is stored here. The actual token lives in deployment secrets.
CREATE FUNCTION public.kinra_push_authorized(token text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT length(token)>=40 AND EXISTS(SELECT 1 FROM public.push_dispatch_config c WHERE c.token_hash=sha256(convert_to(token,'UTF8')))
$$;
CREATE FUNCTION public.kinra_push_clock(zone text) RETURNS timestamp LANGUAGE sql STABLE SET search_path='' AS $$
  SELECT now() AT TIME ZONE coalesce((SELECT name FROM pg_catalog.pg_timezone_names WHERE name=zone),'UTC')
$$;
CREATE FUNCTION public.kinra_push_due(token text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
  IF public.kinra_push_authorized(token) IS DISTINCT FROM true THEN RAISE EXCEPTION 'Dispatcher authorization required' USING ERRCODE='42501'; END IF;
  -- Local timestamps are calculated by PostgreSQL's timezone database, including
  -- DST. A short catch-up window tolerates scheduler delays without old alerts.
  INSERT INTO public.push_deliveries(subscription_id,reminder_id,local_date)
  SELECT d.id,r.id,(public.kinra_push_clock(r.payload->>'timezone'))::date
  FROM public.device_subscriptions d JOIN public.feature_records r ON r.owner_id=d.owner_id AND r.kind='reminder'
  LEFT JOIN public.feature_records p ON p.owner_id=d.owner_id AND p.kind='notification_preferences'
  WHERE r.payload->>'enabled'='true'
    AND coalesce((p.payload->'categories'->>'reminders')::boolean,true)
    AND extract(dow FROM public.kinra_push_clock(r.payload->>'timezone'))::int IN (SELECT v::int FROM jsonb_array_elements_text(r.payload->'weekdays') v)
    AND (public.kinra_push_clock(r.payload->>'timezone')) - ((public.kinra_push_clock(r.payload->>'timezone'))::date+(r.payload->>'time')::time) BETWEEN interval '0 minutes' AND interval '10 minutes'
    AND (p.id IS NULL OR p.payload->>'quiet_start'=p.payload->>'quiet_end' OR NOT (
      CASE WHEN p.payload->>'quiet_start'<p.payload->>'quiet_end' THEN
        (public.kinra_push_clock(p.payload->>'timezone'))::time >= (p.payload->>'quiet_start')::time AND (public.kinra_push_clock(p.payload->>'timezone'))::time < (p.payload->>'quiet_end')::time
      ELSE (public.kinra_push_clock(p.payload->>'timezone'))::time >= (p.payload->>'quiet_start')::time OR (public.kinra_push_clock(p.payload->>'timezone'))::time < (p.payload->>'quiet_end')::time END))
  ON CONFLICT DO NOTHING;
  -- Re-check opt-out and quiet hours for pending retries as well.
  WITH candidates AS (
    SELECT q.id FROM public.push_deliveries q JOIN public.device_subscriptions d ON d.id=q.subscription_id
    JOIN public.feature_records r ON r.id=q.reminder_id
    LEFT JOIN public.feature_records p ON p.owner_id=d.owner_id AND p.kind='notification_preferences'
    WHERE q.status='pending' AND q.attempts<3 AND (q.lease_until IS NULL OR q.lease_until<now())
      AND r.payload->>'enabled'='true' AND coalesce((p.payload->'categories'->>'reminders')::boolean,true)
      AND q.local_date=(public.kinra_push_clock(r.payload->>'timezone'))::date
      AND (public.kinra_push_clock(r.payload->>'timezone')) - (q.local_date+(r.payload->>'time')::time) BETWEEN interval '0 minutes' AND interval '10 minutes'
      AND (p.id IS NULL OR p.payload->>'quiet_start'=p.payload->>'quiet_end' OR NOT (
        CASE WHEN p.payload->>'quiet_start'<p.payload->>'quiet_end' THEN
          (public.kinra_push_clock(p.payload->>'timezone'))::time >= (p.payload->>'quiet_start')::time AND (public.kinra_push_clock(p.payload->>'timezone'))::time < (p.payload->>'quiet_end')::time
        ELSE (public.kinra_push_clock(p.payload->>'timezone'))::time >= (p.payload->>'quiet_start')::time OR (public.kinra_push_clock(p.payload->>'timezone'))::time < (p.payload->>'quiet_end')::time END))
    ORDER BY q.id LIMIT 100 FOR UPDATE OF q SKIP LOCKED
  ), claimed AS (
    UPDATE public.push_deliveries q SET lease_until=now()+interval '2 minutes',attempts=attempts+1
    FROM candidates c WHERE q.id=c.id RETURNING q.*
  ) SELECT coalesce(jsonb_agg(jsonb_build_object('deliveryId',q.id,'subscription',jsonb_build_object('endpoint',d.endpoint,'keys',jsonb_build_object('p256dh',d.p256dh,'auth',d.auth_key)),'locale',d.locale)),'[]'::jsonb)
  INTO result FROM claimed q JOIN public.device_subscriptions d ON d.id=q.subscription_id;
  DELETE FROM public.push_deliveries q WHERE q.local_date<current_date-30;
  RETURN result;
END $$;
CREATE FUNCTION public.kinra_push_ack(token text,delivery uuid,code int) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF public.kinra_push_authorized(token) IS DISTINCT FROM true THEN RAISE EXCEPTION 'Dispatcher authorization required' USING ERRCODE='42501'; END IF;
  IF code IN (404,410) THEN
    DELETE FROM public.device_subscriptions d USING public.push_deliveries q WHERE q.id=delivery AND q.subscription_id=d.id;
  ELSE
    UPDATE public.push_deliveries q SET status=CASE WHEN code BETWEEN 200 AND 299 THEN 'sent' WHEN attempts>=3 OR code BETWEEN 400 AND 499 AND code<>429 THEN 'failed' ELSE 'pending' END,
      sent_at=CASE WHEN code BETWEEN 200 AND 299 THEN now() ELSE NULL END,error_code=code WHERE q.id=delivery;
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.kinra_push_authorized(text),public.kinra_push_due(text),public.kinra_push_ack(text,uuid,int) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.kinra_push_due(text),public.kinra_push_ack(text,uuid,int) TO anon,service_role;
