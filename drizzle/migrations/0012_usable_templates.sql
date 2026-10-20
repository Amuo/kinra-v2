-- Every account can own private training plans; assignment still requires a
-- real coach/client relationship under the existing assignment policies.
DROP POLICY "trainer owns" ON public.programs;
CREATE POLICY "Own personal programs" ON public.programs FOR ALL TO authenticated
  USING(trainer_id=(SELECT auth.uid())) WITH CHECK(trainer_id=(SELECT auth.uid()));

CREATE TABLE public.template_catalogue (
  id text PRIMARY KEY CHECK(length(id) BETWEEN 1 AND 120),
  kind text NOT NULL CHECK(kind IN ('training','nutrition')),
  content_version integer NOT NULL DEFAULT 1 CHECK(content_version>0),
  payload jsonb NOT NULL CHECK(jsonb_typeof(payload)='object' AND payload ?& ARRAY['en','bs','de']),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.template_catalogue ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.template_catalogue FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.template_catalogue TO authenticated;
GRANT ALL ON public.template_catalogue TO service_role;
CREATE POLICY "Read published templates" ON public.template_catalogue FOR SELECT TO authenticated USING(true);

CREATE TABLE public.template_adoptions (
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  template_id text NOT NULL REFERENCES public.template_catalogue(id),
  kind text NOT NULL CHECK(kind IN ('training','nutrition')),
  content_version integer NOT NULL,
  program_id uuid REFERENCES public.programs(id) ON DELETE SET NULL,
  feature_id uuid REFERENCES public.feature_records(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(owner_id,template_id),
  CHECK((kind='training' AND feature_id IS NULL) OR (kind='nutrition' AND program_id IS NULL))
);
CREATE INDEX template_adoptions_program_idx ON public.template_adoptions(program_id) WHERE program_id IS NOT NULL;
CREATE INDEX template_adoptions_feature_idx ON public.template_adoptions(feature_id) WHERE feature_id IS NOT NULL;
ALTER TABLE public.template_adoptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.template_adoptions FROM PUBLIC,anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.template_adoptions TO authenticated;
GRANT ALL ON public.template_adoptions TO service_role;
CREATE POLICY "Own template copies" ON public.template_adoptions FOR ALL TO authenticated
  USING(owner_id=(SELECT auth.uid())) WITH CHECK(owner_id=(SELECT auth.uid())
    AND EXISTS(SELECT 1 FROM public.template_catalogue t WHERE t.id=template_adoptions.template_id AND t.kind=template_adoptions.kind)
    AND (program_id IS NULL OR EXISTS(SELECT 1 FROM public.programs p WHERE p.id=program_id AND p.trainer_id=(SELECT auth.uid())))
    AND (feature_id IS NULL OR EXISTS(SELECT 1 FROM public.feature_records f WHERE f.id=feature_id AND f.owner_id=(SELECT auth.uid()) AND f.kind='nutrition_plan' AND f.client_id IS NULL AND f.visibility='private')));

CREATE FUNCTION public.kinra_adopt_template(template_key text,locale text,expected_owner uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid(); source public.template_catalogue; receipt public.template_adoptions; data jsonb; target uuid;
BEGIN
  IF actor IS NULL OR actor IS DISTINCT FROM expected_owner THEN RAISE EXCEPTION 'Your account changed. Reopen this screen before saving.' USING ERRCODE='42501'; END IF;
  IF locale IS NULL OR locale NOT IN ('en','bs','de') THEN RAISE EXCEPTION 'Choose a supported language.' USING ERRCODE='22023'; END IF;
  SELECT * INTO source FROM public.template_catalogue WHERE id=template_key;
  IF NOT FOUND THEN RAISE EXCEPTION 'This template is no longer available.' USING ERRCODE='22023'; END IF;
  INSERT INTO public.template_adoptions(owner_id,template_id,kind,content_version) VALUES(actor,source.id,source.kind,source.content_version)
    ON CONFLICT(owner_id,template_id) DO NOTHING;
  SELECT * INTO receipt FROM public.template_adoptions WHERE owner_id=actor AND template_id=source.id FOR UPDATE;
  target:=coalesce(receipt.program_id,receipt.feature_id);
  IF target IS NOT NULL THEN
    RETURN jsonb_build_object('id',target,'kind',source.kind,'alreadySaved',true);
  END IF;
  data:=source.payload->locale;
  target:=gen_random_uuid();
  IF source.kind='training' THEN
    INSERT INTO public.programs(id,trainer_id,name,description,weeks,days) VALUES(target,actor,data->>'name',data->>'description',(data->>'weeks')::integer,data->'days');
    UPDATE public.template_adoptions SET program_id=target,content_version=source.content_version WHERE owner_id=actor AND template_id=source.id;
  ELSE
    INSERT INTO public.feature_records(id,owner_id,kind,payload,visibility) VALUES(target,actor,'nutrition_plan',data,'private');
    UPDATE public.template_adoptions SET feature_id=target,content_version=source.content_version WHERE owner_id=actor AND template_id=source.id;
  END IF;
  RETURN jsonb_build_object('id',target,'kind',source.kind,'alreadySaved',false);
END $$;
REVOKE ALL ON FUNCTION public.kinra_adopt_template(text,text,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.kinra_adopt_template(text,text,uuid) TO authenticated,service_role;
