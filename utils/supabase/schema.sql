-- Create a table for tracking energy levels
create table energy_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  level integer not null check (level >= 0 and level <= 100),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table energy_logs enable row level security;

-- Create policies
create policy "Users can view their own energy logs"
  on energy_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own energy logs"
  on energy_logs for insert
  with check (auth.uid() = user_id);

-- Create an index on created_at for faster queries
create index energy_logs_created_at_idx on energy_logs (created_at);

-- Create a table for tracking tasks
create table tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  title text not null,
  is_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) for tasks
alter table tasks enable row level security;

-- Create policies for tasks
create policy "Users can view their own tasks"
  on tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own tasks"
  on tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own tasks"
  on tasks for update
  using (auth.uid() = user_id);

create policy "Users can delete their own tasks"
  on tasks for delete
  using (auth.uid() = user_id);

-- Create an index on created_at for faster queries
create index tasks_created_at_idx on tasks (created_at);
