begin;

create or replace function public.refresh_user_stats(target_user_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  tz text := 'UTC';
  cursor_date date;
  current_count integer := 0;
  longest_count integer := 0;
  completed_count integer := 0;
begin
  select coalesce(timezone, 'UTC') into tz from public.user_settings where user_id = target_user_id;
  select count(*) into completed_count from public.tasks where user_id = target_user_id and status = 'completed' and completed_at is not null;
  cursor_date := (timezone(tz, now()))::date;
  if not exists (select 1 from public.tasks where user_id=target_user_id and status='completed' and (timezone(tz, completed_at))::date=cursor_date) then cursor_date := cursor_date - 1; end if;
  while exists (select 1 from public.tasks where user_id=target_user_id and status='completed' and (timezone(tz, completed_at))::date=cursor_date) loop
    current_count := current_count + 1;
    cursor_date := cursor_date - 1;
  end loop;
  with days as (
    select distinct (timezone(tz, completed_at))::date day from public.tasks where user_id=target_user_id and status='completed' and completed_at is not null
  ), grouped as (
    select day, day - (row_number() over(order by day))::int grp from days
  ) select coalesce(max(n),0) into longest_count from (select count(*)::int n from grouped group by grp) runs;
  insert into public.user_stats(user_id,current_streak,longest_streak,last_active_date,total_completed_tasks)
  values(target_user_id,current_count,longest_count,(select max((timezone(tz,completed_at))::date) from public.tasks where user_id=target_user_id and status='completed'),completed_count)
  on conflict(user_id) do update set current_streak=excluded.current_streak,longest_streak=greatest(public.user_stats.longest_streak,excluded.longest_streak),last_active_date=excluded.last_active_date,total_completed_tasks=excluded.total_completed_tasks,updated_at=timezone('utc',now());
end $$;

create or replace function public.tasks_refresh_stats_trigger() returns trigger language plpgsql security definer set search_path=public as $$
begin
  perform public.refresh_user_stats(coalesce(new.user_id, old.user_id));
  return coalesce(new, old);
end $$;

drop trigger if exists tasks_refresh_stats on public.tasks;
create trigger tasks_refresh_stats after insert or update or delete on public.tasks for each row execute function public.tasks_refresh_stats_trigger();

commit;
