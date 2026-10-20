-- Synthetic-only hosted acceptance, 2026-10-19. No SMTP, push delivery, HTTP or
-- binary upload calls. Storage rows below are rolled-back metadata fixtures.
-- Each assertion runs as an authenticated/anon SQL role with a synthetic JWT.
-- The final proof is reached only if every assertion succeeds before ROLLBACK.
BEGIN;
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='45s';
DO $acceptance$
DECLARE
 ids uuid[]:=ARRAY['cab1d271-99ae-4fbc-9eb9-c182d7050fe3','97d2c7ba-e234-4d62-bc14-feb21b3efc92','eb906034-1adb-4919-96d9-0777b7c6ce5d','36ec1e57-7c01-4c8a-8f8d-522602b42d53','c617fbe2-23b4-4b13-8d4c-f60c9785f534','69d877d7-6cc1-4f07-b3bc-18f54619eede','0fca04c0-d020-4ccd-a8d6-ec9c954d2853']::uuid[];
 actor uuid; owner_id uuid:=ids[1]; coach uuid:=ids[2]; manager uuid:=ids[3]; staff uuid:=ids[4]; member_id uuid:=ids[5]; other_client uuid:=ids[6]; outsider uuid:=ids[7];
 data jsonb; first_copy jsonb; second_copy jsonb; receipt jsonb; rows_seen integer; denied boolean; person uuid; trainer_code text;
 org uuid; plan uuid; invitation uuid; community uuid; community_code uuid; post uuid; appointment uuid;
 expert uuid; resource uuid; resource_path text; attachment_path text; message uuid;
 slot_day date:=current_date+7; starts timestamptz; ends timestamptz;
 endpoint text; forbidden_token text:='acceptance-not-a-dispatch-token-'||gen_random_uuid()::text||gen_random_uuid()::text;
