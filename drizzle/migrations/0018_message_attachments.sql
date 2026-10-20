-- Private uploads remain tied to a live coach/client conversation. Uploading a
-- file alone never makes it readable by the other participant.
CREATE OR REPLACE FUNCTION public.kinra_send_message(recipient_id uuid,body text,expected_owner uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid(); trainer uuid; client uuid; message_id uuid;
BEGIN
  IF actor IS NULL OR actor IS DISTINCT FROM expected_owner OR recipient_id IS NULL OR body IS NULL OR length(trim(body)) NOT BETWEEN 1 AND 10000 THEN RAISE EXCEPTION 'Matching account and a message are required' USING ERRCODE='42501'; END IF;
  IF public.kinra_feature_blocked(recipient_id) THEN RAISE EXCEPTION 'This conversation is unavailable' USING ERRCODE='42501'; END IF;
  SELECT c.trainer_id,c.client_id INTO trainer,client FROM public.trainer_clients c WHERE c.trainer_id=actor AND c.client_id=recipient_id OR c.trainer_id=recipient_id AND c.client_id=actor;
  IF trainer IS NULL THEN RAISE EXCEPTION 'Choose a connected coach or client' USING ERRCODE='42501'; END IF;
  INSERT INTO public.trainer_notes(trainer_id,client_id,sender_id,body,shared,kind) VALUES(trainer,client,actor,trim(body),true,'text') RETURNING id INTO message_id;
  RETURN message_id;
END $$;
CREATE TABLE public.message_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL UNIQUE REFERENCES public.trainer_notes(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  storage_path text NOT NULL UNIQUE,
  filename text NOT NULL CHECK(length(filename) BETWEEN 1 AND 200),
  mime text NOT NULL CHECK(mime IN ('image/jpeg','image/png','image/webp','application/pdf')),
  bytes bigint NOT NULL CHECK(bytes BETWEEN 1 AND 10485760),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX message_attachment_recipient ON public.message_attachments(recipient_id);
CREATE INDEX message_attachment_owner ON public.message_attachments(owner_id);
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.message_attachments TO authenticated;
GRANT ALL ON public.message_attachments TO service_role;
REVOKE ALL ON public.message_attachments FROM anon;
CREATE POLICY "Participants read connected attachments" ON public.message_attachments FOR SELECT TO authenticated USING (
  (auth.uid()=owner_id OR auth.uid()=recipient_id) AND EXISTS(SELECT 1 FROM public.trainer_clients c WHERE c.trainer_id=owner_id AND c.client_id=recipient_id OR c.trainer_id=recipient_id AND c.client_id=owner_id)
);
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('message-attachments','message-attachments',false,10485760,ARRAY['image/jpeg','image/png','image/webp','application/pdf']);
CREATE POLICY "Upload own conversation file" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id='message-attachments' AND (storage.foldername(name))[1]=auth.uid()::text
);
CREATE POLICY "Read own or connected message file" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id='message-attachments' AND ((storage.foldername(name))[1]=auth.uid()::text OR EXISTS(SELECT 1 FROM public.message_attachments a WHERE a.storage_path=name))
);
CREATE POLICY "Delete own conversation file" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id='message-attachments' AND (storage.foldername(name))[1]=auth.uid()::text
);
CREATE FUNCTION public.kinra_send_attachment(recipient uuid,body text,path text,filename text,mime text,bytes bigint,expected_owner uuid) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid(); message uuid;
BEGIN
  IF actor IS NULL OR actor IS DISTINCT FROM expected_owner OR recipient=actor OR
     path !~ ('^'||actor::text||'/[0-9a-f-]{36}\.(jpg|png|webp|pdf)$') OR
     length(filename) NOT BETWEEN 1 AND 200 OR filename ~ '[\x00-\x1f\x7f/\\]' OR
     mime NOT IN ('image/jpeg','image/png','image/webp','application/pdf') OR bytes NOT BETWEEN 1 AND 10485760 OR length(trim(body)) NOT BETWEEN 1 AND 10000
  THEN RAISE EXCEPTION 'Invalid attachment or account' USING ERRCODE='42501'; END IF;
  IF public.kinra_feature_blocked(recipient) THEN RAISE EXCEPTION 'This conversation is unavailable' USING ERRCODE='42501'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.trainer_clients c WHERE c.trainer_id=actor AND c.client_id=recipient OR c.trainer_id=recipient AND c.client_id=actor) THEN RAISE EXCEPTION 'Choose a connected coach or client' USING ERRCODE='42501'; END IF;
  -- Storage metadata is authoritative for the uploaded size and MIME type.
  IF NOT EXISTS(SELECT 1 FROM storage.objects o WHERE o.bucket_id='message-attachments' AND o.name=path
    AND o.metadata->>'mimetype'=mime AND (o.metadata->>'size')::bigint=bytes)
  THEN RAISE EXCEPTION 'Upload the selected file before sending' USING ERRCODE='23514'; END IF;
  -- A retry uses the same uploaded path and returns the original message.
  SELECT a.message_id INTO message FROM public.message_attachments a WHERE a.storage_path=path AND a.owner_id=actor AND a.recipient_id=recipient;
  IF message IS NOT NULL THEN RETURN message; END IF;
  message:=public.kinra_send_message(recipient,body,actor);
  INSERT INTO public.message_attachments(message_id,owner_id,recipient_id,storage_path,filename,mime,bytes)
  VALUES(message,actor,recipient,path,filename,mime,bytes);
  RETURN message;
END $$;
REVOKE ALL ON FUNCTION public.kinra_send_attachment(uuid,text,text,text,text,bigint,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.kinra_send_attachment(uuid,text,text,text,text,bigint,uuid) TO authenticated,service_role;
