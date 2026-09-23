-- First-party prompts reviewed alongside the application's semantic examples.
update public.problems
set interview_ready = true,
    interview_content_version = 1,
    interview_content_provenance = 'first_party'
where slug in ('median-of-two-sorted-arrays', 'merge-k-sorted-lists')
  and not interview_ready;

-- Clarify the stream's size guarantee and duplicate handling for new starts.
update public.problems
set interview_content_version = 2
where slug = 'kth-largest-element-in-a-stream'
  and interview_ready
  and interview_content_provenance = 'first_party'
  and interview_content_version = 1;
