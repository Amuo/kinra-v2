BEGIN;
-- Source: 0030_business_indexes.sql
-- Cover business-scoped references and actor erasure without scanning another facility's history.
CREATE INDEX kinra_v2_business_audit_actor ON public.kinra_v2_business_audit(actor_id);
CREATE INDEX kinra_v2_business_booking_scope_member ON public.kinra_v2_business_bookings(business_id,member_id);
CREATE INDEX kinra_v2_business_booking_scope_session ON public.kinra_v2_business_bookings(business_id,session_id);
CREATE INDEX kinra_v2_business_claim_actor ON public.kinra_v2_business_claims(used_by);
CREATE INDEX kinra_v2_business_attempt_actor ON public.kinra_v2_business_entry_attempts(actor_id);
CREATE INDEX kinra_v2_business_attempt_history ON public.kinra_v2_business_entry_attempts(business_id,created_at DESC);
CREATE INDEX kinra_v2_business_membership_scope_plan ON public.kinra_v2_business_memberships(business_id,plan_id);
CREATE INDEX kinra_v2_business_pass_actor ON public.kinra_v2_business_passes(issued_by);
CREATE INDEX kinra_v2_business_payment_actor ON public.kinra_v2_business_payments(actor_id);
CREATE INDEX kinra_v2_business_payment_scope_invoice ON public.kinra_v2_business_payments(business_id,invoice_id);
CREATE INDEX kinra_v2_business_resource_scope_location ON public.kinra_v2_business_resources(business_id,location_id);
CREATE INDEX kinra_v2_business_session_scope_location ON public.kinra_v2_business_sessions(business_id,location_id);
CREATE INDEX kinra_v2_business_session_scope_resource ON public.kinra_v2_business_sessions(business_id,resource_id);
CREATE INDEX kinra_v2_business_visit_actor ON public.kinra_v2_business_visits(actor_id);
CREATE INDEX kinra_v2_business_visit_scope_location ON public.kinra_v2_business_visits(business_id,location_id,exited_at);
CREATE INDEX kinra_v2_business_visit_scope_membership ON public.kinra_v2_business_visits(business_id,membership_id);



COMMENT ON TABLE public.kinra_v2_profiles IS 'Kinra v2 schema version 0030_business_indexes';
NOTIFY pgrst,'reload schema';
COMMIT;
