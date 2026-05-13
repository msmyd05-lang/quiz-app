-- Run this in Supabase SQL Editor

create table if not exists progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  card_id text not null,
  card_type text not null, -- 'grammar' or 'it'
  interval integer default 0,
  repetitions integer default 0,
  ease_factor float default 2.5,
  next_review timestamptz,
  last_reviewed timestamptz,
  last_quality integer,
  created_at timestamptz default now(),
  unique(user_id, card_id)
);

-- Enable Row Level Security
alter table progress enable row level security;

-- Policy: users can only see and edit their own progress
create policy "Users can view own progress" on progress
  for select using (auth.uid() = user_id);

create policy "Users can insert own progress" on progress
  for insert with check (auth.uid() = user_id);

create policy "Users can update own progress" on progress
  for update using (auth.uid() = user_id);
CREATE POLICY "Users can view own progress" ...
DROP POLICY IF EXISTS "Users can view own progress" ON progress;

CREATE POLICY "Users can view own progress" 
ON progress FOR SELECT 
USING (auth.uid() = user_id);