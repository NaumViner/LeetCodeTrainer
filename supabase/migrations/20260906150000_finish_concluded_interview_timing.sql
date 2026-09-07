-- Preserve the actual elapsed time in completed history after voice closes.
do $$
declare definition text;
begin
  definition := pg_get_functiondef('public.finish_concluded_mock_interview(uuid)'::regprocedure);
  definition := replace(definition, 'timer_running = false, completed_at = now(), result = null',
    'timer_running = false, completed_at = now(), result = null,
    elapsed_seconds = greatest(elapsed_seconds, case when owned.timer_running
      then least(14400, greatest(0, floor(extract(epoch from (now() - owned.started_at)))::integer))
      else elapsed_seconds end)');
  execute definition;
end;
$$;
