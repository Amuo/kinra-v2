-- Deletes only this application's records. Shared auth identities and legacy
-- app data remain untouched. Storage binaries are removed by the app first.
CREATE FUNCTION public.kinra_erase_data(confirmation text,expected_owner uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE actor uuid:=auth.uid();
BEGIN
  IF actor IS NULL OR actor IS DISTINCT FROM expected_owner OR confirmation IS DISTINCT FROM 'DELETE KINRA DATA' THEN RAISE EXCEPTION 'Deletion confirmation and matching account required' USING ERRCODE='42501'; END IF;
  DELETE FROM feature_records WHERE owner_id=actor OR client_id=actor OR kind='message' AND payload->>'recipient_id'=actor::text;
  -- Optional coaching tables already exist in the production namespace.
  IF to_regclass('public.message_receipts') IS NOT NULL THEN EXECUTE 'DELETE FROM public.message_receipts WHERE reader_id=$1 OR message_id IN (SELECT id FROM public.trainer_notes WHERE trainer_id=$1 OR client_id=$1)' USING actor; END IF;
  IF to_regclass('public.check_ins') IS NOT NULL THEN EXECUTE 'DELETE FROM public.check_ins WHERE trainer_id=$1 OR client_id=$1' USING actor; END IF;
  IF to_regclass('public.check_in_schedules') IS NOT NULL THEN EXECUTE 'DELETE FROM public.check_in_schedules WHERE trainer_id=$1 OR client_id=$1' USING actor; END IF;
  IF to_regclass('public.calendar_events') IS NOT NULL THEN EXECUTE 'DELETE FROM public.calendar_events WHERE trainer_id=$1 OR client_id=$1' USING actor; END IF;
  IF to_regclass('public.habit_completions') IS NOT NULL THEN EXECUTE 'DELETE FROM public.habit_completions WHERE client_id=$1 OR habit_id IN (SELECT id FROM public.habits WHERE trainer_id=$1)' USING actor; END IF;
  IF to_regclass('public.habits') IS NOT NULL THEN EXECUTE 'DELETE FROM public.habits WHERE trainer_id=$1 OR client_id=$1' USING actor; END IF;
  IF to_regclass('public.coach_branding') IS NOT NULL THEN EXECUTE 'DELETE FROM public.coach_branding WHERE trainer_id=$1' USING actor; END IF;
  IF to_regclass('public.push_subscriptions') IS NOT NULL THEN EXECUTE 'DELETE FROM public.push_subscriptions WHERE user_id=$1' USING actor; END IF;
  DELETE FROM progress_reports WHERE trainer_id=actor OR client_id=actor;
  DELETE FROM trainer_notes WHERE trainer_id=actor OR client_id=actor;
  DELETE FROM program_assignments WHERE trainer_id=actor OR client_id=actor;
  DELETE FROM programs WHERE trainer_id=actor;
  DELETE FROM trainer_clients WHERE trainer_id=actor OR client_id=actor;
  DELETE FROM workouts WHERE user_id=actor;
  DELETE FROM nutrition_logs WHERE user_id=actor;
  DELETE FROM sleep_logs WHERE user_id=actor;
  DELETE FROM journal_entries WHERE user_id=actor;
  DELETE FROM body_metrics WHERE user_id=actor;
  DELETE FROM progress_photos WHERE user_id=actor;
  DELETE FROM user_roles WHERE user_id=actor;
  DELETE FROM profiles WHERE id=actor;
END $$;
REVOKE ALL ON FUNCTION public.kinra_erase_data(text,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.kinra_erase_data(text,uuid) TO authenticated,service_role;
