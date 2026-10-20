CREATE TABLE public.account_roles (
 owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
 role text NOT NULL CHECK(role IN ('solo','client','trainer','specialist','organization')),
 created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(owner_id,role)
);
CREATE TABLE public.account_context (
 owner_id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
 active_role text NOT NULL,
 FOREIGN KEY(owner_id,active_role) REFERENCES public.account_roles(owner_id,role)
);
ALTER TABLE public.account_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_context ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.account_roles,public.account_context FROM PUBLIC,anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.account_roles,public.account_context TO authenticated;
GRANT ALL ON public.account_roles,public.account_context TO service_role;
CREATE POLICY "Own workspace roles" ON public.account_roles FOR ALL TO authenticated USING(owner_id=(SELECT auth.uid())) WITH CHECK(owner_id=(SELECT auth.uid()));
CREATE POLICY "Own active workspace" ON public.account_context FOR ALL TO authenticated USING(owner_id=(SELECT auth.uid())) WITH CHECK(owner_id=(SELECT auth.uid()));

-- Preserve the existing narrow definer boolean helper, including private role
-- membership lookup needed when a client checks a coach's public code.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid,_role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role)
 OR EXISTS(SELECT 1 FROM public.account_roles WHERE owner_id=_user_id AND (role=_role::text OR (_role::text='trainer' AND role='specialist')))
$$;
REVOKE ALL ON FUNCTION public.has_role(uuid,public.app_role) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid,public.app_role) TO authenticated,service_role;

CREATE FUNCTION public.kinra_account_workspaces(expected_owner uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid(); original text; active text; available jsonb;
BEGIN
 IF actor IS NULL OR actor IS DISTINCT FROM expected_owner THEN RAISE EXCEPTION 'Your account changed. Reopen this screen before saving.' USING ERRCODE='42501'; END IF;
 SELECT role::text INTO original FROM public.user_roles WHERE user_id=actor;
 SELECT active_role INTO active FROM public.account_context WHERE owner_id=actor;
 SELECT coalesce(jsonb_agg(role ORDER BY role),'[]'::jsonb) INTO available FROM (SELECT role FROM public.account_roles WHERE owner_id=actor UNION SELECT original WHERE original IS NOT NULL) q;
 RETURN jsonb_build_object('active',coalesce(active,original),'primary',original,'roles',available);
END $$;
CREATE FUNCTION public.kinra_set_workspace(workspace text,add_role boolean,expected_owner uuid) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid(); original text;
BEGIN
 IF actor IS NULL OR actor IS DISTINCT FROM expected_owner THEN RAISE EXCEPTION 'Your account changed. Reopen this screen before saving.' USING ERRCODE='42501'; END IF;
 IF workspace IS NULL OR workspace NOT IN ('solo','client','trainer','specialist','organization') OR add_role IS NULL THEN RAISE EXCEPTION 'Choose a supported workspace.' USING ERRCODE='22023'; END IF;
 SELECT role::text INTO original FROM public.user_roles WHERE user_id=actor;
 IF original IS NULL THEN RAISE EXCEPTION 'Complete your account setup first.' USING ERRCODE='22023'; END IF;
 INSERT INTO public.account_roles(owner_id,role) VALUES(actor,original) ON CONFLICT DO NOTHING;
 IF add_role THEN INSERT INTO public.account_roles(owner_id,role) VALUES(actor,workspace) ON CONFLICT DO NOTHING; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.account_roles WHERE owner_id=actor AND role=workspace) THEN RAISE EXCEPTION 'Add this workspace before switching to it.' USING ERRCODE='42501'; END IF;
 INSERT INTO public.account_context(owner_id,active_role) VALUES(actor,workspace) ON CONFLICT(owner_id) DO UPDATE SET active_role=excluded.active_role;
END $$;
REVOKE ALL ON FUNCTION public.kinra_account_workspaces(uuid),public.kinra_set_workspace(text,boolean,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.kinra_account_workspaces(uuid),public.kinra_set_workspace(text,boolean,uuid) TO authenticated,service_role;
