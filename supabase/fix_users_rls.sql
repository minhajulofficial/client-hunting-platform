-- Fix: auto-create public.users row when a new auth user signs up
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql/new

-- 1. Function to mirror auth.users into public.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, avatar_url, created_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    new.created_at
  )
  on conflict (id) do update set
    email = excluded.email,
    name = coalesce(excluded.name, users.name),
    avatar_url = coalesce(excluded.avatar_url, users.avatar_url);
  return new;
end;
$$ language plpgsql security definer;

-- 2. Trigger: fires after every new auth.users insert
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Backfill: create users row for any existing auth users missing from public.users
insert into public.users (id, email, name, avatar_url, created_at)
select
  au.id,
  au.email,
  coalesce(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name'),
  au.raw_user_meta_data->>'avatar_url',
  au.created_at
from auth.users au
left join public.users pu on pu.id = au.id
where pu.id is null
on conflict (id) do nothing;

-- 4. Allow the trigger-owned inserts (security definer already bypasses RLS)
-- But also add a permissive policy for authenticated users to insert their own row
-- (needed for the application-level upsert fallback)
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'users_insert_own' and tablename = 'users') then
    create policy users_insert_own on public.users
      for insert to authenticated
      with check (auth.uid() = id);
  end if;
end $$;

-- 5. Allow users to read their own row
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'users_select_own' and tablename = 'users') then
    create policy users_select_own on public.users
      for select to authenticated
      using (auth.uid() = id);
  end if;
end $$;

-- 6. Allow users to update their own row
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'users_update_own' and tablename = 'users') then
    create policy users_update_own on public.users
      for update to authenticated
      using (auth.uid() = id)
      with check (auth.uid() = id);
  end if;
end $$;
