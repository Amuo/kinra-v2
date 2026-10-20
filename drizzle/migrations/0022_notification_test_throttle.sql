-- Claiming a test may advance only this caller's device timestamp. Direct
-- column writes must not let a caller reset the persisted one-minute limit.
REVOKE UPDATE(last_test_at) ON public.device_subscriptions FROM authenticated;
CREATE OR REPLACE FUNCTION public.kinra_claim_push_test(subscription_endpoint text,expected_owner uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE device public.device_subscriptions;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM expected_owner THEN RAISE EXCEPTION 'Matching account required' USING ERRCODE='42501'; END IF;
  UPDATE public.device_subscriptions d SET last_test_at=now() WHERE d.owner_id=auth.uid() AND d.endpoint=subscription_endpoint AND (d.last_test_at IS NULL OR d.last_test_at<now()-interval '1 minute') RETURNING d.* INTO device;
  IF device.id IS NULL THEN RAISE EXCEPTION 'Enable this device and wait one minute between tests' USING ERRCODE='23514'; END IF;
  RETURN jsonb_build_object('endpoint',device.endpoint,'p256dh',device.p256dh,'auth_key',device.auth_key,'locale',device.locale);
END $$;
REVOKE ALL ON FUNCTION public.kinra_claim_push_test(text,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.kinra_claim_push_test(text,uuid) TO authenticated,service_role;
