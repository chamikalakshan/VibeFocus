begin;

-- RLS prevents direct cross-user access. These triggers also prevent a user
-- from linking an owned row to another user's otherwise-inaccessible row.
create or replace function public.enforce_owned_relationships() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'tasks' then
    if new.recurrence_parent_id is not null and not exists (
      select 1 from public.tasks where id = new.recurrence_parent_id and user_id = new.user_id
    ) then raise exception 'recurrence parent must belong to the same user'; end if;
    if new.project_id is not null and not exists (
      select 1 from public.projects where id = new.project_id and user_id = new.user_id
    ) then raise exception 'project must belong to the same user'; end if;
    if new.goal_id is not null and not exists (
      select 1 from public.goals where id = new.goal_id and user_id = new.user_id
    ) then raise exception 'goal must belong to the same user'; end if;
  elsif tg_table_name = 'projects' then
    if new.goal_id is not null and not exists (
      select 1 from public.goals where id = new.goal_id and user_id = new.user_id
    ) then raise exception 'goal must belong to the same user'; end if;
  elsif tg_table_name = 'focus_sessions' then
    if new.task_id is not null and not exists (
      select 1 from public.tasks where id = new.task_id and user_id = new.user_id
    ) then raise exception 'task must belong to the same user'; end if;
  elsif tg_table_name = 'task_energy_audits' then
    if not exists (
      select 1 from public.tasks where id = new.task_id and user_id = new.user_id
    ) then raise exception 'task must belong to the same user'; end if;
  end if;
  return new;
end $$;

drop trigger if exists tasks_enforce_owned_relationships on public.tasks;
create trigger tasks_enforce_owned_relationships before insert or update of user_id, recurrence_parent_id, project_id, goal_id
on public.tasks for each row execute function public.enforce_owned_relationships();

drop trigger if exists projects_enforce_owned_relationships on public.projects;
create trigger projects_enforce_owned_relationships before insert or update of user_id, goal_id
on public.projects for each row execute function public.enforce_owned_relationships();

drop trigger if exists focus_sessions_enforce_owned_relationships on public.focus_sessions;
create trigger focus_sessions_enforce_owned_relationships before insert or update of user_id, task_id
on public.focus_sessions for each row execute function public.enforce_owned_relationships();

drop trigger if exists audits_enforce_owned_relationships on public.task_energy_audits;
create trigger audits_enforce_owned_relationships before insert or update of user_id, task_id
on public.task_energy_audits for each row execute function public.enforce_owned_relationships();

revoke execute on function public.refresh_user_stats(uuid) from public, anon, authenticated;
revoke execute on function public.tasks_refresh_stats_trigger() from public, anon, authenticated;
revoke execute on function public.enforce_owned_relationships() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- Recreate explicit operation policies for every user-owned table. Policy
-- names are table-specific so verification output is unambiguous.
do $$ declare t text; begin
  foreach t in array array[
    'tasks','projects','goals','user_settings','focus_sessions',
    'task_energy_audits','energy_checkins','user_stats',
    'push_subscriptions','processed_mutations','ai_import_usage'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "own_select" on public.%I', t);
    execute format('drop policy if exists "own_insert" on public.%I', t);
    execute format('drop policy if exists "own_update" on public.%I', t);
    execute format('drop policy if exists "own_delete" on public.%I', t);
    execute format('drop policy if exists "%s_select_own" on public.%I', t, t);
    execute format('drop policy if exists "%s_insert_own" on public.%I', t, t);
    execute format('drop policy if exists "%s_update_own" on public.%I', t, t);
    execute format('drop policy if exists "%s_delete_own" on public.%I', t, t);
    execute format('create policy "%s_select_own" on public.%I for select to authenticated using (auth.uid() = user_id)', t, t);
    execute format('create policy "%s_insert_own" on public.%I for insert to authenticated with check (auth.uid() = user_id)', t, t);
    execute format('create policy "%s_update_own" on public.%I for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)', t, t);
    execute format('create policy "%s_delete_own" on public.%I for delete to authenticated using (auth.uid() = user_id)', t, t);
    execute format('revoke all on table public.%I from public, anon, authenticated', t);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', t);
  end loop;
end $$;

-- Some upgraded projects retain the legacy energy_logs table for compatibility.
-- Harden it without creating it on clean installations.
do $$ begin
  if to_regclass('public.energy_logs') is not null then
    alter table public.energy_logs enable row level security;
    drop policy if exists "Users can view their own energy logs" on public.energy_logs;
    drop policy if exists "Users can insert their own energy logs" on public.energy_logs;
    drop policy if exists "energy_logs_select_own" on public.energy_logs;
    drop policy if exists "energy_logs_insert_own" on public.energy_logs;
    drop policy if exists "energy_logs_update_own" on public.energy_logs;
    drop policy if exists "energy_logs_delete_own" on public.energy_logs;
    create policy "energy_logs_select_own" on public.energy_logs for select to authenticated using (auth.uid() = user_id);
    create policy "energy_logs_insert_own" on public.energy_logs for insert to authenticated with check (auth.uid() = user_id);
    create policy "energy_logs_update_own" on public.energy_logs for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
    create policy "energy_logs_delete_own" on public.energy_logs for delete to authenticated using (auth.uid() = user_id);
    revoke all on table public.energy_logs from public, anon, authenticated;
    grant select, insert, update, delete on table public.energy_logs to authenticated;
  end if;
end $$;

commit;
