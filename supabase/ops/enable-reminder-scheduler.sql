-- Run as the database owner after deploying /api/reminders. Provision the same
-- KINRA_PUSH_DISPATCH_SECRET in Vercel and Supabase Vault under the name below.
-- Never commit the token or substitute it into this file.
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
DO $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM vault.decrypted_secrets WHERE name='kinra_v2_push_dispatch_secret') THEN
    RAISE EXCEPTION 'Provision the isolated dispatch secret in Supabase Vault first';
  END IF;
END $$;
INSERT INTO public.kinra_v2_push_dispatch_config(token_hash)
SELECT sha256(convert_to(decrypted_secret,'UTF8')) FROM vault.decrypted_secrets WHERE name='kinra_v2_push_dispatch_secret'
ON CONFLICT(singleton) DO UPDATE SET token_hash=excluded.token_hash;
SELECT cron.schedule('kinra_v2_reminder_dispatch','* * * * *',$job$
  SELECT net.http_post(
    url:='https://kinra.fit/api/reminders',
    headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='kinra_v2_push_dispatch_secret')),
    body:='{}'::jsonb, timeout_milliseconds:=45000
  ) WHERE EXISTS(SELECT 1 FROM public.kinra_v2_device_subscriptions d JOIN public.kinra_v2_feature_records r ON r.owner_id=d.owner_id AND r.kind='reminder' AND r.payload->>'enabled'='true');
$job$);
