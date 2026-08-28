-- Client Hunting Platform - Supabase schema
-- Run in Supabase SQL editor
create extension if not exists "uuid-ossp";

-- Users mirror auth.users but store profile
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text,
  avatar_url text,
  created_at timestamptz default now()
);

create table if not exists projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade not null,
  name text not null,
  description text,
  country text,
  states text[],
  cities text[],
  niche text,
  sub_niche text,
  services text[],
  target_positions text[],
  target_lead_count int,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists leads (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade not null,
  project_id uuid references projects(id) on delete set null,
  business_name text not null,
  business_type text,
  industry text,
  niche text,
  sub_niche text,
  country text,
  state text,
  city text,
  address text,
  postal_code text,
  website text,
  source text,
  source_url text,
  contact_first_name text,
  contact_last_name text,
  contact_position text,
  email text,
  email_status text default 'UNKNOWN',
  phone text,
  phone_status text default 'UNKNOWN',
  whatsapp text,
  facebook text,
  instagram text,
  linkedin text,
  other_socials jsonb default '{}',
  status text default 'NEW',
  lead_score int default 0,
  notes text,
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_contacted timestamptz,
  next_followup timestamptz
);
create index if not exists leads_user_idx on leads(user_id);
create index if not exists leads_project_idx on leads(project_id);
create index if not exists leads_email_idx on leads(email);
create index if not exists leads_status_idx on leads(status);

create table if not exists tags (id uuid primary key default uuid_generate_v4(), user_id uuid references users(id) on delete cascade, name text not null, color text, created_at timestamptz default now(), unique(user_id,name));
create table if not exists lead_tags (lead_id uuid references leads(id) on delete cascade, tag_id uuid references tags(id) on delete cascade, primary key(lead_id,tag_id));

create table if not exists lead_verifications (id uuid primary key default uuid_generate_v4(), lead_id uuid references leads(id) on delete cascade, type text, status text, details jsonb, created_at timestamptz default now());
create table if not exists lead_sources (id uuid primary key default uuid_generate_v4(), lead_id uuid references leads(id) on delete cascade, source text, source_url text, metadata jsonb, created_at timestamptz default now());

create table if not exists campaigns (id uuid primary key default uuid_generate_v4(), user_id uuid references users(id) on delete cascade, project_id uuid references projects(id) on delete set null, name text not null, template_id uuid, status text default 'draft', created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists campaign_recipients (id uuid primary key default uuid_generate_v4(), campaign_id uuid references campaigns(id) on delete cascade, lead_id uuid references leads(id) on delete cascade, recipient_email text, subject text, body text, status text default 'QUEUED', gmail_message_id text, gmail_thread_id text, error text, sent_at timestamptz, created_at timestamptz default now());

create table if not exists email_threads (id uuid primary key default uuid_generate_v4(), user_id uuid references users(id) on delete cascade, lead_id uuid references leads(id) on delete set null, gmail_thread_id text unique, subject text, snippet text, updated_at timestamptz default now());
create table if not exists email_messages (id uuid primary key default uuid_generate_v4(), thread_id uuid references email_threads(id) on delete cascade, gmail_message_id text, from_email text, to_email text, subject text, body text, snippet text, direction text, created_at timestamptz default now());

create table if not exists email_templates (id uuid primary key default uuid_generate_v4(), user_id uuid references users(id) on delete cascade, name text not null, subject text, body text, service text, niche text, country text, language text default 'en', status text default 'active', created_at timestamptz default now());
create table if not exists ai_prompts (id uuid primary key default uuid_generate_v4(), user_id uuid references users(id) on delete cascade, name text not null, system_instruction text, template text, variables text[], created_at timestamptz default now());
create table if not exists ai_generations (id uuid primary key default uuid_generate_v4(), user_id uuid references users(id) on delete cascade, prompt_id uuid references ai_prompts(id) on delete set null, lead_id uuid references leads(id) on delete set null, input jsonb, output text, created_at timestamptz default now());

create table if not exists integrations (id uuid primary key default uuid_generate_v4(), user_id uuid references users(id) on delete cascade, provider text not null, status text, metadata jsonb, created_at timestamptz default now(), unique(user_id,provider));
create table if not exists oauth_accounts (id uuid primary key default uuid_generate_v4(), user_id uuid references users(id) on delete cascade, provider text not null, access_token text, refresh_token text, expiry_date timestamptz, scope text, created_at timestamptz default now(), updated_at timestamptz default now(), unique(user_id,provider));

create table if not exists extension_sessions (id uuid primary key default uuid_generate_v4(), user_id uuid references users(id) on delete cascade, token text unique not null, expires_at timestamptz, created_at timestamptz default now());
create table if not exists activity_logs (id uuid primary key default uuid_generate_v4(), user_id uuid references users(id) on delete cascade, action text, entity_type text, entity_id uuid, details jsonb, created_at timestamptz default now());
create table if not exists system_logs (id uuid primary key default uuid_generate_v4(), level text, message text, details jsonb, created_at timestamptz default now());
create table if not exists followups (id uuid primary key default uuid_generate_v4(), campaign_id uuid references campaigns(id) on delete cascade, lead_id uuid references leads(id) on delete cascade, step int, scheduled_at timestamptz, status text default 'pending', created_at timestamptz default now());

-- RLS
alter table projects enable row level security;
alter table leads enable row level security;
alter table campaigns enable row level security;
alter table campaign_recipients enable row level security;
alter table email_threads enable row level security;
alter table email_messages enable row level security;
alter table email_templates enable row level security;
alter table ai_prompts enable row level security;
-- Policies: user can only access own rows (service role bypasses)
create policy "users own projects" on projects for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "users own leads" on leads for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "users own campaigns" on campaigns for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