BEGIN
 IF EXISTS(SELECT 1 FROM auth.users WHERE id=ANY(ids)) OR EXISTS(SELECT 1 FROM public.kinra_v2_profiles WHERE id=ANY(ids)) THEN RAISE EXCEPTION 'Acceptance actor collision: nothing may be overwritten.'; END IF;
 IF (SELECT count(*) FROM public.kinra_v2_template_catalogue)<>22 THEN RAISE EXCEPTION 'Expected exactly 22 template entries.'; END IF;
 FOREACH actor IN ARRAY ids LOOP
  INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES(actor,'kinra-acceptance-20261019-'||actor::text||'@example.invalid','{"display_name":"SYNTHETIC ROLLBACK ACCEPTANCE"}'::jsonb);
 END LOOP;
 -- Initial organization setup: the first action must match the new workspace.
 EXECUTE 'SET LOCAL ROLE authenticated';
 PERFORM set_config('request.jwt.claim.sub',owner_id::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true);
 data:=jsonb_build_object('role','solo','workspace','organization','first_action','organization','display_name','SYNTHETIC ORGANIZATION','goal','','theme','system','language','en','timezone','UTC','height_cm',NULL,'weight_kg',NULL,'gender',NULL,'units','metric','experience',NULL,'birth_date',NULL,'activity_level',NULL,'city','','limitations','');
 PERFORM public.kinra_v2_kinra_save_onboarding(data,4,true,owner_id);
 receipt:=public.kinra_v2_kinra_account_workspaces(owner_id);
 IF receipt->>'active' IS DISTINCT FROM 'organization' OR receipt->>'primary' IS DISTINCT FROM 'solo' OR public.kinra_v2_has_role(owner_id,'trainer') IS DISTINCT FROM false THEN RAISE EXCEPTION 'Organization onboarding authority mismatch.'; END IF;
 SELECT count(*) INTO rows_seen FROM public.kinra_v2_organization_staff;
 IF rows_seen<>0 THEN RAISE EXCEPTION 'Organization onboarding silently granted staff.'; END IF;
 -- Initial specialist setup creates its explicit workspace and original role.
 PERFORM set_config('request.jwt.claim.sub',coach::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',coach,'role','authenticated')::text,true);
 data:=data||jsonb_build_object('role','trainer','workspace','specialist','first_action','program','display_name','SYNTHETIC SPECIALIST');
 PERFORM public.kinra_v2_kinra_save_onboarding(data,4,true,coach);
 receipt:=public.kinra_v2_kinra_account_workspaces(coach);
 IF receipt->>'active' IS DISTINCT FROM 'specialist' OR receipt->>'primary' IS DISTINCT FROM 'trainer' OR public.kinra_v2_has_role(coach,'trainer') IS DISTINCT FROM true THEN RAISE EXCEPTION 'Specialist onboarding authority mismatch.'; END IF;
 SELECT count(*) INTO rows_seen FROM public.kinra_v2_trainer_clients;
 IF rows_seen<>0 THEN RAISE EXCEPTION 'Specialist onboarding silently connected clients.'; END IF;
 EXECUTE 'RESET ROLE';
 INSERT INTO public.kinra_v2_user_roles(user_id,role) VALUES(manager,'solo'),(staff,'solo'),(member_id,'client'),(other_client,'client'),(outsider,'solo');
 INSERT INTO public.kinra_v2_trainer_clients(trainer_id,client_id) VALUES(coach,member_id),(coach,other_client);
 -- Own, editable, idempotent training/nutrition copies; no foreign-owner adopt.
 EXECUTE 'SET LOCAL ROLE authenticated';
 PERFORM set_config('request.jwt.claim.sub',member_id::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',member_id,'role','authenticated')::text,true);
 first_copy:=public.kinra_v2_kinra_adopt_template('kinra-gym-foundations','bs',member_id);
 second_copy:=public.kinra_v2_kinra_adopt_template('kinra-gym-foundations','de',member_id);
 IF first_copy->>'id' IS NULL OR first_copy->>'id' IS DISTINCT FROM second_copy->>'id' OR first_copy->>'alreadySaved' IS DISTINCT FROM 'false' OR second_copy->>'alreadySaved' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'Training adoption is not idempotent.'; END IF;
 UPDATE public.kinra_v2_programs SET name='SYNTHETIC EDITED PRIVATE COPY' WHERE id=(first_copy->>'id')::uuid;
 GET DIAGNOSTICS rows_seen=ROW_COUNT;
 IF rows_seen<>1 THEN RAISE EXCEPTION 'Own adopted training copy is not editable.'; END IF;
 receipt:=public.kinra_v2_kinra_adopt_template('kinra-everyday-meals','en',member_id);
 UPDATE public.kinra_v2_feature_records SET payload=jsonb_set(payload,'{title}','"SYNTHETIC EDITED MEAL COPY"') WHERE id=(receipt->>'id')::uuid;
 GET DIAGNOSTICS rows_seen=ROW_COUNT;
 IF rows_seen<>1 THEN RAISE EXCEPTION 'Own adopted nutrition copy is not editable.'; END IF;
 denied:=false; BEGIN PERFORM public.kinra_v2_kinra_adopt_template('kinra-gym-foundations','en',outsider); EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Cross-owner adoption accepted.'; END IF;
 PERFORM set_config('request.jwt.claim.sub',outsider::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',outsider,'role','authenticated')::text,true);
 SELECT count(*) INTO rows_seen FROM public.kinra_v2_programs WHERE id=(first_copy->>'id')::uuid;
 IF rows_seen<>0 THEN RAISE EXCEPTION 'A stranger can read another adopted program.'; END IF;
 -- Organization membership and private finance; self-selected workspace has no authority.
 PERFORM set_config('request.jwt.claim.sub',owner_id::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true);
 INSERT INTO public.kinra_v2_feature_records(kind,payload,visibility) VALUES('organization','{"name":"SYNTHETIC ROLLBACK STUDIO","city":"Test"}','public') RETURNING id INTO org;
 INSERT INTO public.kinra_v2_feature_records(kind,payload,visibility) VALUES('membership_plan',jsonb_build_object('organization_id',org,'title','SYNTHETIC PLAN','amount',30,'currency','BAM','period','month'),'public') RETURNING id INTO plan;
 receipt:=public.kinra_v2_kinra_org_admin('createInvite',org,jsonb_build_object('role','manager','expiresAt',now()+interval '1 day'),owner_id);invitation:=(receipt->>'code')::uuid;
 PERFORM set_config('request.jwt.claim.sub',manager::text,true);PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',manager,'role','authenticated')::text,true);
 receipt:=public.kinra_v2_kinra_org_redeem(invitation,false,manager);
 IF receipt->>'accepted' IS DISTINCT FROM 'false' THEN RAISE EXCEPTION 'Invitation preview joined implicitly.'; END IF;
 PERFORM public.kinra_v2_kinra_org_redeem(invitation,true,manager);PERFORM public.kinra_v2_kinra_org_redeem(invitation,true,manager);
 denied:=false;BEGIN PERFORM public.kinra_v2_kinra_org_admin('createInvite',org,jsonb_build_object('role','staff','expiresAt',now()+interval '1 day'),manager);EXCEPTION WHEN insufficient_privilege THEN denied:=true;END;
 IF NOT denied THEN RAISE EXCEPTION 'Manager can grant staff authority.';END IF;
 PERFORM set_config('request.jwt.claim.sub',owner_id::text,true);PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true);
 receipt:=public.kinra_v2_kinra_org_admin('createInvite',org,jsonb_build_object('role','staff','expiresAt',now()+interval '1 day'),owner_id);invitation:=(receipt->>'code')::uuid;
 PERFORM set_config('request.jwt.claim.sub',staff::text,true);PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',staff,'role','authenticated')::text,true);
 PERFORM public.kinra_v2_kinra_org_redeem(invitation,true,staff);
 PERFORM set_config('request.jwt.claim.sub',member_id::text,true);PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',member_id,'role','authenticated')::text,true);
 INSERT INTO public.kinra_v2_feature_records(kind,payload) VALUES('organization_member',jsonb_build_object('organization_id',org));
 PERFORM set_config('request.jwt.claim.sub',manager::text,true);PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',manager,'role','authenticated')::text,true);
 PERFORM public.kinra_v2_kinra_org_admin('saveMembership',org,jsonb_build_object('userId',member_id,'status','active','startDate',current_date,'planId',plan,'paidAmount',30,'currency','BAM','notes','SYNTHETIC PRIVATE BOOKKEEPING'),manager);
 IF (public.kinra_v2_kinra_org_admin('members',org,'{}',manager)->0->'membership'->>'paidAmount')::numeric IS DISTINCT FROM 30::numeric THEN RAISE EXCEPTION 'Manager finance review failed.';END IF;
 PERFORM set_config('request.jwt.claim.sub',staff::text,true);PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',staff,'role','authenticated')::text,true);
 SELECT count(*) INTO rows_seen FROM public.kinra_v2_organization_membership_finance WHERE organization_id=org;
 IF rows_seen<>0 OR public.kinra_v2_kinra_org_admin('members',org,'{}',staff)->0->'membership'->'paidAmount' IS DISTINCT FROM 'null'::jsonb THEN RAISE EXCEPTION 'Read-only staff can see private finance.';END IF;
 PERFORM set_config('request.jwt.claim.sub',outsider::text,true);PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',outsider,'role','authenticated')::text,true);
 PERFORM public.kinra_v2_kinra_set_workspace('organization',true,outsider);
 denied:=false;BEGIN PERFORM public.kinra_v2_kinra_org_admin('members',org,'{}',outsider);EXCEPTION WHEN insufficient_privilege THEN denied:=true;END;
 IF NOT denied THEN RAISE EXCEPTION 'Workspace selection granted staff access.';END IF;
 -- A solo primary account can deliberately add Coach and be found/connected by code.
 PERFORM public.kinra_v2_kinra_set_workspace('trainer',true,outsider);
 IF public.kinra_v2_has_role(outsider,'trainer') IS DISTINCT FROM true THEN RAISE EXCEPTION 'Added coach workspace is not recognized.';END IF;
 SELECT p.trainer_code INTO trainer_code FROM public.kinra_v2_profiles p WHERE p.id=outsider;
 PERFORM set_config('request.jwt.claim.sub',other_client::text,true);PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',other_client,'role','authenticated')::text,true);
 SELECT count(*) INTO rows_seen FROM public.kinra_v2_find_trainer_by_code(' '||lower(trainer_code)||' ') found WHERE found.id=outsider;
 IF rows_seen<>1 THEN RAISE EXCEPTION 'Added coach workspace cannot be found by safe code lookup.';END IF;
 INSERT INTO public.kinra_v2_trainer_clients(trainer_id,client_id) VALUES(outsider,other_client);
 SELECT count(*) INTO rows_seen FROM public.kinra_v2_trainer_clients c WHERE c.trainer_id=outsider AND c.client_id=other_client;
 IF rows_seen<>1 THEN RAISE EXCEPTION 'Client cannot explicitly join an added coach workspace.';END IF;
 -- Private invitation, member-only post reads and immediate kicked access revocation.
 PERFORM set_config('request.jwt.claim.sub',owner_id::text,true);PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true);
 INSERT INTO public.kinra_v2_feature_records(kind,payload) VALUES('group','{"title":"SYNTHETIC PRIVATE GROUP","description":"Rollback only","type":"club"}') RETURNING id INTO community;
 INSERT INTO public.kinra_v2_feature_records(kind,payload) VALUES('post',jsonb_build_object('body','SYNTHETIC PRIVATE GROUP POST','category','General','group_id',community)) RETURNING id INTO post;
 receipt:=public.kinra_v2_kinra_community_admin('createInvite',community,jsonb_build_object('expiresAt',now()+interval '1 day'),owner_id);community_code:=(receipt->>'code')::uuid;
 PERFORM set_config('request.jwt.claim.sub',member_id::text,true);PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',member_id,'role','authenticated')::text,true);
 SELECT count(*) INTO rows_seen FROM public.kinra_v2_feature_records WHERE id=post;IF rows_seen<>0 THEN RAISE EXCEPTION 'Nonmember can read private group post.';END IF;
 PERFORM public.kinra_v2_kinra_community_redeem(community_code,false,member_id);
 SELECT count(*) INTO rows_seen FROM public.kinra_v2_feature_records WHERE id=post;IF rows_seen<>0 THEN RAISE EXCEPTION 'Invitation preview leaked private group content.';END IF;
 PERFORM public.kinra_v2_kinra_community_redeem(community_code,true,member_id);
 SELECT count(*) INTO rows_seen FROM public.kinra_v2_feature_records WHERE id=post;IF rows_seen<>1 THEN RAISE EXCEPTION 'Accepted member cannot read private group post.';END IF;
 PERFORM set_config('request.jwt.claim.sub',owner_id::text,true);PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true);
 PERFORM public.kinra_v2_kinra_community_admin('kick',community,jsonb_build_object('userId',member_id),owner_id);
 PERFORM set_config('request.jwt.claim.sub',member_id::text,true);PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',member_id,'role','authenticated')::text,true);
 SELECT count(*) INTO rows_seen FROM public.kinra_v2_feature_records WHERE id=post;IF rows_seen<>0 THEN RAISE EXCEPTION 'Kicked member retained private content access.';END IF;
 denied:=false;BEGIN PERFORM public.kinra_v2_kinra_community_redeem(community_code,true,member_id);EXCEPTION WHEN insufficient_privilege THEN denied:=true;END;
 IF NOT denied THEN RAISE EXCEPTION 'Kicked member reused an old invitation.';END IF;
 -- Published exact slots reserve pending requests; free/busy excludes all client identifiers/notes.
 PERFORM set_config('request.jwt.claim.sub',coach::text,true);PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',coach,'role','authenticated')::text,true);
 PERFORM public.kinra_v2_kinra_save_availability(jsonb_build_object('timezone','UTC','published',true,'rules',jsonb_build_array(jsonb_build_object('weekday',extract(dow from slot_day)::int,'start','09:00','end','12:00','slotMinutes',60)),'exceptions','[]'::jsonb),coach);
 starts:=(slot_day+time '09:00') AT TIME ZONE 'UTC';ends:=starts+interval '1 hour';
 PERFORM set_config('request.jwt.claim.sub',member_id::text,true);PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',member_id,'role','authenticated')::text,true);
 INSERT INTO public.kinra_v2_feature_records(kind,payload) VALUES('appointment',jsonb_build_object('coach_id',coach,'starts_at',starts,'ends_at',ends,'status','requested','notes','SYNTHETIC CONFIDENTIAL APPOINTMENT NOTE')) RETURNING id INTO appointment;
 PERFORM set_config('request.jwt.claim.sub',other_client::text,true);PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',other_client,'role','authenticated')::text,true);
 denied:=false;BEGIN INSERT INTO public.kinra_v2_feature_records(kind,payload) VALUES('appointment',jsonb_build_object('coach_id',coach,'starts_at',starts,'ends_at',ends,'status','requested'));EXCEPTION WHEN unique_violation THEN denied:=true;END;IF NOT denied THEN RAISE EXCEPTION 'Overlapping pending appointment accepted.';END IF;
 denied:=false;BEGIN INSERT INTO public.kinra_v2_feature_records(kind,payload) VALUES('appointment',jsonb_build_object('coach_id',coach,'starts_at',starts+interval '15 minutes','ends_at',ends+interval '15 minutes','status','requested'));EXCEPTION WHEN check_violation THEN denied:=true;END;IF NOT denied THEN RAISE EXCEPTION 'Nonmatching declared slot accepted.';END IF;
 receipt:=public.kinra_v2_kinra_available_slots(coach,slot_day,slot_day,other_client);
 IF jsonb_array_length(receipt)<>2 OR receipt::text LIKE '%'||member_id::text||'%' OR receipt::text LIKE '%CONFIDENTIAL%' THEN RAISE EXCEPTION 'Free/busy count or privacy mismatch.';END IF;
 SELECT count(*) INTO rows_seen FROM public.kinra_v2_feature_records WHERE id=appointment;IF rows_seen<>0 THEN RAISE EXCEPTION 'Another client can read appointment notes.';END IF;
 -- Private attachment metadata only; no object bytes are uploaded in this audit.
 PERFORM set_config('request.jwt.claim.sub',coach::text,true);PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',coach,'role','authenticated')::text,true);
 attachment_path:=coach::text||'/'||gen_random_uuid()::text||'.pdf';
 INSERT INTO storage.objects(bucket_id,name,metadata) VALUES('kinra-v2-message-attachments',attachment_path,'{"mimetype":"application/pdf","size":25}');
 message:=public.kinra_v2_kinra_send_attachment(member_id,'SYNTHETIC ATTACHMENT METADATA',attachment_path,'Synthetic.pdf','application/pdf',25,coach);
 PERFORM set_config('request.jwt.claim.sub',member_id::text,true);PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',member_id,'role','authenticated')::text,true);
 SELECT count(*) INTO rows_seen FROM public.kinra_v2_message_attachments WHERE message_id=message;IF rows_seen<>1 THEN RAISE EXCEPTION 'Connected recipient cannot read attachment metadata.';END IF;
 SELECT count(*) INTO rows_seen FROM storage.objects WHERE bucket_id='kinra-v2-message-attachments' AND name=attachment_path;IF rows_seen<>1 THEN RAISE EXCEPTION 'Connected recipient cannot read attachment path.';END IF;
 PERFORM set_config('request.jwt.claim.sub',other_client::text,true);PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',other_client,'role','authenticated')::text,true);
 SELECT count(*) INTO rows_seen FROM public.kinra_v2_message_attachments WHERE message_id=message;IF rows_seen<>0 THEN RAISE EXCEPTION 'Unrelated client can read attachment metadata.';END IF;
 SELECT count(*) INTO rows_seen FROM storage.objects WHERE bucket_id='kinra-v2-message-attachments' AND name=attachment_path;IF rows_seen<>0 THEN RAISE EXCEPTION 'Unrelated client can read attachment path.';END IF;
 -- Public resource metadata/object requires its own expert parent to remain public.
 PERFORM set_config('request.jwt.claim.sub',owner_id::text,true);PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true);
 INSERT INTO public.kinra_v2_feature_records(kind,payload,visibility) VALUES('expert','{"name":"SYNTHETIC EXPERT","headline":"Self-reported audit fixture","city":"Test","languages":[],"specialties":[]}','public') RETURNING id INTO expert;
 resource_path:=owner_id::text||'/'||gen_random_uuid()::text||'.pdf';
 INSERT INTO storage.objects(bucket_id,name,metadata) VALUES('kinra-v2-expert-materials',resource_path,'{"mimetype":"application/pdf","size":25}');
 INSERT INTO public.kinra_v2_feature_records(kind,payload,visibility) VALUES('expert_resource',jsonb_build_object('expert_id',expert,'title','SYNTHETIC RESOURCE','storage_path',resource_path,'filename','Synthetic.pdf','mime','application/pdf','bytes',25),'public') RETURNING id INTO resource;
 PERFORM set_config('request.jwt.claim.sub',member_id::text,true);PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',member_id,'role','authenticated')::text,true);
 SELECT count(*) INTO rows_seen FROM public.kinra_v2_feature_records WHERE id=resource;IF rows_seen<>1 THEN RAISE EXCEPTION 'Published resource metadata unavailable.';END IF;
 SELECT count(*) INTO rows_seen FROM storage.objects WHERE bucket_id='kinra-v2-expert-materials' AND name=resource_path;IF rows_seen<>1 THEN RAISE EXCEPTION 'Published resource path unavailable.';END IF;
 PERFORM set_config('request.jwt.claim.sub',owner_id::text,true);PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated')::text,true);
 UPDATE public.kinra_v2_feature_records SET visibility='private' WHERE id=expert;
 PERFORM set_config('request.jwt.claim.sub',member_id::text,true);PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',member_id,'role','authenticated')::text,true);
 SELECT count(*) INTO rows_seen FROM public.kinra_v2_feature_records WHERE id=resource;IF rows_seen<>0 THEN RAISE EXCEPTION 'Unpublished expert resource metadata leaked.';END IF;
 SELECT count(*) INTO rows_seen FROM storage.objects WHERE bucket_id='kinra-v2-expert-materials' AND name=resource_path;IF rows_seen<>0 THEN RAISE EXCEPTION 'Unpublished expert resource path leaked.';END IF;
 -- Claim changes only a synthetic device timestamp; nothing is delivered.
 endpoint:='https://fcm.googleapis.com/fcm/send/kinra-acceptance-'||member_id::text;
 INSERT INTO public.kinra_v2_device_subscriptions(endpoint,p256dh,auth_key,locale) VALUES(endpoint,repeat('A',87),repeat('B',22),'en');
 PERFORM public.kinra_v2_kinra_claim_push_test(endpoint,member_id);
 denied:=false;BEGIN PERFORM public.kinra_v2_kinra_claim_push_test(endpoint,member_id);EXCEPTION WHEN check_violation THEN denied:=true;END;IF NOT denied THEN RAISE EXCEPTION 'One-minute push test throttle bypassed.';END IF;
 denied:=false;BEGIN UPDATE public.kinra_v2_device_subscriptions d SET last_test_at=NULL WHERE d.owner_id=member_id;EXCEPTION WHEN insufficient_privilege THEN denied:=true;END;IF NOT denied THEN RAISE EXCEPTION 'Direct throttle reset column update accepted.';END IF;
 denied:=false;BEGIN PERFORM public.kinra_v2_kinra_push_due(forbidden_token);EXCEPTION WHEN insufficient_privilege THEN denied:=true;END;IF NOT denied THEN RAISE EXCEPTION 'Authenticated forged dispatcher accepted.';END IF;
 EXECUTE 'SET LOCAL ROLE anon';
 denied:=false;BEGIN PERFORM public.kinra_v2_kinra_push_due(forbidden_token);EXCEPTION WHEN insufficient_privilege THEN denied:=true;END;IF NOT denied THEN RAISE EXCEPTION 'Anonymous forged dispatcher accepted.';END IF;
 EXECUTE 'RESET ROLE';
