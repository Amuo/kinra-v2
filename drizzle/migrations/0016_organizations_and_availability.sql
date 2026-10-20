-- Organization authority is independent of account workspace selection and coach
-- connections. No organization policy grants access to health records.
CREATE TABLE public.organization_staff (
 organization_id uuid NOT NULL REFERENCES public.feature_records(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 role text NOT NULL CHECK(role IN ('manager','staff')),
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(organization_id,user_id)
);
CREATE TABLE public.organization_invites (
 code uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id uuid NOT NULL REFERENCES public.feature_records(id) ON DELETE CASCADE,
 role text NOT NULL CHECK(role IN ('manager','staff')),
 created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL,
 revoked_at timestamptz, used_at timestamptz, used_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
 CHECK(expires_at>=created_at+interval '5 minutes' AND expires_at<=created_at+interval '30 days')
);
CREATE TABLE public.organization_memberships (
 organization_id uuid NOT NULL REFERENCES public.feature_records(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 status text NOT NULL CHECK(status IN ('active','paused','ended')),
 start_date date NOT NULL, end_date date, plan_id uuid REFERENCES public.feature_records(id) ON DELETE SET NULL,
 updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(organization_id,user_id),
 CHECK(end_date IS NULL OR end_date>=start_date)
);
-- Finance and internal bookkeeping notes are withheld from read-only staff.
CREATE TABLE public.organization_membership_finance (
 organization_id uuid NOT NULL, user_id uuid NOT NULL,
 paid_amount numeric CHECK(paid_amount>=0 AND paid_amount<=1000000),
 currency text CHECK(currency IN ('EUR','USD','BAM','GBP')), notes text NOT NULL DEFAULT '' CHECK(length(notes)<=1000),
 PRIMARY KEY(organization_id,user_id),
 FOREIGN KEY(organization_id,user_id) REFERENCES public.organization_memberships ON DELETE CASCADE,
 CHECK(paid_amount IS NULL OR currency IS NOT NULL)
);
ALTER TABLE public.organization_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_membership_finance ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.organization_staff,public.organization_invites,public.organization_memberships,public.organization_membership_finance FROM PUBLIC,anon,authenticated;
GRANT SELECT,DELETE ON public.organization_staff TO authenticated;
GRANT UPDATE(role) ON public.organization_staff TO authenticated;
GRANT SELECT ON public.organization_invites TO authenticated;
GRANT INSERT(organization_id,role,expires_at) ON public.organization_invites TO authenticated;
GRANT UPDATE(revoked_at) ON public.organization_invites TO authenticated;
GRANT SELECT,INSERT,UPDATE ON public.organization_memberships,public.organization_membership_finance TO authenticated;
GRANT ALL ON public.organization_staff,public.organization_invites,public.organization_memberships,public.organization_membership_finance TO service_role;

-- Narrow definer: resolve only the caller's role, avoiding recursive staff RLS
-- and permitting private organization lookup. No arbitrary-user role lookup.
CREATE FUNCTION public.kinra_org_role(org_id uuid) RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT CASE WHEN o.owner_id=auth.uid() THEN 'owner' ELSE s.role END
 FROM public.feature_records o LEFT JOIN public.organization_staff s ON s.organization_id=o.id AND s.user_id=auth.uid()
 WHERE auth.uid() IS NOT NULL AND o.id=org_id AND o.kind='organization'
$$;
CREATE POLICY "Organization staff roster" ON public.organization_staff FOR SELECT TO authenticated USING(public.kinra_org_role(organization_id) IS NOT NULL);
CREATE POLICY "Owner changes staff role" ON public.organization_staff FOR UPDATE TO authenticated USING(public.kinra_org_role(organization_id)='owner') WITH CHECK(public.kinra_org_role(organization_id)='owner');
CREATE POLICY "Owner removes staff" ON public.organization_staff FOR DELETE TO authenticated USING(public.kinra_org_role(organization_id)='owner');
CREATE POLICY "Owner reads invitations" ON public.organization_invites FOR SELECT TO authenticated USING(public.kinra_org_role(organization_id)='owner');
CREATE POLICY "Owner creates invitations" ON public.organization_invites FOR INSERT TO authenticated WITH CHECK(public.kinra_org_role(organization_id)='owner');
CREATE POLICY "Owner revokes invitations" ON public.organization_invites FOR UPDATE TO authenticated USING(public.kinra_org_role(organization_id)='owner') WITH CHECK(public.kinra_org_role(organization_id)='owner');
CREATE POLICY "Organization membership roster" ON public.organization_memberships FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.kinra_org_role(organization_id) IS NOT NULL);
CREATE POLICY "Manager records membership" ON public.organization_memberships FOR INSERT TO authenticated WITH CHECK(public.kinra_org_role(organization_id) IN ('owner','manager'));
CREATE POLICY "Manager updates membership" ON public.organization_memberships FOR UPDATE TO authenticated USING(public.kinra_org_role(organization_id) IN ('owner','manager')) WITH CHECK(public.kinra_org_role(organization_id) IN ('owner','manager'));
CREATE POLICY "Manager reads membership finance" ON public.organization_membership_finance FOR SELECT TO authenticated USING(public.kinra_org_role(organization_id) IN ('owner','manager'));
CREATE POLICY "Manager records membership finance" ON public.organization_membership_finance FOR INSERT TO authenticated WITH CHECK(public.kinra_org_role(organization_id) IN ('owner','manager'));
CREATE POLICY "Manager updates membership finance" ON public.organization_membership_finance FOR UPDATE TO authenticated USING(public.kinra_org_role(organization_id) IN ('owner','manager')) WITH CHECK(public.kinra_org_role(organization_id) IN ('owner','manager'));
CREATE POLICY "Staff sees organization and joined roster only" ON public.feature_records FOR SELECT TO authenticated USING(
 kind='organization' AND public.kinra_org_role(id) IS NOT NULL OR
 kind IN ('organization_member','membership_plan') AND public.kinra_org_role((payload->>'organization_id')::uuid) IS NOT NULL
);

CREATE FUNCTION public.kinra_guard_membership() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.feature_records WHERE kind='organization_member' AND owner_id=NEW.user_id AND payload->>'organization_id'=NEW.organization_id::text) THEN RAISE EXCEPTION 'The person must join this organization first.' USING ERRCODE='23514'; END IF;
 IF NEW.plan_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.feature_records WHERE id=NEW.plan_id AND kind='membership_plan' AND payload->>'organization_id'=NEW.organization_id::text) THEN RAISE EXCEPTION 'Choose a plan from this organization.' USING ERRCODE='23514'; END IF;
 NEW.updated_at:=now(); RETURN NEW;
