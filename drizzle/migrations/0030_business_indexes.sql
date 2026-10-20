-- Cover business-scoped references and actor erasure without scanning another facility's history.
CREATE INDEX business_audit_actor ON public.business_audit(actor_id);
CREATE INDEX business_booking_scope_member ON public.business_bookings(business_id,member_id);
CREATE INDEX business_booking_scope_session ON public.business_bookings(business_id,session_id);
CREATE INDEX business_claim_actor ON public.business_claims(used_by);
CREATE INDEX business_attempt_actor ON public.business_entry_attempts(actor_id);
CREATE INDEX business_attempt_history ON public.business_entry_attempts(business_id,created_at DESC);
CREATE INDEX business_membership_scope_plan ON public.business_memberships(business_id,plan_id);
CREATE INDEX business_pass_actor ON public.business_passes(issued_by);
CREATE INDEX business_payment_actor ON public.business_payments(actor_id);
CREATE INDEX business_payment_scope_invoice ON public.business_payments(business_id,invoice_id);
CREATE INDEX business_resource_scope_location ON public.business_resources(business_id,location_id);
CREATE INDEX business_session_scope_location ON public.business_sessions(business_id,location_id);
CREATE INDEX business_session_scope_resource ON public.business_sessions(business_id,resource_id);
CREATE INDEX business_visit_actor ON public.business_visits(actor_id);
CREATE INDEX business_visit_scope_location ON public.business_visits(business_id,location_id,exited_at);
CREATE INDEX business_visit_scope_membership ON public.business_visits(business_id,membership_id);
