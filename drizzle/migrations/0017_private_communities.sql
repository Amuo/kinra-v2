-- Private group membership is deliberate. Workspace roles and organization
-- staff never imply community access. Existing self-joined public groups stay
-- valid; manual bearer invitations add private membership only after acceptance.
CREATE TABLE public.community_members (
 group_id uuid NOT NULL REFERENCES public.feature_records(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 joined_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(group_id,user_id)
);
CREATE TABLE public.community_moderators (
 group_id uuid NOT NULL REFERENCES public.feature_records(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(group_id,user_id)
);
CREATE TABLE public.community_invites (
 code uuid PRIMARY KEY DEFAULT gen_random_uuid(), group_id uuid NOT NULL REFERENCES public.feature_records(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL,
 revoked_at timestamptz, used_at timestamptz, used_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
 CHECK(expires_at>=created_at+interval '5 minutes' AND expires_at<=created_at+interval '30 days')
);
CREATE TABLE public.community_removals (
 group_id uuid NOT NULL REFERENCES public.feature_records(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(group_id,user_id)
);
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_moderators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_removals ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.community_members,public.community_moderators,public.community_invites FROM PUBLIC,anon,authenticated;
GRANT SELECT,DELETE ON public.community_members,public.community_moderators TO authenticated;
GRANT INSERT(group_id,user_id) ON public.community_members,public.community_moderators TO authenticated;
GRANT SELECT ON public.community_invites TO authenticated;
GRANT INSERT(group_id,expires_at) ON public.community_invites TO authenticated;
GRANT UPDATE(revoked_at) ON public.community_invites TO authenticated;
GRANT ALL ON public.community_members,public.community_moderators,public.community_invites TO service_role;
REVOKE ALL ON public.community_removals FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT(group_id,user_id) ON public.community_removals TO authenticated;
GRANT ALL ON public.community_removals TO service_role;

-- Narrow caller-role projection avoids recursion and reveals no other account
-- attributes. Blocking a group's owner removes that group's shared audience.
CREATE FUNCTION public.kinra_community_role(target_group uuid) RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT CASE WHEN g.owner_id=auth.uid() THEN 'owner'
  WHEN NOT EXISTS(SELECT 1 FROM public.community_removals r WHERE r.group_id=g.id AND r.user_id=auth.uid()) AND (EXISTS(SELECT 1 FROM public.community_members m WHERE m.group_id=g.id AND m.user_id=auth.uid()) OR EXISTS(SELECT 1 FROM public.feature_records m WHERE m.kind='group_member' AND m.owner_id=auth.uid() AND m.payload->>'group_id'=g.id::text))
  THEN CASE WHEN EXISTS(SELECT 1 FROM public.community_moderators m WHERE m.group_id=g.id AND m.user_id=auth.uid()) THEN 'moderator' ELSE 'member' END END
 FROM public.feature_records g WHERE auth.uid() IS NOT NULL AND g.id=target_group AND g.kind='group' AND NOT public.kinra_feature_blocked(g.owner_id)
$$;
CREATE OR REPLACE FUNCTION public.kinra_group_visible(group_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.feature_records g WHERE g.id=group_id AND g.kind='group' AND NOT public.kinra_feature_blocked(g.owner_id) AND (g.visibility='public' OR public.kinra_community_role(g.id) IS NOT NULL))
$$;
CREATE POLICY "Members see private community content" ON public.feature_records FOR SELECT TO authenticated USING(
 kind='group' AND public.kinra_community_role(id) IS NOT NULL OR
 kind IN ('post','group_member') AND payload ? 'group_id' AND public.kinra_community_role((payload->>'group_id')::uuid) IS NOT NULL AND NOT public.kinra_feature_blocked(owner_id)
);
CREATE POLICY "Community roster" ON public.community_members FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.kinra_community_role(group_id) IS NOT NULL);
CREATE POLICY "Public self join" ON public.community_members FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid() AND NOT EXISTS(SELECT 1 FROM public.community_removals r WHERE r.group_id=community_members.group_id AND r.user_id=auth.uid()) AND EXISTS(SELECT 1 FROM public.feature_records g WHERE g.id=group_id AND g.kind='group' AND g.visibility='public' AND NOT public.kinra_feature_blocked(g.owner_id)));
CREATE POLICY "Leave or remove regular community member" ON public.community_members FOR DELETE TO authenticated USING(user_id=auth.uid() OR public.kinra_community_role(group_id)='owner' OR public.kinra_community_role(group_id)='moderator' AND NOT EXISTS(SELECT 1 FROM public.community_moderators m WHERE m.group_id=community_members.group_id AND m.user_id=community_members.user_id));
CREATE POLICY "Members see moderator roles" ON public.community_moderators FOR SELECT TO authenticated USING(public.kinra_community_role(group_id) IS NOT NULL);
CREATE POLICY "Owner appoints moderator" ON public.community_moderators FOR INSERT TO authenticated WITH CHECK(public.kinra_community_role(group_id)='owner' AND (EXISTS(SELECT 1 FROM public.community_members m WHERE m.group_id=community_moderators.group_id AND m.user_id=community_moderators.user_id) OR EXISTS(SELECT 1 FROM public.feature_records m WHERE m.kind='group_member' AND m.owner_id=community_moderators.user_id AND m.payload->>'group_id'=community_moderators.group_id::text)));
CREATE POLICY "Owner removes moderator or moderator leaves" ON public.community_moderators FOR DELETE TO authenticated USING(user_id=auth.uid() OR public.kinra_community_role(group_id)='owner');
CREATE POLICY "Moderators read group invitations" ON public.community_invites FOR SELECT TO authenticated USING(public.kinra_community_role(group_id) IN ('owner','moderator'));
CREATE POLICY "Moderators create group invitations" ON public.community_invites FOR INSERT TO authenticated WITH CHECK(public.kinra_community_role(group_id) IN ('owner','moderator'));
CREATE POLICY "Moderators revoke group invitations" ON public.community_invites FOR UPDATE TO authenticated USING(public.kinra_community_role(group_id) IN ('owner','moderator')) WITH CHECK(public.kinra_community_role(group_id) IN ('owner','moderator'));
CREATE POLICY "Removal history is scoped" ON public.community_removals FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.kinra_community_role(group_id) IN ('owner','moderator'));
CREATE POLICY "Moderators remove regular members" ON public.community_removals FOR INSERT TO authenticated WITH CHECK(
 user_id<>auth.uid() AND EXISTS(SELECT 1 FROM public.feature_records g WHERE g.id=group_id AND g.kind='group' AND g.owner_id<>community_removals.user_id) AND (public.kinra_community_role(group_id)='owner' OR public.kinra_community_role(group_id)='moderator' AND NOT EXISTS(SELECT 1 FROM public.community_moderators m WHERE m.group_id=community_removals.group_id AND m.user_id=community_removals.user_id))
);
CREATE POLICY "Moderators remove member posts" ON public.feature_records FOR DELETE TO authenticated USING(kind='post' AND payload ? 'group_id' AND public.kinra_community_role((payload->>'group_id')::uuid) IN ('owner','moderator'));
CREATE POLICY "Moderators remove legacy group memberships" ON public.feature_records FOR DELETE TO authenticated USING(kind='group_member' AND payload ? 'group_id' AND (public.kinra_community_role((payload->>'group_id')::uuid)='owner' OR public.kinra_community_role((payload->>'group_id')::uuid)='moderator' AND NOT EXISTS(SELECT 1 FROM public.community_moderators m WHERE m.group_id=(payload->>'group_id')::uuid AND m.user_id=feature_records.owner_id)));

-- Feature reactions/reports must recognize private group content too, while
-- maintaining the original ownership, published and assigned-plan audiences.
CREATE OR REPLACE FUNCTION public.kinra_feature_visible(record_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.feature_records r WHERE r.id=record_id AND (
 r.owner_id=auth.uid() OR
 r.kind='group' AND public.kinra_community_role(r.id) IS NOT NULL OR
 r.kind='post' AND r.payload ? 'group_id' AND public.kinra_community_role((r.payload->>'group_id')::uuid) IS NOT NULL AND NOT public.kinra_feature_blocked(r.owner_id) OR
 r.visibility='public' AND NOT public.kinra_feature_blocked(r.owner_id) AND (r.kind<>'post' OR NOT r.payload ? 'group_id' OR public.kinra_group_visible((r.payload->>'group_id')::uuid)) OR
 r.client_id=auth.uid() AND EXISTS(SELECT 1 FROM public.trainer_clients c WHERE c.client_id=r.client_id AND c.trainer_id=r.owner_id)))
$$;

-- This invoker trigger checks only caller-visible group membership. It rejects
-- moving a post between group/personal audiences and direct stale-member edits.
CREATE FUNCTION public.kinra_guard_community_post() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE parent public.feature_records;
BEGIN
 IF NEW.kind='group_member' AND EXISTS(SELECT 1 FROM public.community_removals r WHERE r.group_id=(NEW.payload->>'group_id')::uuid AND r.user_id=NEW.owner_id) THEN RAISE EXCEPTION 'A moderator must issue a new invitation before you can rejoin.' USING ERRCODE='42501'; END IF;
 IF NEW.kind<>'post' THEN RETURN NEW; END IF;
 IF TG_OP='UPDATE' AND NEW.payload->>'group_id' IS DISTINCT FROM OLD.payload->>'group_id' THEN RAISE EXCEPTION 'A post cannot be moved to another audience.' USING ERRCODE='23514'; END IF;
 IF NEW.payload ? 'group_id' THEN
  SELECT * INTO parent FROM public.feature_records WHERE id=(NEW.payload->>'group_id')::uuid AND kind='group';
  IF parent.id IS NULL OR public.kinra_community_role(parent.id) IS NULL THEN RAISE EXCEPTION 'Join this group before posting.' USING ERRCODE='42501'; END IF;
  IF parent.visibility='private' AND NEW.visibility<>'private' THEN RAISE EXCEPTION 'Private group posts must remain private.' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
-- This runs before the original feature guard; that guard is supplemented below
-- with private memberships through a narrow membership compatibility helper.
CREATE TRIGGER guard_community_post BEFORE INSERT OR UPDATE ON public.feature_records FOR EACH ROW EXECUTE FUNCTION public.kinra_guard_community_post();

-- The original guard only recognizes legacy group_member feature rows. Replace
-- that one condition with the role helper so accepted private memberships work
-- too. Fail explicitly if its reviewed source changed; no guard is bypassed and
-- no caller-controlled session setting acts as authorization.
DO $replace_guard$
DECLARE definition text;
BEGIN
 SELECT pg_get_functiondef('public.kinra_guard_feature()'::regprocedure) INTO definition;
 definition:=replace(definition,
  'IF NEW.kind=''post'' AND parent.owner_id<>NEW.owner_id AND NOT EXISTS(SELECT 1 FROM feature_records m WHERE m.kind=''group_member'' AND m.owner_id=NEW.owner_id AND m.payload->>''group_id''=parent.id::text) THEN',
  'IF NEW.kind=''post'' AND public.kinra_community_role(parent.id) IS NULL THEN');
 IF definition=pg_get_functiondef('public.kinra_guard_feature()'::regprocedure) THEN RAISE EXCEPTION 'The community guard requires the reviewed feature guard version.'; END IF;
 EXECUTE definition;
END $replace_guard$;

-- Names are the only profile projection exposed to an authorized group roster.
CREATE FUNCTION public.kinra_community_name(target_group uuid,person_id uuid) RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT p.display_name FROM public.profiles p WHERE p.id=person_id AND public.kinra_community_role(target_group) IS NOT NULL AND (
 EXISTS(SELECT 1 FROM public.feature_records g WHERE g.id=target_group AND g.kind='group' AND g.owner_id=person_id) OR
 EXISTS(SELECT 1 FROM public.community_members m WHERE m.group_id=target_group AND m.user_id=person_id) OR
 EXISTS(SELECT 1 FROM public.feature_records m WHERE m.kind='group_member' AND m.owner_id=person_id AND m.payload->>'group_id'=target_group::text))
$$;

-- Single-use invitation acceptance must read a secret bearer row and add a
-- private membership; the narrowly scoped definer is necessary for that atomic
-- transition. No raw invitation lookup is granted to its recipient.
CREATE FUNCTION public.kinra_community_redeem(invitation_code uuid,accept boolean,expected_owner uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid(); invitation public.community_invites; community public.feature_records;
BEGIN
 IF actor IS NULL OR actor IS DISTINCT FROM expected_owner OR accept IS NULL THEN RAISE EXCEPTION 'Your account changed. Reopen this screen.' USING ERRCODE='42501'; END IF;
 SELECT * INTO invitation FROM public.community_invites WHERE code=invitation_code FOR UPDATE;
 SELECT * INTO community FROM public.feature_records WHERE id=invitation.group_id AND kind='group';
 IF invitation.code IS NULL OR community.id IS NULL OR public.kinra_feature_blocked(community.owner_id) OR invitation.revoked_at IS NOT NULL OR invitation.expires_at<=now() OR invitation.used_at IS NOT NULL AND invitation.used_by IS DISTINCT FROM actor OR EXISTS(SELECT 1 FROM public.community_removals r WHERE r.group_id=community.id AND r.user_id=actor AND r.created_at>=invitation.created_at) THEN RAISE EXCEPTION 'This invitation is unavailable or expired.' USING ERRCODE='42501'; END IF;
 IF invitation.used_at IS NOT NULL AND public.kinra_community_role(community.id) IS NULL THEN RAISE EXCEPTION 'This invitation has already been used.' USING ERRCODE='42501'; END IF;
 IF accept AND invitation.used_at IS NULL THEN
  DELETE FROM public.community_removals WHERE group_id=community.id AND user_id=actor;
  INSERT INTO public.community_members(group_id,user_id) VALUES(community.id,actor) ON CONFLICT DO NOTHING;
  UPDATE public.community_invites SET used_at=now(),used_by=actor WHERE code=invitation_code;
 END IF;
 RETURN jsonb_build_object('groupId',community.id,'title',community.payload->>'title','visibility',community.visibility,'expiresAt',invitation.expires_at,'accepted',accept OR invitation.used_at IS NOT NULL);
END $$;

CREATE FUNCTION public.kinra_community_admin(action text,group_id uuid,data jsonb,expected_owner uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid(); authority text; community public.feature_records; result jsonb; target uuid; affected integer;
BEGIN
 IF actor IS NULL OR actor IS DISTINCT FROM expected_owner THEN RAISE EXCEPTION 'Your account changed. Reopen this screen.' USING ERRCODE='42501'; END IF;
 IF action='personalMemberships' THEN
  SELECT coalesce(jsonb_agg(jsonb_build_object('groupId',m.group_id,'userId',m.user_id,'joinedAt',m.joined_at) ORDER BY m.joined_at),'[]'::jsonb) INTO result FROM public.community_members m WHERE m.user_id=actor; RETURN result;
 END IF;
 IF action='list' THEN
  SELECT coalesce(jsonb_agg(jsonb_build_object('id',g.id,'title',g.payload->>'title','description',g.payload->>'description','type',g.payload->>'type','visibility',g.visibility,'role',public.kinra_community_role(g.id)) ORDER BY g.created_at DESC),'[]'::jsonb) INTO result FROM public.feature_records g WHERE g.kind='group'; RETURN result;
 END IF;
 SELECT * INTO community FROM public.feature_records g WHERE g.id=kinra_community_admin.group_id AND g.kind='group';
 IF community.id IS NULL THEN RAISE EXCEPTION 'This group is unavailable.' USING ERRCODE='42501'; END IF;
 authority:=public.kinra_community_role(community.id);
 IF action='join' THEN
  IF community.visibility<>'public' THEN RAISE EXCEPTION 'Accept an invitation to join a private group.' USING ERRCODE='42501'; END IF;
  IF EXISTS(SELECT 1 FROM public.community_removals r WHERE r.group_id=community.id AND r.user_id=actor) THEN RAISE EXCEPTION 'A moderator must issue a new invitation before you can rejoin.' USING ERRCODE='42501'; END IF;
  IF authority IS NULL THEN INSERT INTO public.community_members(group_id,user_id) VALUES(community.id,actor) ON CONFLICT DO NOTHING; END IF; RETURN 'null'::jsonb;
 ELSIF action='removePost' THEN
  DELETE FROM public.feature_records p WHERE p.id=(data->>'postId')::uuid AND p.kind='post' AND p.payload->>'group_id'=community.id::text AND (p.owner_id=actor OR authority IN ('owner','moderator'));
  GET DIAGNOSTICS affected=ROW_COUNT; IF affected=0 THEN RAISE EXCEPTION 'This post is unavailable or cannot be removed by you.' USING ERRCODE='42501'; END IF; RETURN 'null'::jsonb;
 END IF;
 IF authority IS NULL THEN RAISE EXCEPTION 'Join this group first.' USING ERRCODE='42501'; END IF;
 IF action='members' THEN
  SELECT coalesce(jsonb_agg(jsonb_build_object('userId',u.user_id,'displayName',public.kinra_community_name(community.id,u.user_id),'role',CASE WHEN u.user_id=community.owner_id THEN 'owner' WHEN EXISTS(SELECT 1 FROM public.community_moderators x WHERE x.group_id=community.id AND x.user_id=u.user_id) THEN 'moderator' ELSE 'member' END,'joinedAt',u.joined_at) ORDER BY u.joined_at),'[]'::jsonb) INTO result
  FROM (SELECT people.user_id,min(people.joined_at) joined_at FROM (SELECT community.owner_id user_id,community.created_at joined_at UNION ALL SELECT m.user_id,m.joined_at FROM public.community_members m WHERE m.group_id=community.id UNION ALL SELECT m.owner_id,m.created_at FROM public.feature_records m WHERE m.kind='group_member' AND m.payload->>'group_id'=community.id::text) people GROUP BY people.user_id) u; RETURN result;
 ELSIF action='leave' THEN
  IF authority='owner' THEN RAISE EXCEPTION 'The owner must delete the group instead of leaving it.' USING ERRCODE='22023'; END IF;
  DELETE FROM public.community_moderators m WHERE m.group_id=community.id AND m.user_id=actor;
  DELETE FROM public.community_members m WHERE m.group_id=community.id AND m.user_id=actor;
  DELETE FROM public.feature_records m WHERE m.kind='group_member' AND m.owner_id=actor AND m.payload->>'group_id'=community.id::text;
  RETURN 'null'::jsonb;
 END IF;
 IF authority NOT IN ('owner','moderator') THEN RAISE EXCEPTION 'A group moderator must review this action.' USING ERRCODE='42501'; END IF;
 IF action='createInvite' THEN
  INSERT INTO public.community_invites(group_id,expires_at) VALUES(community.id,(data->>'expiresAt')::timestamptz) RETURNING jsonb_build_object('code',code,'groupId',community_invites.group_id,'expiresAt',expires_at,'revokedAt',revoked_at,'usedAt',used_at,'usedBy',used_by) INTO result; RETURN result;
 ELSIF action='invites' THEN
  SELECT coalesce(jsonb_agg(jsonb_build_object('code',code,'groupId',i.group_id,'expiresAt',expires_at,'revokedAt',revoked_at,'usedAt',used_at,'usedBy',used_by) ORDER BY created_at DESC),'[]'::jsonb) INTO result FROM public.community_invites i WHERE i.group_id=community.id; RETURN result;
 ELSIF action='revokeInvite' THEN
  UPDATE public.community_invites i SET revoked_at=now() WHERE i.group_id=community.id AND i.code=(data->>'code')::uuid; RETURN 'null'::jsonb;
 ELSIF action='setModerator' THEN
  IF authority<>'owner' OR NOT(data ? 'enabled') OR data->>'enabled' NOT IN ('true','false') OR NOT EXISTS(SELECT 1 FROM public.community_members m WHERE m.group_id=community.id AND m.user_id=(data->>'userId')::uuid UNION ALL SELECT 1 FROM public.feature_records m WHERE m.kind='group_member' AND m.owner_id=(data->>'userId')::uuid AND m.payload->>'group_id'=community.id::text) THEN RAISE EXCEPTION 'Only the owner can change an existing member moderator role.' USING ERRCODE='42501'; END IF;
  IF (data->>'enabled')::boolean THEN INSERT INTO public.community_moderators(group_id,user_id) VALUES(community.id,(data->>'userId')::uuid) ON CONFLICT DO NOTHING; ELSE DELETE FROM public.community_moderators m WHERE m.group_id=community.id AND m.user_id=(data->>'userId')::uuid; END IF; RETURN 'null'::jsonb;
 ELSIF action='kick' THEN
  target:=(data->>'userId')::uuid;
  IF target=community.owner_id OR target=actor OR authority='moderator' AND EXISTS(SELECT 1 FROM public.community_moderators m WHERE m.group_id=community.id AND m.user_id=target) THEN RAISE EXCEPTION 'A moderator cannot remove the owner or another moderator. Use Leave for yourself.' USING ERRCODE='42501'; END IF;
  INSERT INTO public.community_removals(group_id,user_id) VALUES(community.id,target) ON CONFLICT DO NOTHING;
  DELETE FROM public.community_moderators m WHERE m.group_id=community.id AND m.user_id=target;
  DELETE FROM public.community_members m WHERE m.group_id=community.id AND m.user_id=target;
  DELETE FROM public.feature_records m WHERE m.kind='group_member' AND m.owner_id=target AND m.payload->>'group_id'=community.id::text;
  RETURN 'null'::jsonb;
 END IF;
 RAISE EXCEPTION 'Unsupported community action.' USING ERRCODE='22023';
END $$;
REVOKE ALL ON FUNCTION public.kinra_community_role(uuid),public.kinra_community_name(uuid,uuid),public.kinra_guard_community_post(),public.kinra_community_redeem(uuid,boolean,uuid),public.kinra_community_admin(text,uuid,jsonb,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.kinra_community_role(uuid),public.kinra_community_name(uuid,uuid),public.kinra_community_redeem(uuid,boolean,uuid),public.kinra_community_admin(text,uuid,jsonb,uuid) TO authenticated,service_role;
