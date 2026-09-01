-- Backend operators need read-only access for support, verification, and
-- asynchronous processing. Learner writes remain restricted to the narrow RPCs.
grant select on table public.mock_interview_evaluations to service_role;
