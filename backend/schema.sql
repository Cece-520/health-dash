-- ============================================================
-- Wellness Tracker — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Profiles table (extends Supabase's built-in auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text,
  created_at timestamptz default now()
);

-- Auto-create a profile row whenever a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- Check-ins table
create table public.check_ins (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  mood int check (mood between 1 and 10) not null,
  sleep_hours numeric(4,1) check (sleep_hours between 0 and 24) not null,
  energy int check (energy between 1 and 10) not null,
  notes text,
  created_at timestamptz default now(),
  unique(user_id, date)  -- one check-in per user per day
);


-- Symptoms table (child of check_ins)
create table public.symptoms (
  id uuid default gen_random_uuid() primary key,
  check_in_id uuid references public.check_ins(id) on delete cascade not null,
  name text not null,
  severity int check (severity between 1 and 10) not null,
  created_at timestamptz default now()
);


-- ============================================================
-- Row Level Security
-- Enable RLS then add policies so users only see their own data
-- ============================================================

alter table public.profiles  enable row level security;
alter table public.check_ins enable row level security;
alter table public.symptoms  enable row level security;

-- Profiles: users can only read/update their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Check-ins: full CRUD for own rows only
create policy "Users can view own check-ins"
  on public.check_ins for select
  using (auth.uid() = user_id);

create policy "Users can insert own check-ins"
  on public.check_ins for insert
  with check (auth.uid() = user_id);

create policy "Users can update own check-ins"
  on public.check_ins for update
  using (auth.uid() = user_id);

create policy "Users can delete own check-ins"
  on public.check_ins for delete
  using (auth.uid() = user_id);

-- Symptoms: access via parent check-in ownership
create policy "Users can view own symptoms"
  on public.symptoms for select
  using (
    exists (
      select 1 from public.check_ins
      where check_ins.id = symptoms.check_in_id
        and check_ins.user_id = auth.uid()
    )
  );

create policy "Users can insert own symptoms"
  on public.symptoms for insert
  with check (
    exists (
      select 1 from public.check_ins
      where check_ins.id = symptoms.check_in_id
        and check_ins.user_id = auth.uid()
    )
  );

create policy "Users can delete own symptoms"
  on public.symptoms for delete
  using (
    exists (
      select 1 from public.check_ins
      where check_ins.id = symptoms.check_in_id
        and check_ins.user_id = auth.uid()
    )
  );