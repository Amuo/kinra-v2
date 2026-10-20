-- Additional optional questionnaire answers remain owner-only.
CREATE OR REPLACE FUNCTION public.kinra_valid_onboarding(v jsonb) RETURNS boolean LANGUAGE plpgsql STABLE SET search_path='' AS $$
BEGIN
  IF jsonb_typeof(v) IS DISTINCT FROM 'object' OR NOT (v ?& ARRAY['role','display_name','goal','first_action','theme','language','timezone']) THEN RETURN false; END IF;
  IF EXISTS(SELECT 1 FROM jsonb_object_keys(v) k WHERE k NOT IN ('role','display_name','goal','first_action','theme','language','timezone','gender','height_cm','weight_kg','units','experience','birth_date','activity_level','city','limitations')) THEN RETURN false; END IF;
  IF jsonb_typeof(v->'display_name') IS DISTINCT FROM 'string' OR length(v->>'display_name')>80 OR jsonb_typeof(v->'goal') IS DISTINCT FROM 'string' OR length(v->>'goal')>160 THEN RETURN false; END IF;
  IF jsonb_typeof(v->'theme') IS DISTINCT FROM 'string' OR v->>'theme' NOT IN ('dark','light','system') OR jsonb_typeof(v->'language') IS DISTINCT FROM 'string' OR v->>'language' NOT IN ('en','bs','de') THEN RETURN false; END IF;
  IF jsonb_typeof(v->'timezone') IS DISTINCT FROM 'string' OR (v->>'timezone') !~ '^[A-Za-z0-9_+/-]{1,80}$' THEN RETURN false; END IF;
  IF v->'role' <> 'null'::jsonb AND (jsonb_typeof(v->'role') <> 'string' OR v->>'role' NOT IN ('solo','client','trainer')) THEN RETURN false; END IF;
  IF v->'first_action' <> 'null'::jsonb AND (jsonb_typeof(v->'first_action') <> 'string' OR v->>'first_action' NOT IN ('workout','food','sleep','connect','plan','overview','program','clients','dashboard')) THEN RETURN false; END IF;
  IF v->>'first_action' IS NOT NULL AND NOT coalesce(CASE v->>'role' WHEN 'solo' THEN v->>'first_action' IN ('workout','food','sleep') WHEN 'client' THEN v->>'first_action' IN ('connect','plan','overview') WHEN 'trainer' THEN v->>'first_action' IN ('program','clients','dashboard') ELSE false END,false) THEN RETURN false; END IF;
  IF v ? 'gender' AND v->'gender' <> 'null'::jsonb AND (jsonb_typeof(v->'gender') <> 'string' OR v->>'gender' NOT IN ('woman','man','non_binary','another_identity','prefer_not_to_say')) THEN RETURN false; END IF;
  IF v ? 'experience' AND v->'experience' <> 'null'::jsonb AND (jsonb_typeof(v->'experience') <> 'string' OR v->>'experience' NOT IN ('new','some','experienced')) THEN RETURN false; END IF;
  IF v ? 'units' AND (jsonb_typeof(v->'units') IS DISTINCT FROM 'string' OR v->>'units' NOT IN ('metric','imperial')) THEN RETURN false; END IF;
  IF v ? 'height_cm' AND v->'height_cm' <> 'null'::jsonb THEN
    IF jsonb_typeof(v->'height_cm') <> 'number' THEN RETURN false; END IF;
    IF (v->>'height_cm')::numeric NOT BETWEEN 80 AND 250 THEN RETURN false; END IF;
  END IF;
  IF v ? 'weight_kg' AND v->'weight_kg' <> 'null'::jsonb THEN
    IF jsonb_typeof(v->'weight_kg') <> 'number' THEN RETURN false; END IF;
    IF (v->>'weight_kg')::numeric NOT BETWEEN 20 AND 350 THEN RETURN false; END IF;
  END IF;

  IF v ? 'birth_date' AND v->'birth_date' <> 'null'::jsonb THEN
    IF jsonb_typeof(v->'birth_date') <> 'string' OR v->>'birth_date' !~ '^\d{4}-\d{2}-\d{2}$' THEN RETURN false; END IF;
    BEGIN IF (v->>'birth_date')::date < DATE '1900-01-01' OR (v->>'birth_date')::date > CURRENT_DATE THEN RETURN false; END IF;
    EXCEPTION WHEN datetime_field_overflow OR invalid_datetime_format THEN RETURN false; END;
  END IF;
  IF v ? 'activity_level' AND v->'activity_level' <> 'null'::jsonb AND (jsonb_typeof(v->'activity_level') <> 'string' OR v->>'activity_level' NOT IN ('low','moderate','high')) THEN RETURN false; END IF;
  IF v ? 'city' AND (jsonb_typeof(v->'city') IS DISTINCT FROM 'string' OR length(v->>'city')>100) THEN RETURN false; END IF;
  IF v ? 'limitations' AND (jsonb_typeof(v->'limitations') IS DISTINCT FROM 'string' OR length(v->>'limitations')>1000) THEN RETURN false; END IF;
  RETURN true;
END $$;