END $$;
CREATE TRIGGER guard_organization_membership BEFORE INSERT OR UPDATE ON public.organization_memberships FOR EACH ROW EXECUTE FUNCTION public.kinra_guard_membership();

-- Narrow display-name projection: no full profile rows, contact details or
-- health fields become visible to an organization through roster membership.
CREATE FUNCTION public.kinra_org_name(org_id uuid, person_id uuid) RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT p.display_name FROM public.profiles p WHERE p.id=person_id AND public.kinra_org_role(org_id) IS NOT NULL AND (
 EXISTS(SELECT 1 FROM public.organization_staff WHERE organization_id=org_id AND user_id=person_id) OR
 EXISTS(SELECT 1 FROM public.feature_records WHERE kind='organization_member' AND owner_id=person_id AND payload->>'organization_id'=org_id::text))
$$;

-- Only redemption can INSERT staff. The unguessable bearer code is shown for
-- review first; acceptance is atomic, signed-in, expires and is single-use.
CREATE FUNCTION public.kinra_org_redeem(invitation_code uuid, accept boolean, expected_owner uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid(); invitation public.organization_invites; org public.feature_records;
BEGIN
 IF actor IS NULL OR actor IS DISTINCT FROM expected_owner OR accept IS NULL THEN RAISE EXCEPTION 'Your account changed. Reopen this screen.' USING ERRCODE='42501'; END IF;
 SELECT * INTO invitation FROM public.organization_invites WHERE code=invitation_code FOR UPDATE;
 SELECT * INTO org FROM public.feature_records WHERE id=invitation.organization_id AND kind='organization';
 IF invitation.code IS NULL OR org.id IS NULL OR invitation.revoked_at IS NOT NULL OR invitation.expires_at<=now() OR invitation.used_at IS NOT NULL AND invitation.used_by IS DISTINCT FROM actor THEN RAISE EXCEPTION 'This invitation is unavailable or expired.' USING ERRCODE='42501'; END IF;
 IF org.owner_id=actor THEN RAISE EXCEPTION 'The owner already manages this organization.' USING ERRCODE='22023'; END IF;
 IF invitation.used_at IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.organization_staff WHERE organization_id=org.id AND user_id=actor) THEN RAISE EXCEPTION 'This invitation has already been used.' USING ERRCODE='42501'; END IF;
 IF accept AND invitation.used_at IS NULL THEN
  IF EXISTS(SELECT 1 FROM public.organization_staff WHERE organization_id=org.id AND user_id=actor) THEN RAISE EXCEPTION 'You already have a staff role. Ask the owner to change it.' USING ERRCODE='22023'; END IF;
  INSERT INTO public.organization_staff(organization_id,user_id,role) VALUES(org.id,actor,invitation.role);
  UPDATE public.organization_invites SET used_at=now(),used_by=actor WHERE code=invitation_code;
 END IF;
 RETURN jsonb_build_object('organizationId',org.id,'title',org.payload->>'name','role',invitation.role,'expiresAt',invitation.expires_at,'accepted',accept OR invitation.used_at IS NOT NULL);
