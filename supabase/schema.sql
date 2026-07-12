-- ============================================================
-- OptiScreen — Supabase PostgreSQL Schema
-- Clinical-grade cataract detection platform
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Diagnostics table
create table if not exists public.diagnostics (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  image_url text,
  disease_detected varchar(50) not null,
  confidence_score double precision not null,
  severity varchar(20) not null,
  explanation text,
  recommendations jsonb default '[]'::jsonb,
  created_at timestamptz default now() not null
);

-- Index on user_id for efficient queries
create index if not exists idx_diagnostics_user_id on public.diagnostics(user_id);

-- Enable Row Level Security
alter table public.diagnostics enable row level security;

-- RLS Policy: Users can only view their own diagnostics
create policy "Users can view own diagnostics"
  on public.diagnostics
  for select
  using (auth.uid() = user_id);

-- RLS Policy: Service role can insert diagnostics (backend uses service key)
create policy "Service role can insert diagnostics"
  on public.diagnostics
  for insert
  with check (true);

-- Create storage bucket for eye scan images
insert into storage.buckets (id, name, public)
values ('eye-scans', 'eye-scans', false)
on conflict (id) do nothing;

-- Storage policy: authenticated users can upload to their own folder
create policy "Users can upload eye scans"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'eye-scans' and (storage.foldername(name))[1] = auth.uid()::text);

-- Storage policy: users can read their own uploads
create policy "Users can view own eye scans"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'eye-scans' and (storage.foldername(name))[1] = auth.uid()::text);
