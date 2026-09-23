-- Publish corrected first-party evaluation content for future interviews only.
-- Historical interviews retain their version-1 snapshot, available in the
-- server-side content registry. Do not update finalized evidence or scores.
update public.problems
set interview_content_version = 2
where slug = 'best-time-to-buy-and-sell-stock'
  and interview_ready
  and interview_content_provenance = 'first_party'
  and interview_content_version = 1;
