begin;

create extension if not exists pgcrypto;

do $$ begin
  create type public.task_status as enum ('pending', 'completed', 'archived');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.task_priority as enum ('low', 'medium', 'high');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.task_source as enum ('manual', 'bulk_import', 'ai_import');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.energy_rating as enum ('energizing', 'neutral', 'draining');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.focus_status as enum ('running', 'paused', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = timezone('utc', now()); return new; end $$;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.tasks add column if not exists description text;
alter table public.tasks add column if not exists status text;
alter table public.tasks add column if not exists priority text;
alter table public.tasks add column if not exists due_at timestamptz;
alter table public.tasks add column if not exists estimated_minutes integer;
alter table public.tasks add column if not exists required_energy text;
alter table public.tasks add column if not exists category text;
alter table public.tasks add column if not exists source text;
alter table public.tasks add column if not exists top_priority_rank smallint;
alter table public.tasks add column if not exists recurrence text;
alter table public.tasks add column if not exists recurrence_parent_id uuid references public.tasks(id) on delete set null;
alter table public.tasks add column if not exists occurrence_date date;
alter table public.tasks add column if not exists updated_at timestamptz;
alter table public.tasks add column if not exists completed_at timestamptz;

do $$ begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='tasks' and column_name='is_completed') then
    execute 'update public.tasks set status = case when is_completed then ''completed'' else coalesce(status, ''pending'') end';
  end if;
end $$;

update public.tasks set completed_at = coalesce(completed_at, created_at) where status in ('completed', 'audited');
update public.tasks set status = case when status in ('completed', 'audited') then 'completed' when status = 'archived' then 'archived' else 'pending' end;
update public.tasks set priority = coalesce(priority, 'medium'), source = coalesce(source, 'manual'), updated_at = coalesce(updated_at, created_at);
alter table public.tasks alter column status set default 'pending';
alter table public.tasks alter column status set not null;
alter table public.tasks alter column priority set default 'medium';
alter table public.tasks alter column priority set not null;
alter table public.tasks alter column source set default 'manual';
alter table public.tasks alter column source set not null;
alter table public.tasks alter column updated_at set default timezone('utc', now());
alter table public.tasks alter column updated_at set not null;

do $$ begin alter table public.tasks add constraint tasks_status_check check (status in ('pending','completed','archived')); exception when duplicate_object then null; end $$;
do $$ begin alter table public.tasks add constraint tasks_priority_check check (priority in ('low','medium','high')); exception when duplicate_object then null; end $$;
do $$ begin alter table public.tasks add constraint tasks_required_energy_check check (required_energy is null or required_energy in ('low','medium','high')); exception when duplicate_object then null; end $$;
do $$ begin alter table public.tasks add constraint tasks_source_check check (source in ('manual','bulk_import','ai_import')); exception when duplicate_object then null; end $$;
do $$ begin alter table public.tasks add constraint tasks_top_priority_check check (top_priority_rank is null or top_priority_rank between 1 and 3); exception when duplicate_object then null; end $$;
do $$ begin alter table public.tasks add constraint tasks_recurrence_check check (recurrence is null or recurrence in ('daily','weekdays','weekly','monthly')); exception when duplicate_object then null; end $$;
do $$ begin alter table public.tasks add constraint tasks_estimated_minutes_check check (estimated_minutes is null or estimated_minutes between 1 and 1440); exception when duplicate_object then null; end $$;

