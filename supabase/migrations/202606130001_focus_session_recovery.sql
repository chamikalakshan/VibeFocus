begin;

drop trigger if exists focus_sessions_set_updated_at on public.focus_sessions;
create trigger focus_sessions_set_updated_at
before update on public.focus_sessions
for each row execute function public.set_updated_at();

with ranked as (
  select id, row_number() over (partition by user_id order by updated_at desc, created_at desc) as position
  from public.focus_sessions
  where status in ('running', 'paused')
)
update public.focus_sessions
set status = 'cancelled', ended_at = coalesce(ended_at, timezone('utc', now())), ends_at = null
where id in (select id from ranked where position > 1);

create unique index if not exists focus_sessions_one_active_per_user
on public.focus_sessions(user_id)
where status in ('running', 'paused');

commit;