END $$;

CREATE FUNCTION public.kinra_org_admin(action text, org_id uuid, data jsonb, expected_owner uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid(); authority text; result jsonb; affected integer;
BEGIN
 IF actor IS NULL OR actor IS DISTINCT FROM expected_owner THEN RAISE EXCEPTION 'Your account changed. Reopen this screen.' USING ERRCODE='42501'; END IF;
 IF action='personalMemberships' THEN
  SELECT coalesce(jsonb_agg(jsonb_build_object('organizationId',m.organization_id,'userId',m.user_id,'status',m.status,'startDate',m.start_date,'endDate',m.end_date,'planId',m.plan_id) ORDER BY m.updated_at),'[]'::jsonb) INTO result FROM public.organization_memberships m WHERE m.user_id=actor; RETURN result;
 END IF;
 IF action='list' THEN
  SELECT coalesce(jsonb_agg(jsonb_build_object('id',o.id,'title',o.payload->>'name','city',o.payload->>'city','role',public.kinra_org_role(o.id)) ORDER BY o.created_at),'[]'::jsonb) INTO result FROM public.feature_records o WHERE o.kind='organization' AND public.kinra_org_role(o.id) IS NOT NULL; RETURN result;
 END IF;
 authority:=public.kinra_org_role(org_id);
 IF authority IS NULL THEN RAISE EXCEPTION 'Organization staff access required.' USING ERRCODE='42501'; END IF;
 IF action='staff' THEN
  SELECT coalesce(jsonb_agg(jsonb_build_object('organizationId',s.organization_id,'userId',s.user_id,'displayName',public.kinra_org_name(s.organization_id,s.user_id),'role',s.role,'createdAt',s.created_at) ORDER BY s.created_at),'[]'::jsonb) INTO result FROM public.organization_staff s WHERE s.organization_id=org_id; RETURN result;
 ELSIF action='members' THEN
  SELECT coalesce(jsonb_agg(jsonb_build_object('organizationId',m.payload->>'organization_id','userId',m.owner_id,'displayName',public.kinra_org_name(org_id,m.owner_id),'joinedAt',m.created_at,'membership',CASE WHEN b.user_id IS NULL THEN NULL ELSE jsonb_build_object('organizationId',b.organization_id,'userId',b.user_id,'status',b.status,'startDate',b.start_date,'endDate',b.end_date,'planId',b.plan_id,'paidAmount',f.paid_amount,'currency',f.currency,'notes',coalesce(f.notes,'')) END) ORDER BY m.created_at),'[]'::jsonb) INTO result
  FROM public.feature_records m LEFT JOIN public.organization_memberships b ON b.organization_id=org_id AND b.user_id=m.owner_id LEFT JOIN public.organization_membership_finance f ON f.organization_id=b.organization_id AND f.user_id=b.user_id WHERE m.kind='organization_member' AND m.payload->>'organization_id'=org_id::text; RETURN result;
 ELSIF action='saveMembership' THEN
  IF authority NOT IN ('owner','manager') THEN RAISE EXCEPTION 'A manager must review membership changes.' USING ERRCODE='42501'; END IF;
  INSERT INTO public.organization_memberships(organization_id,user_id,status,start_date,end_date,plan_id) VALUES(org_id,(data->>'userId')::uuid,data->>'status',(data->>'startDate')::date,(data->>'endDate')::date,(data->>'planId')::uuid)
  ON CONFLICT(organization_id,user_id) DO UPDATE SET status=excluded.status,start_date=excluded.start_date,end_date=excluded.end_date,plan_id=excluded.plan_id;
  INSERT INTO public.organization_membership_finance(organization_id,user_id,paid_amount,currency,notes) VALUES(org_id,(data->>'userId')::uuid,(data->>'paidAmount')::numeric,data->>'currency',coalesce(data->>'notes',''))
  ON CONFLICT(organization_id,user_id) DO UPDATE SET paid_amount=excluded.paid_amount,currency=excluded.currency,notes=excluded.notes;
  RETURN 'null'::jsonb;
 END IF;
 IF authority<>'owner' THEN RAISE EXCEPTION 'Only the organization owner manages staff invitations.' USING ERRCODE='42501'; END IF;
 IF action='createInvite' THEN
  INSERT INTO public.organization_invites(organization_id,role,expires_at) VALUES(org_id,data->>'role',(data->>'expiresAt')::timestamptz) RETURNING jsonb_build_object('code',code,'organizationId',organization_invites.organization_id,'role',role,'expiresAt',expires_at,'revokedAt',revoked_at,'usedAt',used_at,'usedBy',used_by) INTO result; RETURN result;
 ELSIF action='invites' THEN
  SELECT coalesce(jsonb_agg(jsonb_build_object('code',code,'organizationId',i.organization_id,'role',role,'expiresAt',expires_at,'revokedAt',revoked_at,'usedAt',used_at,'usedBy',used_by) ORDER BY created_at DESC),'[]'::jsonb) INTO result FROM public.organization_invites i WHERE i.organization_id=org_id; RETURN result;
 ELSIF action='revokeInvite' THEN UPDATE public.organization_invites i SET revoked_at=now() WHERE i.code=(data->>'code')::uuid AND i.organization_id=org_id;
 ELSIF action='removeStaff' THEN DELETE FROM public.organization_staff s WHERE s.organization_id=org_id AND s.user_id=(data->>'userId')::uuid;
 ELSIF action='setStaffRole' THEN UPDATE public.organization_staff s SET role=data->>'role' WHERE s.organization_id=org_id AND s.user_id=(data->>'userId')::uuid;
 ELSE RAISE EXCEPTION 'Unsupported organization action.' USING ERRCODE='22023'; END IF;
 GET DIAGNOSTICS affected=ROW_COUNT;
 IF affected=0 THEN RAISE EXCEPTION 'This organization record is no longer available.' USING ERRCODE='22023'; END IF;
 RETURN 'null'::jsonb;
END $$;

CREATE FUNCTION public.kinra_valid_availability(p jsonb) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE r jsonb; seen text[]:='{}';
BEGIN
 IF p IS NULL OR jsonb_typeof(p)<>'object' OR NOT(p ?& ARRAY['timezone','published','rules','exceptions']) OR p - ARRAY['timezone','published','rules','exceptions'] <> '{}'::jsonb OR jsonb_typeof(p->'published')<>'boolean' OR NOT EXISTS(SELECT 1 FROM pg_catalog.pg_timezone_names WHERE name=p->>'timezone') OR jsonb_typeof(p->'rules')<>'array' OR jsonb_array_length(p->'rules')>28 OR jsonb_typeof(p->'exceptions')<>'array' OR jsonb_array_length(p->'exceptions')>100 THEN RETURN false; END IF;
 FOR r IN SELECT value FROM jsonb_array_elements(p->'rules') LOOP
  IF r - ARRAY['weekday','start','end','slotMinutes'] <> '{}'::jsonb OR jsonb_typeof(r->'weekday')<>'number' OR jsonb_typeof(r->'slotMinutes')<>'number' OR (r->>'weekday')!~'^[0-6]$' OR (r->>'start')!~'^([01][0-9]|2[0-3]):[0-5][0-9]$' OR (r->>'end')!~'^([01][0-9]|2[0-3]):[0-5][0-9]$' OR (r->>'slotMinutes')!~'^[0-9]+$' OR (r->>'slotMinutes')::integer NOT BETWEEN 10 AND 240 OR r->>'end'<=r->>'start' OR NOT (r ?& ARRAY['weekday','start','end','slotMinutes']) THEN RETURN false; END IF;
 END LOOP;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p->'rules') a JOIN jsonb_array_elements(p->'rules') b ON a.value<b.value AND a.value->>'weekday'=b.value->>'weekday' AND a.value->>'start'<b.value->>'end' AND a.value->>'end'>b.value->>'start') THEN RETURN false; END IF;
 IF (SELECT count(*) FROM jsonb_array_elements(p->'rules'))<>(SELECT count(DISTINCT value) FROM jsonb_array_elements(p->'rules')) THEN RETURN false; END IF;
 FOR r IN SELECT value FROM jsonb_array_elements(p->'exceptions') LOOP
  IF r - ARRAY['date','unavailable','start','end','slotMinutes'] <> '{}'::jsonb OR NOT(r ?& ARRAY['date','unavailable']) OR (r->>'date')!~'^[0-9]{4}-[0-9]{2}-[0-9]{2}$' OR (r->>'date')::date::text<>r->>'date' OR jsonb_typeof(r->'unavailable')<>'boolean' OR r->>'date'=ANY(seen) THEN RETURN false; END IF;
  seen:=array_append(seen,r->>'date');
  IF NOT (r->>'unavailable')::boolean AND (NOT(r ?& ARRAY['start','end','slotMinutes']) OR (r->>'start')!~'^([01][0-9]|2[0-3]):[0-5][0-9]$' OR (r->>'end')!~'^([01][0-9]|2[0-3]):[0-5][0-9]$' OR r->>'end'<=r->>'start' OR (r->>'slotMinutes')!~'^[0-9]+$' OR (r->>'slotMinutes')::int NOT BETWEEN 10 AND 240) THEN RETURN false; END IF;
 END LOOP;
 RETURN true;
