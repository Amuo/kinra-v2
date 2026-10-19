-- Reuse the existing conversation store. New installations get the minimum
-- sender metadata; deployments with richer media/reply fields retain them.
ALTER TABLE public.trainer_notes ADD COLUMN IF NOT EXISTS sender_id uuid;
ALTER TABLE public.trainer_notes ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'text';
CREATE FUNCTION public.kinra_send_message(recipient_id uuid,body text,expected_owner uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE actor uuid:=auth.uid(); trainer uuid; client uuid; message_id uuid;
BEGIN
  IF actor IS NULL OR actor IS DISTINCT FROM expected_owner OR length(trim(body)) NOT BETWEEN 1 AND 10000 THEN RAISE EXCEPTION 'Matching account and a message are required' USING ERRCODE='42501'; END IF;
  SELECT trainer_id,client_id INTO trainer,client FROM trainer_clients WHERE trainer_id=actor AND client_id=recipient_id OR trainer_id=recipient_id AND client_id=actor;
  IF trainer IS NULL THEN RAISE EXCEPTION 'Choose a connected coach or client' USING ERRCODE='42501'; END IF;
  INSERT INTO trainer_notes(trainer_id,client_id,sender_id,body,shared,kind) VALUES(trainer,client,actor,trim(body),true,'text') RETURNING id INTO message_id;
  RETURN message_id;
END $$;
-- Existing stricter deployment policies stay in place. This rule grants only
-- the participants' shared conversation to an active connection on fresh DBs.
CREATE POLICY "Connected shared message reads" ON public.trainer_notes FOR SELECT TO authenticated USING (
  shared AND (auth.uid()=trainer_id OR auth.uid()=client_id) AND EXISTS(SELECT 1 FROM trainer_clients c WHERE c.trainer_id=trainer_notes.trainer_id AND c.client_id=trainer_notes.client_id)
);
REVOKE ALL ON FUNCTION public.kinra_send_message(uuid,text,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.kinra_send_message(uuid,text,uuid) TO authenticated,service_role;
CREATE POLICY "Shared replies need an active recipient connection" ON public.trainer_notes AS RESTRICTIVE FOR SELECT TO authenticated USING (
  coalesce(sender_id,trainer_id)=auth.uid() OR EXISTS(SELECT 1 FROM trainer_clients c WHERE c.trainer_id=trainer_notes.trainer_id AND c.client_id=trainer_notes.client_id AND (auth.uid()=c.trainer_id OR auth.uid()=c.client_id))
);
CREATE FUNCTION public.kinra_guard_message_sender() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF TG_OP='UPDATE' AND (NEW.sender_id IS DISTINCT FROM OLD.sender_id OR NEW.trainer_id<>OLD.trainer_id OR NEW.client_id<>OLD.client_id) THEN RAISE EXCEPTION 'Message participants are immutable' USING ERRCODE='23514'; END IF;
  IF TG_OP='INSERT' AND NEW.sender_id IS NULL THEN NEW.sender_id:=auth.uid(); END IF;
  IF TG_OP='INSERT' AND auth.uid() IS NOT NULL AND NEW.sender_id<>auth.uid() THEN RAISE EXCEPTION 'Message sender must match the account' USING ERRCODE='23514'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER guard_message_sender BEFORE INSERT OR UPDATE ON public.trainer_notes FOR EACH ROW EXECUTE FUNCTION public.kinra_guard_message_sender();
REVOKE ALL ON FUNCTION public.kinra_guard_message_sender() FROM PUBLIC,anon;
