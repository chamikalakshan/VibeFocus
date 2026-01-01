-- Create a table for tasks
create table tasks (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  status text not null default 'pending', -- 'pending' | 'completed' | 'audited'
  energy text, -- 'green' | 'red' | 'yellow'
  user_id uuid references auth.users not null
);

-- Set up Row Level Security (RLS)
-- 1. Enable RLS
alter table tasks enable row level security;

-- 2. Create Policy to allow users to see mostly their own tasks
create policy "Users can translate their own tasks"
  on tasks for all
  using ( auth.uid() = user_id );

-- (Optional) Create a profile table for streaks if needed later
