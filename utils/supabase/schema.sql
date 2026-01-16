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
