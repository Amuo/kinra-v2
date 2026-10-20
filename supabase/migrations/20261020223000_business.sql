BEGIN;
-- Source: 0029_business.sql
-- Business authority reuses organization ownership/staff, never coach links or workspace metadata.
CREATE TABLE public.kinra_v2_business_profiles (
 id uuid PRIMARY KEY REFERENCES public.kinra_v2_feature_records(id) ON DELETE CASCADE,
 sector text NOT NULL CHECK(sector IN ('gym','pool','football','combat_sports','sports_complex','athletics','basketball','handball','volleyball','tennis','padel','dance','yoga_pilates','gymnastics','climbing','water_sports','winter_sports','wellness','other')),
 timezone text NOT NULL CHECK(length(timezone) BETWEEN 1 AND 100), currency text NOT NULL CHECK(currency IN ('BAM','EUR','RSD','MKD','ALL','RON','BGN','USD','GBP')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.kinra_v2_business_locations (
 id uuid PRIMARY KEY, business_id uuid NOT NULL REFERENCES public.kinra_v2_business_profiles ON DELETE CASCADE,
 name text NOT NULL CHECK(length(name) BETWEEN 1 AND 120), city text NOT NULL DEFAULT '' CHECK(length(city)<=120),address text NOT NULL DEFAULT '' CHECK(length(address)<=300),capacity integer CHECK(capacity BETWEEN 1 AND 100000),active boolean NOT NULL DEFAULT true, UNIQUE(business_id,id)
);
CREATE TABLE public.kinra_v2_business_resources (
 id uuid PRIMARY KEY,business_id uuid NOT NULL REFERENCES public.kinra_v2_business_profiles ON DELETE CASCADE,location_id uuid NOT NULL,
 name text NOT NULL CHECK(length(name) BETWEEN 1 AND 120),kind text NOT NULL CHECK(kind IN ('pitch','court','lane','studio','mat','track','room','other')),capacity integer NOT NULL CHECK(capacity BETWEEN 1 AND 100000),active boolean NOT NULL DEFAULT true,
 FOREIGN KEY(business_id,location_id) REFERENCES public.kinra_v2_business_locations(business_id,id),UNIQUE(business_id,id)
);
CREATE TABLE public.kinra_v2_business_plans (
 id uuid PRIMARY KEY,business_id uuid NOT NULL REFERENCES public.kinra_v2_business_profiles ON DELETE CASCADE,name text NOT NULL CHECK(length(name) BETWEEN 1 AND 120),duration_days integer NOT NULL CHECK(duration_days BETWEEN 1 AND 3660),visit_limit integer CHECK(visit_limit BETWEEN 1 AND 100000),price_minor bigint NOT NULL CHECK(price_minor BETWEEN 0 AND 100000000),location_ids uuid[] NOT NULL DEFAULT '{}',active boolean NOT NULL DEFAULT true,UNIQUE(business_id,id)
);
CREATE TABLE public.kinra_v2_business_members (
 id uuid PRIMARY KEY,business_id uuid NOT NULL REFERENCES public.kinra_v2_business_profiles ON DELETE CASCADE,name text NOT NULL CHECK(length(name) BETWEEN 1 AND 120),number text NOT NULL CHECK(length(number) BETWEEN 1 AND 40),email text NOT NULL DEFAULT '' CHECK(length(email)<=254),phone text NOT NULL DEFAULT '' CHECK(length(phone)<=60),"group" text NOT NULL DEFAULT '' CHECK(length("group")<=100),status text NOT NULL CHECK(status IN ('active','paused','blocked','archived')),user_id uuid REFERENCES public.kinra_v2_profiles(id) ON DELETE SET NULL,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(business_id,id),UNIQUE(business_id,number),UNIQUE(business_id,user_id)
);
CREATE TABLE public.kinra_v2_business_memberships (
 id uuid PRIMARY KEY,business_id uuid NOT NULL REFERENCES public.kinra_v2_business_profiles ON DELETE CASCADE,member_id uuid NOT NULL,plan_id uuid NOT NULL,plan_name text NOT NULL,start_date date NOT NULL,end_date date NOT NULL,status text NOT NULL CHECK(status IN ('active','paused','ended')),visit_limit integer CHECK(visit_limit BETWEEN 1 AND 100000),location_ids uuid[] NOT NULL DEFAULT '{}',
 FOREIGN KEY(business_id,member_id) REFERENCES public.kinra_v2_business_members(business_id,id) ON DELETE CASCADE,FOREIGN KEY(business_id,plan_id) REFERENCES public.kinra_v2_business_plans(business_id,id),CHECK(end_date>=start_date),UNIQUE(business_id,id)
);
CREATE TABLE public.kinra_v2_business_visits (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),business_id uuid NOT NULL REFERENCES public.kinra_v2_business_profiles ON DELETE CASCADE,member_id uuid NOT NULL,membership_id uuid NOT NULL,location_id uuid NOT NULL,entered_at timestamptz NOT NULL DEFAULT now(),exited_at timestamptz,method text NOT NULL CHECK(method IN ('qr','manual')),actor_id uuid REFERENCES public.kinra_v2_profiles ON DELETE SET NULL,
 FOREIGN KEY(business_id,member_id) REFERENCES public.kinra_v2_business_members(business_id,id) ON DELETE CASCADE,FOREIGN KEY(business_id,membership_id) REFERENCES public.kinra_v2_business_memberships(business_id,id) ON DELETE CASCADE,FOREIGN KEY(business_id,location_id) REFERENCES public.kinra_v2_business_locations(business_id,id),CHECK(exited_at IS NULL OR exited_at>=entered_at)
);
CREATE UNIQUE INDEX kinra_v2_business_one_open_visit ON public.kinra_v2_business_visits(business_id,member_id) WHERE exited_at IS NULL;
CREATE INDEX kinra_v2_business_visit_history ON public.kinra_v2_business_visits(business_id,entered_at DESC);
CREATE INDEX kinra_v2_business_visit_membership ON public.kinra_v2_business_visits(membership_id);
CREATE TABLE public.kinra_v2_business_passes (
 token_hash text PRIMARY KEY,business_id uuid NOT NULL REFERENCES public.kinra_v2_business_profiles ON DELETE CASCADE,member_id uuid NOT NULL,expires_at timestamptz NOT NULL,used_at timestamptz,issued_by uuid REFERENCES public.kinra_v2_profiles ON DELETE CASCADE,FOREIGN KEY(business_id,member_id) REFERENCES public.kinra_v2_business_members(business_id,id) ON DELETE CASCADE
);
CREATE INDEX kinra_v2_business_pass_member ON public.kinra_v2_business_passes(business_id,member_id);
CREATE TABLE public.kinra_v2_business_claims (
 token_hash text PRIMARY KEY,business_id uuid NOT NULL REFERENCES public.kinra_v2_business_profiles ON DELETE CASCADE,member_id uuid NOT NULL,expires_at timestamptz NOT NULL,used_by uuid REFERENCES public.kinra_v2_profiles ON DELETE CASCADE,used_at timestamptz,FOREIGN KEY(business_id,member_id) REFERENCES public.kinra_v2_business_members(business_id,id) ON DELETE CASCADE
);
CREATE INDEX kinra_v2_business_claim_member ON public.kinra_v2_business_claims(business_id,member_id);
CREATE TABLE public.kinra_v2_business_invoices (
 id uuid PRIMARY KEY,business_id uuid NOT NULL REFERENCES public.kinra_v2_business_profiles ON DELETE CASCADE,member_id uuid NOT NULL,label text NOT NULL CHECK(length(label) BETWEEN 1 AND 120),total_minor bigint NOT NULL CHECK(total_minor BETWEEN 1 AND 100000000),due_date date NOT NULL,status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','void')),created_at timestamptz NOT NULL DEFAULT now(),FOREIGN KEY(business_id,member_id) REFERENCES public.kinra_v2_business_members(business_id,id) ON DELETE CASCADE,UNIQUE(business_id,id)
);
CREATE TABLE public.kinra_v2_business_payments (
 id uuid PRIMARY KEY,business_id uuid NOT NULL REFERENCES public.kinra_v2_business_profiles ON DELETE CASCADE,invoice_id uuid NOT NULL,amount_minor bigint NOT NULL CHECK(amount_minor BETWEEN 1 AND 100000000),kind text NOT NULL CHECK(kind IN ('payment','refund')),method text NOT NULL CHECK(method IN ('cash','bank','external_card','other')),reference text NOT NULL DEFAULT '' CHECK(length(reference)<=200),created_at timestamptz NOT NULL DEFAULT now(),actor_id uuid REFERENCES public.kinra_v2_profiles ON DELETE SET NULL,FOREIGN KEY(business_id,invoice_id) REFERENCES public.kinra_v2_business_invoices(business_id,id) ON DELETE CASCADE
);
CREATE INDEX kinra_v2_business_payment_invoice ON public.kinra_v2_business_payments(invoice_id);
CREATE TABLE public.kinra_v2_business_sessions (
 id uuid PRIMARY KEY,business_id uuid NOT NULL REFERENCES public.kinra_v2_business_profiles ON DELETE CASCADE,location_id uuid NOT NULL,resource_id uuid,title text NOT NULL CHECK(length(title) BETWEEN 1 AND 120),activity text NOT NULL DEFAULT '' CHECK(length(activity)<=100),"group" text NOT NULL DEFAULT '' CHECK(length("group")<=100),starts_at timestamptz NOT NULL,ends_at timestamptz NOT NULL,capacity integer NOT NULL CHECK(capacity BETWEEN 1 AND 100000),status text NOT NULL CHECK(status IN ('scheduled','cancelled')),
 FOREIGN KEY(business_id,location_id) REFERENCES public.kinra_v2_business_locations(business_id,id),FOREIGN KEY(business_id,resource_id) REFERENCES public.kinra_v2_business_resources(business_id,id),CHECK(ends_at>starts_at),UNIQUE(business_id,id)
);
CREATE INDEX kinra_v2_business_session_calendar ON public.kinra_v2_business_sessions(business_id,starts_at);
CREATE TABLE public.kinra_v2_business_bookings (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),business_id uuid NOT NULL REFERENCES public.kinra_v2_business_profiles ON DELETE CASCADE,session_id uuid NOT NULL,member_id uuid NOT NULL,status text NOT NULL CHECK(status IN ('booked','cancelled')),created_at timestamptz NOT NULL DEFAULT now(),FOREIGN KEY(business_id,session_id) REFERENCES public.kinra_v2_business_sessions(business_id,id) ON DELETE CASCADE,FOREIGN KEY(business_id,member_id) REFERENCES public.kinra_v2_business_members(business_id,id) ON DELETE CASCADE,UNIQUE(session_id,member_id)
);
CREATE TABLE public.kinra_v2_business_entry_attempts (
 request_id uuid PRIMARY KEY,business_id uuid NOT NULL REFERENCES public.kinra_v2_business_profiles ON DELETE CASCADE,actor_id uuid REFERENCES public.kinra_v2_profiles ON DELETE SET NULL,request_hash text NOT NULL,result jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.kinra_v2_business_audit (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),business_id uuid NOT NULL REFERENCES public.kinra_v2_business_profiles ON DELETE CASCADE,actor_id uuid REFERENCES public.kinra_v2_profiles ON DELETE SET NULL,action text NOT NULL,target_id uuid,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX kinra_v2_business_audit_business ON public.kinra_v2_business_audit(business_id,created_at DESC);
CREATE INDEX kinra_v2_business_members_user ON public.kinra_v2_business_members(user_id);
CREATE INDEX kinra_v2_business_membership_member ON public.kinra_v2_business_memberships(business_id,member_id);
CREATE INDEX kinra_v2_business_invoice_member ON public.kinra_v2_business_invoices(business_id,member_id);
CREATE INDEX kinra_v2_business_resource_location ON public.kinra_v2_business_resources(location_id);
CREATE INDEX kinra_v2_business_booking_member ON public.kinra_v2_business_bookings(member_id);
CREATE FUNCTION public.kinra_v2_kinra_business_hash(value text) RETURNS text LANGUAGE sql IMMUTABLE SET search_path='' AS $$ SELECT encode(sha256(convert_to(value,'UTF8')),'hex') $$;
CREATE FUNCTION public.kinra_v2_kinra_business_camel(data jsonb) RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SET search_path='' AS $$
DECLARE k text;v jsonb;parts text[];key text;i integer;result jsonb:='{}'; BEGIN
 FOR k,v IN SELECT * FROM jsonb_each(data) LOOP parts:=string_to_array(k,'_');key:=parts[1];IF array_length(parts,1)>1 THEN FOR i IN 2..array_length(parts,1) LOOP key:=key||initcap(parts[i]);END LOOP;END IF;result:=result||jsonb_build_object(key,v);END LOOP;
 RETURN result-ARRAY['businessId','actorId','userId','tokenHash','issuedBy'];END $$;
-- Every public table is read-only through RLS; writes use actor-checked atomic RPCs below.
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['kinra_v2_business_profiles','kinra_v2_business_locations','kinra_v2_business_resources','kinra_v2_business_plans','kinra_v2_business_members','kinra_v2_business_memberships','kinra_v2_business_visits','kinra_v2_business_passes','kinra_v2_business_claims','kinra_v2_business_invoices','kinra_v2_business_payments','kinra_v2_business_sessions','kinra_v2_business_bookings','kinra_v2_business_entry_attempts','kinra_v2_business_audit'] LOOP
 EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated',t);
 EXECUTE format('GRANT ALL ON public.%I TO service_role',t);
 IF t NOT IN ('kinra_v2_business_passes','kinra_v2_business_claims','kinra_v2_business_entry_attempts') THEN
 EXECUTE format('GRANT SELECT ON public.%I TO authenticated',t);
 IF t='kinra_v2_business_profiles' THEN EXECUTE format('CREATE POLICY "Kinra v2: Business read" ON public.%I FOR SELECT TO authenticated USING(public.kinra_v2_kinra_org_role(id) IS NOT NULL)',t);
 ELSIF t IN ('kinra_v2_business_invoices','kinra_v2_business_payments') THEN EXECUTE format('CREATE POLICY "Kinra v2: Business finance read" ON public.%I FOR SELECT TO authenticated USING(public.kinra_v2_kinra_org_role(business_id) IN (''owner'',''manager''))',t);
 ELSE EXECUTE format('CREATE POLICY "Kinra v2: Business operations read" ON public.%I FOR SELECT TO authenticated USING(public.kinra_v2_kinra_org_role(business_id) IS NOT NULL)',t);END IF;END IF;
 END LOOP; END $$;
CREATE FUNCTION public.kinra_v2_kinra_business_snapshot(bid uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE role text:=public.kinra_v2_kinra_org_role(bid);b jsonb;result jsonb;localday date;limited boolean; BEGIN
 IF auth.uid() IS NULL OR role IS NULL THEN RAISE EXCEPTION 'Business access required.' USING ERRCODE='42501';END IF;
 SELECT jsonb_build_object('id',p.id,'name',f.payload->>'name','sector',p.sector,'timezone',p.timezone,'currency',p.currency,'role',role),timezone(p.timezone,now())::date INTO b,localday FROM public.kinra_v2_business_profiles p JOIN public.kinra_v2_feature_records f ON f.id=p.id WHERE p.id=bid;
 IF b IS NULL THEN RAISE EXCEPTION 'Business not found.';END IF;
 result:=jsonb_build_object('business',b);
 result:=result||jsonb_build_object('locations',coalesce((SELECT jsonb_agg(public.kinra_v2_kinra_business_camel(to_jsonb(x))) FROM (SELECT * FROM public.kinra_v2_business_locations WHERE business_id=bid ORDER BY name LIMIT 2000)x),'[]'::jsonb),
 'resources',coalesce((SELECT jsonb_agg(public.kinra_v2_kinra_business_camel(to_jsonb(x))) FROM (SELECT * FROM public.kinra_v2_business_resources WHERE business_id=bid ORDER BY name LIMIT 2000)x),'[]'::jsonb),
 'plans',coalesce((SELECT jsonb_agg(public.kinra_v2_kinra_business_camel(to_jsonb(x))) FROM (SELECT * FROM public.kinra_v2_business_plans WHERE business_id=bid ORDER BY name LIMIT 2000)x),'[]'::jsonb),
 'members',coalesce((SELECT jsonb_agg(public.kinra_v2_kinra_business_camel(to_jsonb(x))||jsonb_build_object('linked',x.user_id IS NOT NULL)) FROM (SELECT * FROM public.kinra_v2_business_members WHERE business_id=bid ORDER BY name LIMIT 2000)x),'[]'::jsonb),
 'memberships',coalesce((SELECT jsonb_agg(public.kinra_v2_kinra_business_camel(to_jsonb(x))||jsonb_build_object('usedVisits',(SELECT count(*) FROM public.kinra_v2_business_visits v WHERE v.membership_id=x.id))) FROM (SELECT * FROM public.kinra_v2_business_memberships WHERE business_id=bid ORDER BY start_date DESC LIMIT 2000)x),'[]'::jsonb),
 'visits',coalesce((SELECT jsonb_agg(public.kinra_v2_kinra_business_camel(to_jsonb(x))||jsonb_build_object('memberName',m.name)) FROM (SELECT * FROM public.kinra_v2_business_visits WHERE business_id=bid ORDER BY (exited_at IS NULL) DESC,entered_at DESC LIMIT 2000)x JOIN public.kinra_v2_business_members m ON m.id=x.member_id),'[]'::jsonb),
 'sessions',coalesce((SELECT jsonb_agg(public.kinra_v2_kinra_business_camel(to_jsonb(x))||jsonb_build_object('booked',(SELECT count(*) FROM public.kinra_v2_business_bookings q WHERE q.session_id=x.id AND q.status='booked'))) FROM (SELECT * FROM public.kinra_v2_business_sessions WHERE business_id=bid ORDER BY starts_at DESC LIMIT 2000)x),'[]'::jsonb),
 'bookings',coalesce((SELECT jsonb_agg(public.kinra_v2_kinra_business_camel(to_jsonb(x))||jsonb_build_object('memberName',m.name)) FROM (SELECT * FROM public.kinra_v2_business_bookings WHERE business_id=bid ORDER BY created_at DESC LIMIT 2000)x JOIN public.kinra_v2_business_members m ON m.id=x.member_id),'[]'::jsonb));
 result:=result||jsonb_build_object('invoices',CASE WHEN role IN ('owner','manager') THEN coalesce((SELECT jsonb_agg(public.kinra_v2_kinra_business_camel(to_jsonb(x))||jsonb_build_object('paidMinor',(SELECT coalesce(sum(CASE WHEN q.kind='payment' THEN q.amount_minor ELSE -q.amount_minor END),0) FROM public.kinra_v2_business_payments q WHERE q.invoice_id=x.id))) FROM (SELECT * FROM public.kinra_v2_business_invoices WHERE business_id=bid ORDER BY created_at DESC LIMIT 2000)x),'[]'::jsonb) ELSE '[]'::jsonb END,
 'payments',CASE WHEN role IN ('owner','manager') THEN coalesce((SELECT jsonb_agg(public.kinra_v2_kinra_business_camel(to_jsonb(x))) FROM (SELECT * FROM public.kinra_v2_business_payments WHERE business_id=bid ORDER BY created_at DESC LIMIT 2000)x),'[]'::jsonb) ELSE '[]'::jsonb END);
 SELECT EXISTS(SELECT 1 FROM public.kinra_v2_business_members WHERE business_id=bid OFFSET 2000) OR EXISTS(SELECT 1 FROM public.kinra_v2_business_visits WHERE business_id=bid OFFSET 2000) OR EXISTS(SELECT 1 FROM public.kinra_v2_business_memberships WHERE business_id=bid OFFSET 2000) OR EXISTS(SELECT 1 FROM public.kinra_v2_business_sessions WHERE business_id=bid OFFSET 2000) OR EXISTS(SELECT 1 FROM public.kinra_v2_business_bookings WHERE business_id=bid OFFSET 2000) OR (role IN ('owner','manager') AND (EXISTS(SELECT 1 FROM public.kinra_v2_business_invoices WHERE business_id=bid OFFSET 2000) OR EXISTS(SELECT 1 FROM public.kinra_v2_business_payments WHERE business_id=bid OFFSET 2000))) INTO limited;
 RETURN result||jsonb_build_object('truncated',limited,'stats',jsonb_build_object('members',(SELECT count(*) FROM public.kinra_v2_business_members WHERE business_id=bid),'activeMembers',(SELECT count(DISTINCT m.id) FROM public.kinra_v2_business_members m JOIN public.kinra_v2_business_memberships s ON s.member_id=m.id WHERE m.business_id=bid AND m.status='active' AND s.status='active' AND localday BETWEEN s.start_date AND s.end_date),'inside',(SELECT count(*) FROM public.kinra_v2_business_visits WHERE business_id=bid AND exited_at IS NULL),'visitsToday',(SELECT count(*) FROM public.kinra_v2_business_visits v WHERE v.business_id=bid AND timezone(b->>'timezone',v.entered_at)::date=localday),'expiring',(SELECT count(*) FROM public.kinra_v2_business_memberships WHERE business_id=bid AND status='active' AND end_date BETWEEN localday AND localday+7),'outstandingMinor',CASE WHEN role IN ('owner','manager') THEN (SELECT coalesce(sum(i.total_minor-(SELECT coalesce(sum(CASE WHEN p.kind='payment' THEN p.amount_minor ELSE -p.amount_minor END),0) FROM public.kinra_v2_business_payments p WHERE p.invoice_id=i.id)),0) FROM public.kinra_v2_business_invoices i WHERE i.business_id=bid AND i.status='open') ELSE NULL END,'paidTodayMinor',CASE WHEN role IN ('owner','manager') THEN (SELECT coalesce(sum(CASE WHEN kind='payment' THEN amount_minor ELSE -amount_minor END),0) FROM public.kinra_v2_business_payments WHERE business_id=bid AND timezone(b->>'timezone',created_at)::date=localday) ELSE NULL END));END $$;
REVOKE ALL ON FUNCTION public.kinra_v2_kinra_business_snapshot(uuid) FROM PUBLIC,anon;GRANT EXECUTE ON FUNCTION public.kinra_v2_kinra_business_snapshot(uuid) TO authenticated;
CREATE FUNCTION public.kinra_v2_kinra_business(action text,bid uuid,data jsonb,expected_owner uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid();role text;b public.kinra_v2_business_profiles;m public.kinra_v2_business_members;p public.kinra_v2_business_plans;s public.kinra_v2_business_memberships;v public.kinra_v2_business_visits;l public.kinra_v2_business_locations;r public.kinra_v2_business_resources;c public.kinra_v2_business_claims;pass public.kinra_v2_business_passes;ses public.kinra_v2_business_sessions;inv public.kinra_v2_business_invoices;pay public.kinra_v2_business_payments;target uuid;memberid uuid;token text;localday date;result jsonb;reason text;used integer;paid bigint;remaining integer;oldrow jsonb;item jsonb;ids uuid[];locationid uuid;requestid uuid;newstatus text;
BEGIN
 IF actor IS NULL OR actor IS DISTINCT FROM expected_owner OR NOT EXISTS(SELECT 1 FROM public.kinra_v2_profiles WHERE id=actor) THEN RAISE EXCEPTION 'Your account changed. Reopen this screen before saving.' USING ERRCODE='42501';END IF;
 IF data IS NULL OR jsonb_typeof(data)<>'object' THEN RAISE EXCEPTION 'Invalid business request.' USING ERRCODE='22023';END IF;
 IF action='list' THEN RETURN coalesce((SELECT jsonb_agg(jsonb_build_object('id',bp.id,'name',f.payload->>'name','sector',bp.sector,'timezone',bp.timezone,'currency',bp.currency,'role',public.kinra_v2_kinra_org_role(bp.id)) ORDER BY f.payload->>'name') FROM public.kinra_v2_business_profiles bp JOIN public.kinra_v2_feature_records f ON f.id=bp.id WHERE public.kinra_v2_kinra_org_role(bp.id) IS NOT NULL),'[]'::jsonb);END IF;
 IF action='setup' THEN
 IF NOT EXISTS(SELECT 1 FROM pg_timezone_names WHERE name=data->>'timezone') THEN RAISE EXCEPTION 'Choose a valid timezone.';END IF;
 IF bid IS NULL THEN
 target:=gen_random_uuid();INSERT INTO public.kinra_v2_feature_records(id,owner_id,kind,payload,visibility) VALUES(target,actor,'organization',jsonb_build_object('name',data->>'name','city','—'),'private');
 ELSE target:=bid;IF public.kinra_v2_kinra_org_role(target) IS DISTINCT FROM 'owner' THEN RAISE EXCEPTION 'Business owner access required.' USING ERRCODE='42501';END IF;END IF;
 SELECT * INTO b FROM public.kinra_v2_business_profiles WHERE id=target FOR UPDATE;
 IF FOUND AND b.currency IS DISTINCT FROM data->>'currency' AND EXISTS(SELECT 1 FROM public.kinra_v2_business_plans WHERE business_id=target) THEN RAISE EXCEPTION 'Currency cannot change after plans have been created.';END IF;
 IF length(btrim(data->>'name')) NOT BETWEEN 1 AND 120 THEN RAISE EXCEPTION 'Enter a business name.';END IF;
 UPDATE public.kinra_v2_feature_records SET payload=payload||jsonb_build_object('name',btrim(data->>'name')) WHERE id=target;
 INSERT INTO public.kinra_v2_business_profiles(id,sector,timezone,currency) VALUES(target,data->>'sector',data->>'timezone',data->>'currency') ON CONFLICT(id) DO UPDATE SET sector=excluded.sector,timezone=excluded.timezone,currency=excluded.currency;
 INSERT INTO public.kinra_v2_business_audit(business_id,actor_id,action,target_id) VALUES(target,actor,action,target);RETURN to_jsonb(target);END IF;
 IF action IN ('inspectClaim','redeemClaim') THEN
 IF coalesce(data->>'code','') !~ '^kc1:[0-9a-f]{64}$' THEN RAISE EXCEPTION 'This member invitation is invalid or expired.';END IF;
 SELECT * INTO c FROM public.kinra_v2_business_claims WHERE token_hash=public.kinra_v2_kinra_business_hash(data->>'code');
 IF NOT FOUND THEN RAISE EXCEPTION 'This member invitation is invalid or expired.';END IF;
 PERFORM 1 FROM public.kinra_v2_business_profiles WHERE id=c.business_id FOR UPDATE;
 SELECT * INTO c FROM public.kinra_v2_business_claims WHERE token_hash=public.kinra_v2_kinra_business_hash(data->>'code') FOR UPDATE;
 IF NOT FOUND OR c.expires_at<=now() OR (c.used_by IS NOT NULL AND c.used_by<>actor) THEN RAISE EXCEPTION 'This member invitation is invalid or expired.';END IF;
 SELECT * INTO m FROM public.kinra_v2_business_members WHERE id=c.member_id FOR UPDATE;
 IF m.user_id IS NOT NULL AND m.user_id<>actor THEN RAISE EXCEPTION 'This member invitation is already linked.';END IF;
 IF action='redeemClaim' THEN
 UPDATE public.kinra_v2_business_members SET user_id=actor WHERE id=m.id;
 UPDATE public.kinra_v2_business_claims SET used_by=actor,used_at=coalesce(used_at,now()) WHERE token_hash=c.token_hash;
 INSERT INTO public.kinra_v2_business_audit(business_id,actor_id,action,target_id) VALUES(c.business_id,actor,action,m.id);
 END IF;
 RETURN jsonb_build_object('businessName',(SELECT payload->>'name' FROM public.kinra_v2_feature_records WHERE id=c.business_id),'memberName',m.name,'alreadyLinked',m.user_id=actor);END IF;
 IF action='myMemberships' THEN
 result:='[]';FOR m IN SELECT * FROM public.kinra_v2_business_members WHERE user_id=actor AND status<>'archived' LOOP
 SELECT * INTO b FROM public.kinra_v2_business_profiles WHERE id=m.business_id;
 item:=jsonb_build_object('business',jsonb_build_object('id',b.id,'name',(SELECT payload->>'name' FROM public.kinra_v2_feature_records WHERE id=b.id),'sector',b.sector,'timezone',b.timezone,'currency',b.currency),'member',public.kinra_v2_kinra_business_camel(to_jsonb(m))||jsonb_build_object('linked',true),
 'memberships',coalesce((SELECT jsonb_agg(public.kinra_v2_kinra_business_camel(to_jsonb(x))||jsonb_build_object('usedVisits',(SELECT count(*) FROM public.kinra_v2_business_visits q WHERE q.membership_id=x.id))) FROM public.kinra_v2_business_memberships x WHERE x.member_id=m.id),'[]'::jsonb),
 'locations',coalesce((SELECT jsonb_agg(public.kinra_v2_kinra_business_camel(to_jsonb(x))) FROM public.kinra_v2_business_locations x WHERE x.business_id=b.id AND active),'[]'::jsonb),
 'sessions',coalesce((SELECT jsonb_agg(public.kinra_v2_kinra_business_camel(to_jsonb(x))||jsonb_build_object('booked',(SELECT count(*) FROM public.kinra_v2_business_bookings q WHERE q.session_id=x.id AND q.status='booked'))) FROM (SELECT * FROM public.kinra_v2_business_sessions WHERE business_id=b.id AND ends_at>=now() ORDER BY starts_at LIMIT 500)x),'[]'::jsonb),
 'bookings',coalesce((SELECT jsonb_agg(public.kinra_v2_kinra_business_camel(to_jsonb(x))||jsonb_build_object('memberName',m.name)) FROM public.kinra_v2_business_bookings x WHERE x.member_id=m.id),'[]'::jsonb));result:=result||jsonb_build_array(item);END LOOP;RETURN result;END IF;
 SELECT * INTO b FROM public.kinra_v2_business_profiles WHERE id=bid FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Business not found.';END IF;
 role:=public.kinra_v2_kinra_org_role(bid);localday:=timezone(b.timezone,now())::date;
 IF action='snapshot' THEN RETURN public.kinra_v2_kinra_business_snapshot(bid);END IF;
 IF action='issuePass' THEN
 SELECT * INTO m FROM public.kinra_v2_business_members WHERE business_id=bid AND id=(data->>'memberId')::uuid FOR UPDATE;
 IF NOT FOUND OR (role IS NULL AND m.user_id IS DISTINCT FROM actor) THEN RAISE EXCEPTION 'Member pass access required.' USING ERRCODE='42501';END IF;
 IF m.status<>'active' THEN RAISE EXCEPTION 'This member is not active.';END IF;
 DELETE FROM public.kinra_v2_business_passes WHERE business_id=bid AND member_id=m.id;
 token:='kb1:'||replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
 INSERT INTO public.kinra_v2_business_passes(token_hash,business_id,member_id,expires_at,issued_by) VALUES(public.kinra_v2_kinra_business_hash(token),bid,m.id,now()+interval '90 seconds',actor);
 RETURN jsonb_build_object('token',token,'expiresAt',now()+interval '90 seconds','memberName',m.name,'businessName',(SELECT payload->>'name' FROM public.kinra_v2_feature_records WHERE id=bid));END IF;
 -- Own member booking is allowed; reception authority is checked for every other operation.
 IF action IN ('bookSession','cancelBooking') THEN
 IF action='bookSession' THEN memberid:=(data->>'memberId')::uuid;ELSE SELECT member_id INTO memberid FROM public.kinra_v2_business_bookings WHERE id=(data->>'bookingId')::uuid AND business_id=bid;END IF;
 IF role IS NULL AND NOT EXISTS(SELECT 1 FROM public.kinra_v2_business_members WHERE id=memberid AND business_id=bid AND user_id=actor) THEN RAISE EXCEPTION 'Booking access required.' USING ERRCODE='42501';END IF;
 IF action='cancelBooking' THEN
 UPDATE public.kinra_v2_business_bookings SET status='cancelled' WHERE business_id=bid AND id=(data->>'bookingId')::uuid RETURNING id INTO target;IF target IS NULL THEN RAISE EXCEPTION 'Booking not found.';END IF;
 ELSE
 SELECT * INTO ses FROM public.kinra_v2_business_sessions WHERE business_id=bid AND id=(data->>'sessionId')::uuid FOR UPDATE;
 IF NOT FOUND OR ses.status<>'scheduled' OR ses.starts_at<=now() OR NOT EXISTS(SELECT 1 FROM public.kinra_v2_business_locations WHERE id=ses.location_id AND business_id=bid AND active) OR (ses.resource_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.kinra_v2_business_resources WHERE id=ses.resource_id AND business_id=bid AND location_id=ses.location_id AND active)) THEN RAISE EXCEPTION 'This session is not available.';END IF;
 SELECT id INTO target FROM public.kinra_v2_business_bookings WHERE business_id=bid AND session_id=ses.id AND member_id=memberid AND status='booked';IF FOUND THEN RETURN to_jsonb(target);END IF;
 SELECT * INTO m FROM public.kinra_v2_business_members WHERE id=memberid AND business_id=bid;
 IF m.status IS DISTINCT FROM 'active' OR NOT EXISTS(SELECT 1 FROM public.kinra_v2_business_memberships eligible WHERE eligible.member_id=memberid AND eligible.status='active' AND timezone(b.timezone,ses.starts_at)::date BETWEEN eligible.start_date AND eligible.end_date AND (cardinality(eligible.location_ids)=0 OR ses.location_id=ANY(eligible.location_ids)) AND (eligible.visit_limit IS NULL OR eligible.visit_limit>(SELECT count(*) FROM public.kinra_v2_business_visits WHERE membership_id=eligible.id))) THEN RAISE EXCEPTION 'An active membership is required for this session.';END IF;
 IF (SELECT count(*) FROM public.kinra_v2_business_bookings WHERE session_id=ses.id AND status='booked')>=ses.capacity THEN RAISE EXCEPTION 'This session is full.';END IF;
 INSERT INTO public.kinra_v2_business_bookings(business_id,session_id,member_id,status) VALUES(bid,ses.id,memberid,'booked') ON CONFLICT(session_id,member_id) DO UPDATE SET status='booked' RETURNING id INTO target;
 END IF;INSERT INTO public.kinra_v2_business_audit(business_id,actor_id,action,target_id) VALUES(bid,actor,action,target);RETURN to_jsonb(target);END IF;
 IF role IS NULL THEN RAISE EXCEPTION 'Business access required.' USING ERRCODE='42501';END IF;
 IF action='export' THEN
 result:=public.kinra_v2_kinra_business_snapshot(bid);
 -- Full export, independently of the paged operational snapshot limit.
 FOR reason IN SELECT unnest(ARRAY['locations','resources','plans','members','memberships','visits','sessions','bookings','invoices','payments']) LOOP
 IF role='staff' AND reason IN ('invoices','payments') THEN CONTINUE;END IF;
 EXECUTE format('SELECT coalesce(jsonb_agg(public.kinra_v2_kinra_business_camel(to_jsonb(x))),''[]''::jsonb) FROM public.%I x WHERE business_id=$1',regexp_replace('kinra_v2_business_profiles','_profiles$', '_'||reason)) INTO item USING bid;
 result:=jsonb_set(result,ARRAY[reason],item);END LOOP;
 RETURN result||jsonb_build_object('truncated',false,'exportedAt',now());END IF;
 IF action='checkOut' THEN
 UPDATE public.kinra_v2_business_visits SET exited_at=coalesce(exited_at,now()) WHERE id=(data->>'visitId')::uuid AND business_id=bid RETURNING id INTO target;
 IF target IS NULL THEN RAISE EXCEPTION 'Visit not found.';END IF;
 INSERT INTO public.kinra_v2_business_audit(business_id,actor_id,action,target_id) VALUES(bid,actor,action,target);RETURN 'null';END IF;
 IF action='checkIn' THEN
 requestid:=(data->>'requestId')::uuid;locationid:=(data->>'locationId')::uuid;
 SELECT a.result INTO result FROM public.kinra_v2_business_entry_attempts a WHERE request_id=requestid AND business_id=bid AND actor_id=actor AND request_hash=public.kinra_v2_kinra_business_hash(data::text);
 IF FOUND THEN RETURN result||jsonb_build_object('alreadyRecorded',true);END IF;
 IF EXISTS(SELECT 1 FROM public.kinra_v2_business_entry_attempts WHERE request_id=requestid) THEN RAISE EXCEPTION 'Request identity conflict.';END IF;
 reason:='';memberid:=NULL;
 IF data ? 'token' THEN
 SELECT * INTO pass FROM public.kinra_v2_business_passes WHERE token_hash=public.kinra_v2_kinra_business_hash(data->>'token') AND business_id=bid FOR UPDATE;
 IF NOT FOUND THEN reason:='invalid_pass';ELSIF pass.used_at IS NOT NULL THEN reason:='pass_used';ELSIF pass.expires_at<=now() THEN reason:='pass_expired';ELSE memberid:=pass.member_id;UPDATE public.kinra_v2_business_passes SET used_at=now() WHERE token_hash=pass.token_hash;END IF;
 ELSE memberid:=(data->>'memberId')::uuid;END IF;
 IF memberid IS NOT NULL THEN SELECT * INTO m FROM public.kinra_v2_business_members WHERE id=memberid AND business_id=bid FOR UPDATE;IF NOT FOUND THEN reason:='member_not_found';END IF;END IF;
 SELECT * INTO l FROM public.kinra_v2_business_locations WHERE id=locationid AND business_id=bid;
 IF reason='' AND (l.id IS NULL OR NOT l.active) THEN reason:='location_unavailable';END IF;
 IF reason='' AND m.status<>'active' THEN reason:='member_'||m.status;END IF;
 IF reason='' THEN SELECT * INTO v FROM public.kinra_v2_business_visits WHERE member_id=m.id AND business_id=bid AND exited_at IS NULL;
 IF FOUND THEN reason:='already_inside';ELSE
 SELECT * INTO s FROM public.kinra_v2_business_memberships x WHERE x.business_id=bid AND x.member_id=m.id AND x.status='active' AND localday BETWEEN x.start_date AND x.end_date AND (cardinality(x.location_ids)=0 OR locationid=ANY(x.location_ids)) AND (x.visit_limit IS NULL OR x.visit_limit>(SELECT count(*) FROM public.kinra_v2_business_visits WHERE membership_id=x.id)) ORDER BY end_date,id LIMIT 1 FOR UPDATE;
 IF NOT FOUND THEN reason:='membership_unavailable';ELSIF l.capacity IS NOT NULL AND (SELECT count(*) FROM public.kinra_v2_business_visits WHERE business_id=bid AND location_id=l.id AND exited_at IS NULL)>=l.capacity THEN reason:='location_full';END IF;END IF;END IF;
 IF reason='' THEN
 INSERT INTO public.kinra_v2_business_visits(business_id,member_id,membership_id,location_id,method,actor_id) VALUES(bid,m.id,s.id,l.id,CASE WHEN data ? 'token' THEN 'qr' ELSE 'manual' END,actor) RETURNING * INTO v;
 used:=(SELECT count(*) FROM public.kinra_v2_business_visits WHERE membership_id=s.id);remaining:=CASE WHEN s.visit_limit IS NULL THEN NULL ELSE s.visit_limit-used END;
 END IF;
 result:=jsonb_build_object('decision',CASE WHEN reason='' THEN 'allowed' WHEN reason='already_inside' THEN 'already_inside' ELSE 'denied' END,'reason',CASE WHEN reason='' THEN 'entry_recorded' ELSE reason END,'memberName',m.name,'visit',CASE WHEN reason IN ('','already_inside') THEN public.kinra_v2_kinra_business_camel(to_jsonb(v))||jsonb_build_object('memberName',m.name) ELSE NULL END,'remainingVisits',remaining,'alreadyRecorded',false);
 INSERT INTO public.kinra_v2_business_entry_attempts(request_id,business_id,actor_id,request_hash,result) VALUES(requestid,bid,actor,public.kinra_v2_kinra_business_hash(data::text),result);
 INSERT INTO public.kinra_v2_business_audit(business_id,actor_id,action,target_id) VALUES(bid,actor,CASE WHEN reason='' THEN 'entry_allowed' ELSE 'entry_'||reason END,m.id);RETURN result;END IF;
 IF role NOT IN ('owner','manager') THEN RAISE EXCEPTION 'Business manager access required.' USING ERRCODE='42501';END IF;
 target:=nullif(data->>'id','')::uuid;
 IF action='saveLocation' THEN
 INSERT INTO public.kinra_v2_business_locations(id,business_id,name,city,address,capacity,active) VALUES(target,bid,data->>'name',coalesce(data->>'city',''),coalesce(data->>'address',''),(data->>'capacity')::integer,(data->>'active')::boolean) ON CONFLICT(id) DO UPDATE SET name=excluded.name,city=excluded.city,address=excluded.address,capacity=excluded.capacity,active=excluded.active WHERE kinra_v2_business_locations.business_id=bid RETURNING id INTO target;
 ELSIF action='saveResource' THEN
 INSERT INTO public.kinra_v2_business_resources(id,business_id,location_id,name,kind,capacity,active) VALUES(target,bid,(data->>'locationId')::uuid,data->>'name',data->>'kind',(data->>'capacity')::integer,(data->>'active')::boolean) ON CONFLICT(id) DO UPDATE SET location_id=excluded.location_id,name=excluded.name,kind=excluded.kind,capacity=excluded.capacity,active=excluded.active WHERE kinra_v2_business_resources.business_id=bid RETURNING id INTO target;
 ELSIF action='savePlan' THEN
 ids:=ARRAY(SELECT value::uuid FROM jsonb_array_elements_text(data->'locationIds'));
 IF EXISTS(SELECT 1 FROM unnest(ids) x WHERE NOT EXISTS(SELECT 1 FROM public.kinra_v2_business_locations WHERE id=x AND business_id=bid)) THEN RAISE EXCEPTION 'Choose locations from this business.';END IF;
 INSERT INTO public.kinra_v2_business_plans(id,business_id,name,duration_days,visit_limit,price_minor,location_ids,active) VALUES(target,bid,data->>'name',(data->>'durationDays')::integer,(data->>'visitLimit')::integer,(data->>'priceMinor')::bigint,ids,(data->>'active')::boolean) ON CONFLICT(id) DO UPDATE SET name=excluded.name,duration_days=excluded.duration_days,visit_limit=excluded.visit_limit,price_minor=excluded.price_minor,location_ids=excluded.location_ids,active=excluded.active WHERE kinra_v2_business_plans.business_id=bid RETURNING id INTO target;
 ELSIF action='saveMember' THEN
 INSERT INTO public.kinra_v2_business_members(id,business_id,name,number,email,phone,"group",status) VALUES(target,bid,data->>'name',data->>'number',coalesce(data->>'email',''),coalesce(data->>'phone',''),coalesce(data->>'group',''),data->>'status') ON CONFLICT(id) DO UPDATE SET name=excluded.name,number=excluded.number,email=excluded.email,phone=excluded.phone,"group"=excluded."group",status=excluded.status WHERE kinra_v2_business_members.business_id=bid RETURNING id INTO target;
 ELSIF action='saveMembership' THEN
 SELECT * INTO s FROM public.kinra_v2_business_memberships WHERE id=target FOR UPDATE;
 IF FOUND THEN
 IF s.business_id<>bid OR s.member_id<>(data->>'memberId')::uuid OR s.plan_id<>(data->>'planId')::uuid THEN RAISE EXCEPTION 'Existing membership identity cannot change.';END IF;
 UPDATE public.kinra_v2_business_memberships SET start_date=(data->>'startDate')::date,end_date=(data->>'endDate')::date,status=data->>'status' WHERE id=target;
 ELSE
 SELECT * INTO p FROM public.kinra_v2_business_plans WHERE id=(data->>'planId')::uuid AND business_id=bid AND active;
 IF NOT FOUND THEN RAISE EXCEPTION 'Choose an active membership plan.';END IF;
 INSERT INTO public.kinra_v2_business_memberships(id,business_id,member_id,plan_id,plan_name,start_date,end_date,status,visit_limit,location_ids) VALUES(target,bid,(data->>'memberId')::uuid,p.id,p.name,(data->>'startDate')::date,(data->>'endDate')::date,data->>'status',p.visit_limit,p.location_ids);END IF;
 ELSIF action='createClaim' THEN
 memberid:=(data->>'memberId')::uuid;SELECT * INTO m FROM public.kinra_v2_business_members WHERE business_id=bid AND id=memberid FOR UPDATE;
 IF NOT FOUND OR m.user_id IS NOT NULL THEN RAISE EXCEPTION 'Choose an unlinked business member.';END IF;
 DELETE FROM public.kinra_v2_business_claims WHERE member_id=memberid;
 token:='kc1:'||replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
 INSERT INTO public.kinra_v2_business_claims(token_hash,business_id,member_id,expires_at) VALUES(public.kinra_v2_kinra_business_hash(token),bid,memberid,now()+interval '7 days');
 RETURN jsonb_build_object('code',token,'expiresAt',now()+interval '7 days');
 ELSIF action='saveSession' THEN
 SELECT * INTO l FROM public.kinra_v2_business_locations WHERE id=(data->>'locationId')::uuid AND business_id=bid;
 IF NOT FOUND OR NOT l.active THEN RAISE EXCEPTION 'Choose an active business location.';END IF;
 IF nullif(data->>'resourceId','') IS NOT NULL THEN
 SELECT * INTO r FROM public.kinra_v2_business_resources WHERE id=(data->>'resourceId')::uuid AND business_id=bid AND location_id=l.id AND active;
 IF NOT FOUND THEN RAISE EXCEPTION 'Choose a resource at this location.';END IF;
 IF (data->>'capacity')::integer>r.capacity THEN RAISE EXCEPTION 'Session capacity exceeds the resource capacity.';END IF;
 IF data->>'status'='scheduled' AND EXISTS(SELECT 1 FROM public.kinra_v2_business_sessions x WHERE business_id=bid AND resource_id=r.id AND id<>target AND status='scheduled' AND x.starts_at<(data->>'endsAt')::timestamptz AND x.ends_at>(data->>'startsAt')::timestamptz) THEN RAISE EXCEPTION 'This resource is already booked for that time.';END IF;END IF;
 IF (SELECT count(*) FROM public.kinra_v2_business_bookings WHERE session_id=target AND status='booked')>(data->>'capacity')::integer THEN RAISE EXCEPTION 'Capacity cannot be below existing bookings.';END IF;
 INSERT INTO public.kinra_v2_business_sessions(id,business_id,location_id,resource_id,title,activity,"group",starts_at,ends_at,capacity,status) VALUES(target,bid,l.id,(data->>'resourceId')::uuid,data->>'title',coalesce(data->>'activity',''),coalesce(data->>'group',''),(data->>'startsAt')::timestamptz,(data->>'endsAt')::timestamptz,(data->>'capacity')::integer,data->>'status') ON CONFLICT(id) DO UPDATE SET location_id=excluded.location_id,resource_id=excluded.resource_id,title=excluded.title,activity=excluded.activity,"group"=excluded."group",starts_at=excluded.starts_at,ends_at=excluded.ends_at,capacity=excluded.capacity,status=excluded.status WHERE kinra_v2_business_sessions.business_id=bid RETURNING id INTO target;
 IF data->>'status'='cancelled' THEN UPDATE public.kinra_v2_business_bookings SET status='cancelled' WHERE session_id=target;END IF;
 ELSIF action='saveInvoice' THEN
 SELECT * INTO inv FROM public.kinra_v2_business_invoices WHERE id=target;
 IF FOUND THEN
 IF inv.business_id<>bid OR inv.member_id<>(data->>'memberId')::uuid OR inv.label IS DISTINCT FROM data->>'label' OR inv.total_minor<>(data->>'totalMinor')::bigint OR inv.due_date<>(data->>'dueDate')::date THEN RAISE EXCEPTION 'Invoice records are immutable. Void and create a new record.';END IF;
 ELSE INSERT INTO public.kinra_v2_business_invoices(id,business_id,member_id,label,total_minor,due_date) VALUES(target,bid,(data->>'memberId')::uuid,data->>'label',(data->>'totalMinor')::bigint,(data->>'dueDate')::date);END IF;
 ELSIF action='voidInvoice' THEN
 target:=(data->>'invoiceId')::uuid;SELECT * INTO inv FROM public.kinra_v2_business_invoices WHERE id=target AND business_id=bid FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Invoice not found.';END IF;
 SELECT coalesce(sum(CASE WHEN kind='payment' THEN amount_minor ELSE -amount_minor END),0) INTO paid FROM public.kinra_v2_business_payments WHERE invoice_id=target;
 IF paid<>0 THEN RAISE EXCEPTION 'Refund recorded payments before voiding this invoice.';END IF;
 UPDATE public.kinra_v2_business_invoices SET status='void' WHERE id=target;
 ELSIF action='recordPayment' THEN
 SELECT * INTO pay FROM public.kinra_v2_business_payments WHERE id=target;
 IF FOUND THEN
 IF pay.business_id<>bid OR pay.invoice_id<>(data->>'invoiceId')::uuid OR pay.amount_minor<>(data->>'amountMinor')::bigint OR pay.kind IS DISTINCT FROM data->>'kind' OR pay.method IS DISTINCT FROM data->>'method' OR pay.reference IS DISTINCT FROM coalesce(data->>'reference','') THEN RAISE EXCEPTION 'Payment retry does not match the recorded payment.';END IF;RETURN to_jsonb(target);END IF;
 SELECT * INTO inv FROM public.kinra_v2_business_invoices WHERE id=(data->>'invoiceId')::uuid AND business_id=bid FOR UPDATE;
 IF NOT FOUND OR inv.status<>'open' THEN RAISE EXCEPTION 'Choose an open invoice.';END IF;
 SELECT coalesce(sum(CASE WHEN kind='payment' THEN amount_minor ELSE -amount_minor END),0) INTO paid FROM public.kinra_v2_business_payments WHERE invoice_id=inv.id;
 IF (data->>'kind'='payment' AND (data->>'amountMinor')::bigint>inv.total_minor-paid) OR (data->>'kind'='refund' AND (data->>'amountMinor')::bigint>paid) THEN RAISE EXCEPTION 'Amount exceeds the remaining invoice or recorded payment.';END IF;
 INSERT INTO public.kinra_v2_business_payments(id,business_id,invoice_id,amount_minor,kind,method,reference,actor_id) VALUES(target,bid,inv.id,(data->>'amountMinor')::bigint,data->>'kind',data->>'method',coalesce(data->>'reference',''),actor);
 ELSE RAISE EXCEPTION 'Unknown business action.';END IF;
 IF target IS NULL THEN RAISE EXCEPTION 'Record belongs to another business.' USING ERRCODE='42501';END IF;
 INSERT INTO public.kinra_v2_business_audit(business_id,actor_id,action,target_id) VALUES(bid,actor,action,target);RETURN to_jsonb(target);
END $$;
REVOKE ALL ON FUNCTION public.kinra_v2_kinra_business(text,uuid,jsonb,uuid) FROM PUBLIC,anon;GRANT EXECUTE ON FUNCTION public.kinra_v2_kinra_business(text,uuid,jsonb,uuid) TO authenticated;
-- Raw helpers have no access to private records; they are not public APIs.
REVOKE ALL ON FUNCTION public.kinra_v2_kinra_business_hash(text),public.kinra_v2_kinra_business_camel(jsonb) FROM PUBLIC,anon,authenticated;



COMMENT ON TABLE public.kinra_v2_profiles IS 'Kinra v2 schema version 0029_business';
NOTIFY pgrst,'reload schema';
COMMIT;
