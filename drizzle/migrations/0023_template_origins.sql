-- Display provenance only. No copied content or author edits are rewritten.
CREATE OR REPLACE FUNCTION public.kinra_template_origins(expected_owner uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid(); result jsonb;
BEGIN
 IF actor IS NULL OR actor IS DISTINCT FROM expected_owner THEN
  RAISE EXCEPTION 'Your account changed. Reopen this screen before saving.' USING ERRCODE='42501';
 END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('target_id',coalesce(a.program_id,a.feature_id),'kind',a.kind,'id',a.template_id,'version',a.content_version)),'[]'::jsonb)
 INTO result FROM public.template_adoptions a WHERE
 (a.program_id IS NOT NULL AND EXISTS(SELECT 1 FROM public.programs p WHERE p.id=a.program_id AND p.trainer_id=a.owner_id AND NOT public.kinra_feature_blocked(p.trainer_id) AND
  (p.trainer_id=actor OR (EXISTS(SELECT 1 FROM public.program_assignments x WHERE x.program_id=p.id AND x.client_id=actor AND x.trainer_id=p.trainer_id)
   AND EXISTS(SELECT 1 FROM public.trainer_clients c WHERE c.trainer_id=p.trainer_id AND c.client_id=actor)))))
 OR (a.feature_id IS NOT NULL AND EXISTS(SELECT 1 FROM public.feature_records f WHERE f.id=a.feature_id AND f.owner_id=a.owner_id AND f.kind='nutrition_plan'
  AND (f.owner_id=actor OR (f.client_id=actor AND EXISTS(SELECT 1 FROM public.trainer_clients c WHERE c.trainer_id=f.owner_id AND c.client_id=actor)))
  AND NOT public.kinra_feature_blocked(f.owner_id)));
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.kinra_template_origins(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.kinra_template_origins(uuid) TO authenticated,service_role;