END $acceptance$;
ROLLBACK;
-- This is the final returned result. It can be reached only after all assertions
-- completed, and confirms every fixed fresh synthetic ID/path rolled back.
SELECT jsonb_build_object(
 'assertions','All acceptance DO assertions completed before ROLLBACK',
 'modules',jsonb_build_array('22 templates and private editable/idempotent adoption','initial specialist/organization onboarding','solo-to-coach code lookup and explicit connection','organization invitations and private finance','private group membership and kick','published exact slots and private free/busy','attachment participant metadata/path RLS','resource parent publication RLS','notification throttle and forged-dispatch denial'),
 'residual_auth_users',(SELECT count(*) FROM auth.users WHERE id=ANY(ARRAY['cab1d271-99ae-4fbc-9eb9-c182d7050fe3','97d2c7ba-e234-4d62-bc14-feb21b3efc92','eb906034-1adb-4919-96d9-0777b7c6ce5d','36ec1e57-7c01-4c8a-8f8d-522602b42d53','c617fbe2-23b4-4b13-8d4c-f60c9785f534','69d877d7-6cc1-4f07-b3bc-18f54619eede','0fca04c0-d020-4ccd-a8d6-ec9c954d2853']::uuid[])),
 'residual_profiles',(SELECT count(*) FROM public.kinra_v2_profiles WHERE id=ANY(ARRAY['cab1d271-99ae-4fbc-9eb9-c182d7050fe3','97d2c7ba-e234-4d62-bc14-feb21b3efc92','eb906034-1adb-4919-96d9-0777b7c6ce5d','36ec1e57-7c01-4c8a-8f8d-522602b42d53','c617fbe2-23b4-4b13-8d4c-f60c9785f534','69d877d7-6cc1-4f07-b3bc-18f54619eede','0fca04c0-d020-4ccd-a8d6-ec9c954d2853']::uuid[])),
 'residual_storage_objects',(SELECT count(*) FROM storage.objects WHERE bucket_id IN ('kinra-v2-message-attachments','kinra-v2-expert-materials') AND split_part(name,'/',1)=ANY(ARRAY['cab1d271-99ae-4fbc-9eb9-c182d7050fe3','97d2c7ba-e234-4d62-bc14-feb21b3efc92','eb906034-1adb-4919-96d9-0777b7c6ce5d','36ec1e57-7c01-4c8a-8f8d-522602b42d53','c617fbe2-23b4-4b13-8d4c-f60c9785f534','69d877d7-6cc1-4f07-b3bc-18f54619eede','0fca04c0-d020-4ccd-a8d6-ec9c954d2853']))
) AS hosted_acceptance;