create unique index if not exists tasks_user_top_priority_unique on public.tasks(user_id, top_priority_rank) where top_priority_rank is not null and status='pending';
create unique index if not exists tasks_occurrence_unique on public.tasks(recurrence_parent_id, occurrence_date) where recurrence_parent_id is not null;
create index if not exists tasks_user_status_created_idx on public.tasks(user_id, status, created_at desc);
create index if not exists tasks_user_due_idx on public.tasks(user_id, due_at) where due_at is not null;
drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at before update on public.tasks for each row execute function public.set_updated_at();

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text, timezone text not null default 'UTC',
  theme text not null default 'system' check (theme in ('dark','light','system')),
  reduced_motion boolean not null default false,
  default_focus_minutes integer not null default 25 check (default_focus_minutes between 1 and 60),
  default_break_minutes integer not null default 5 check (default_break_minutes between 1 and 60),
  audio_enabled boolean not null default false, timer_sound_enabled boolean not null default true,
  auto_start_break boolean not null default false, auto_complete_task boolean not null default false,
  notifications_enabled boolean not null default false, daily_reminder_time time, audit_reminder_time time,
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null, planned_duration_seconds integer not null check (planned_duration_seconds between 60 and 86400),
  actual_duration_seconds integer not null default 0 check (actual_duration_seconds >= 0), remaining_seconds integer not null check (remaining_seconds >= 0),
  started_at timestamptz, ends_at timestamptz, paused_at timestamptz, ended_at timestamptz,
  status text not null default 'paused' check (status in ('running','paused','completed','cancelled')),
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.task_energy_audits (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null unique references public.tasks(id) on delete cascade,
  rating text not null check (rating in ('energizing','neutral','draining')),
  energy_before smallint check (energy_before between 1 and 5), energy_after smallint check (energy_after between 1 and 5),
  note text check (note is null or char_length(note) <= 500),
  audited_at timestamptz not null default timezone('utc', now()), created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.energy_checkins (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  level smallint not null check (level between 1 and 5), note text, checked_at timestamptz not null default timezone('utc', now()), created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_stats (
  user_id uuid primary key references auth.users(id) on delete cascade, current_streak integer not null default 0,
  longest_streak integer not null default 0, last_active_date date, total_completed_tasks integer not null default 0,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null, p256dh text not null, auth text not null,
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now()),
  unique(user_id, endpoint)
);

create table if not exists public.processed_mutations (
  id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
  processed_at timestamptz not null default timezone('utc', now()), unique(user_id, id)
);

create table if not exists public.ai_import_usage (
  user_id uuid not null references auth.users(id) on delete cascade, window_started_at timestamptz not null,
  request_count integer not null default 1 check (request_count >= 0), primary key(user_id, window_started_at)
);

create index if not exists focus_sessions_user_created_idx on public.focus_sessions(user_id, created_at desc);
create index if not exists audits_user_audited_idx on public.task_energy_audits(user_id, audited_at desc);
create index if not exists checkins_user_checked_idx on public.energy_checkins(user_id, checked_at desc);

do $$ declare t text; begin
  foreach t in array array['tasks','user_settings','focus_sessions','task_energy_audits','energy_checkins','user_stats','push_subscriptions','processed_mutations','ai_import_usage']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "own_select" on public.%I', t);
    execute format('drop policy if exists "own_insert" on public.%I', t);
    execute format('drop policy if exists "own_update" on public.%I', t);
    execute format('drop policy if exists "own_delete" on public.%I', t);
    execute format('create policy "own_select" on public.%I for select using (auth.uid() = user_id)', t);
    execute format('create policy "own_insert" on public.%I for insert with check (auth.uid() = user_id)', t);
    execute format('create policy "own_update" on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
    execute format('create policy "own_delete" on public.%I for delete using (auth.uid() = user_id)', t);
  end loop;
end $$;

do $$ begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='tasks' and column_name='energy') then
    execute $backfill$
      insert into public.task_energy_audits(user_id, task_id, rating, audited_at)
      select user_id, id, case energy when 'green' then 'energizing' when 'red' then 'draining' else 'neutral' end, coalesce(completed_at, created_at)
      from public.tasks where energy is not null
      on conflict (task_id) do nothing
    $backfill$;
  end if;
end $$;

do $$ begin
  if to_regclass('public.energy_logs') is not null then
    execute $backfill$
      insert into public.energy_checkins(user_id, level, note, checked_at, created_at)
      select user_id, greatest(1, least(5, ceil(level::numeric / 20)::int)), notes, created_at, created_at
      from public.energy_logs
    $backfill$;
  end if;
end $$;

alter table public.tasks drop column if exists is_completed;
alter table public.tasks drop column if exists energy;

commit;