EXCEPTION WHEN OTHERS THEN RETURN false;
END $$;
CREATE TABLE public.coach_availability (
 coach_id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
 payload jsonb NOT NULL CHECK(coalesce(public.kinra_valid_availability(payload),false))
);
ALTER TABLE public.coach_availability ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.coach_availability FROM PUBLIC,anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.coach_availability TO authenticated;
GRANT ALL ON public.coach_availability TO service_role;
CREATE POLICY "Published schedule has no client information" ON public.coach_availability FOR SELECT TO authenticated USING(coach_id=auth.uid() OR (payload->>'published')::boolean);
CREATE POLICY "Coach publishes own availability" ON public.coach_availability FOR INSERT TO authenticated WITH CHECK(coach_id=auth.uid() AND public.has_role(auth.uid(),'trainer'));
CREATE POLICY "Coach changes own availability" ON public.coach_availability FOR UPDATE TO authenticated USING(coach_id=auth.uid() AND public.has_role(auth.uid(),'trainer')) WITH CHECK(coach_id=auth.uid() AND public.has_role(auth.uid(),'trainer'));
CREATE POLICY "Coach removes own availability" ON public.coach_availability FOR DELETE TO authenticated USING(coach_id=auth.uid());
CREATE FUNCTION public.kinra_availability(coach uuid, expected_owner uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM expected_owner THEN RAISE EXCEPTION 'Your account changed. Reopen this screen.' USING ERRCODE='42501'; END IF;
 SELECT payload INTO result FROM public.coach_availability WHERE coach_id=coach; RETURN result;
END $$;
CREATE FUNCTION public.kinra_save_availability(data jsonb, expected_owner uuid) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM expected_owner THEN RAISE EXCEPTION 'Your account changed. Reopen this screen.' USING ERRCODE='42501'; END IF;
 INSERT INTO public.coach_availability(coach_id,payload) VALUES(auth.uid(),data) ON CONFLICT(coach_id) DO UPDATE SET payload=excluded.payload;
END $$;

-- Pure slot generation. Each date exception replaces that day's recurring
-- hours. DST gaps/folds with a duration mismatch are skipped, never normalized
-- into a different-length appointment. Values are explicit UTC instants.
CREATE FUNCTION public.kinra_schedule_slots(p jsonb, from_day date, to_day date) RETURNS TABLE(starts_at timestamptz,ends_at timestamptz) LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE day date; r jsonb; exception jsonb; begin_local timestamp; end_local timestamp; cursor_local timestamp; span interval; zone text:=p->>'timezone'; finish timestamptz; start_instant timestamptz;
BEGIN
 IF p IS NULL OR NOT coalesce((p->>'published')::boolean,false) THEN RETURN; END IF;
 IF from_day IS NULL OR to_day IS NULL OR to_day<from_day OR to_day-from_day>31 THEN RAISE EXCEPTION 'Choose a date range of at most 32 days.' USING ERRCODE='22023'; END IF;
 FOR day IN SELECT generate_series(from_day,to_day,interval '1 day')::date LOOP
  SELECT value INTO exception FROM jsonb_array_elements(p->'exceptions') WHERE value->>'date'=day::text;
  IF exception IS NOT NULL AND (exception->>'unavailable')::boolean THEN CONTINUE; END IF;
  FOR r IN SELECT value FROM jsonb_array_elements(CASE WHEN exception IS NOT NULL THEN jsonb_build_array(exception) ELSE p->'rules' END) WHERE exception IS NOT NULL OR (value->>'weekday')::int=extract(dow FROM day)::int LOOP
   begin_local:=day+(r->>'start')::time; end_local:=day+(r->>'end')::time; span:=make_interval(mins=>(r->>'slotMinutes')::int); cursor_local:=begin_local;
   WHILE cursor_local+span<=end_local LOOP
    start_instant:=cursor_local AT TIME ZONE zone; finish:=(cursor_local+span) AT TIME ZONE zone;
    IF start_instant AT TIME ZONE zone=cursor_local AND finish AT TIME ZONE zone=cursor_local+span AND finish-start_instant=span THEN starts_at:=start_instant; ends_at:=finish; RETURN NEXT; END IF;
    cursor_local:=cursor_local+span;
   END LOOP;
  END LOOP;
 END LOOP;
END $$;

-- Narrow free/busy definer: private appointment rows must be checked to avoid
-- leaking other clients' identities. Only free slot timestamps leave this RPC.
CREATE FUNCTION public.kinra_available_slots(coach uuid, from_day date, to_day date, expected_owner uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE p jsonb; result jsonb;
BEGIN
 IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM expected_owner THEN RAISE EXCEPTION 'Your account changed. Reopen this screen.' USING ERRCODE='42501'; END IF;
 IF from_day IS NULL OR to_day IS NULL OR to_day<from_day OR to_day-from_day>31 THEN RAISE EXCEPTION 'Choose a date range of at most 32 days.' USING ERRCODE='22023'; END IF;
 SELECT payload INTO p FROM public.coach_availability WHERE coach_id=coach AND (payload->>'published')::boolean;
 SELECT coalesce(jsonb_agg(jsonb_build_object('startsAt',s.starts_at,'endsAt',s.ends_at) ORDER BY s.starts_at),'[]'::jsonb) INTO result FROM public.kinra_schedule_slots(p,from_day,to_day) s WHERE s.starts_at>now() AND NOT EXISTS(SELECT 1 FROM public.feature_records a WHERE a.kind='appointment' AND a.payload->>'coach_id'=coach::text AND a.payload->>'status' IN ('requested','confirmed') AND (a.payload->>'starts_at')::timestamptz<s.ends_at AND (a.payload->>'ends_at')::timestamptz>s.starts_at);
 RETURN result;
END $$;

-- Narrow appointment guard extends the existing authenticated feature guard.
-- Existing appointments can be cancelled/confirmed after schedule edits. New
-- or rescheduled requests must exactly match published slots; pending requests
-- reserve their time too. A per-coach lock serializes concurrent requests.
CREATE FUNCTION public.kinra_guard_appointment_slot() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE p jsonb; coach uuid; begins timestamptz; finishes timestamptz; local_day date; changed boolean;
BEGIN
 IF NEW.kind<>'appointment' OR NEW.payload->>'status'='cancelled' THEN RETURN NEW; END IF;
 changed:=TG_OP='INSERT';
 IF TG_OP='UPDATE' THEN changed:=NEW.payload->>'starts_at' IS DISTINCT FROM OLD.payload->>'starts_at' OR NEW.payload->>'ends_at' IS DISTINCT FROM OLD.payload->>'ends_at' OR OLD.payload->>'status'='cancelled'; END IF;
 coach:=(NEW.payload->>'coach_id')::uuid; begins:=(NEW.payload->>'starts_at')::timestamptz; finishes:=(NEW.payload->>'ends_at')::timestamptz;
 PERFORM pg_advisory_xact_lock(hashtextextended(coach::text,0));
 SELECT payload INTO p FROM public.coach_availability WHERE coach_id=coach AND (payload->>'published')::boolean;
 IF p IS NULL THEN RETURN NEW; END IF;
 IF changed THEN
  local_day:=(begins AT TIME ZONE (p->>'timezone'))::date;
  IF begins<=now() OR NOT EXISTS(SELECT 1 FROM public.kinra_schedule_slots(p,local_day,local_day) s WHERE s.starts_at=begins AND s.ends_at=finishes) THEN RAISE EXCEPTION 'Choose an available slot from the coach schedule.' USING ERRCODE='23514'; END IF;
 END IF;
 IF (changed OR NEW.payload->>'status'='confirmed') AND EXISTS(SELECT 1 FROM public.feature_records a WHERE a.id<>NEW.id AND a.kind='appointment' AND a.payload->>'coach_id'=coach::text AND a.payload->>'status' IN ('requested','confirmed') AND (a.payload->>'starts_at')::timestamptz<finishes AND (a.payload->>'ends_at')::timestamptz>begins) THEN RAISE EXCEPTION 'This time is no longer available.' USING ERRCODE='23505'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_published_appointment_slot BEFORE INSERT OR UPDATE ON public.feature_records FOR EACH ROW EXECUTE FUNCTION public.kinra_guard_appointment_slot();

REVOKE ALL ON FUNCTION public.kinra_org_role(uuid),public.kinra_org_name(uuid,uuid),public.kinra_guard_membership(),public.kinra_org_redeem(uuid,boolean,uuid),public.kinra_org_admin(text,uuid,jsonb,uuid),public.kinra_valid_availability(jsonb),public.kinra_availability(uuid,uuid),public.kinra_save_availability(jsonb,uuid),public.kinra_schedule_slots(jsonb,date,date),public.kinra_available_slots(uuid,date,date,uuid),public.kinra_guard_appointment_slot() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.kinra_org_role(uuid),public.kinra_org_name(uuid,uuid),public.kinra_org_redeem(uuid,boolean,uuid),public.kinra_org_admin(text,uuid,jsonb,uuid),public.kinra_valid_availability(jsonb),public.kinra_availability(uuid,uuid),public.kinra_save_availability(jsonb,uuid),public.kinra_schedule_slots(jsonb,date,date),public.kinra_available_slots(uuid,date,date,uuid) TO authenticated,service_role;
