-- IELTS Nova Closed CDI Mock Exam Schema (Run in Supabase SQL Editor)
-- Supports 30-60 simultaneous computers with minimal database load (join + start poll + final submit only)

create table if not exists public.cdi_mock_exams (
  id text primary key,
  title text not null,
  subtitle text not null default '',
  password text not null default 'bugunseningkuning',
  start_mode text not null default 'proctor' check (start_mode in ('proctor', 'individual')),
  status text not null default 'waiting' check (status in ('waiting', 'started', 'finished')),
  started_at timestamptz null,
  writing_mode text not null default 'task1_only' check (writing_mode in ('task1_only', 'task1_and_task2')),
  config_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cdi_exam_lobby (
  id text primary key,
  mock_id text not null references public.cdi_mock_exams(id) on delete cascade,
  full_name text not null,
  status text not null default 'waiting' check (status in ('waiting', 'in_exam', 'submitted')),
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists idx_cdi_exam_lobby_mock_id on public.cdi_exam_lobby (mock_id);

create table if not exists public.cdi_exam_submissions (
  id text primary key,
  mock_id text not null,
  mock_title text not null,
  participant_id text not null,
  full_name text not null,
  submitted_at timestamptz not null default now(),
  tab_switch_count integer not null default 0,
  listening_band numeric(3,1) not null default 0,
  listening_raw integer not null default 0,
  reading_band numeric(3,1) not null default 0,
  reading_raw integer not null default 0,
  writing_band numeric(3,1) null,
  teacher_feedback text not null default '',
  graded_by text null,
  graded_at timestamptz null,
  payload_json jsonb not null
);

create index if not exists idx_cdi_exam_submissions_mock_id on public.cdi_exam_submissions (mock_id);

create table if not exists public.cdi_teachers (
  id text primary key,
  name text not null,
  email text not null unique,
  role text not null default 'teacher' check (role in ('super_admin', 'teacher')),
  created_at timestamptz not null default now()
);

-- Enable open access for server API routes (secured via signed admin cookie in Next.js API handlers)
alter table public.cdi_mock_exams enable row level security;
alter table public.cdi_exam_lobby enable row level security;
alter table public.cdi_exam_submissions enable row level security;
alter table public.cdi_teachers enable row level security;

drop policy if exists "cdi_mock_exams_all" on public.cdi_mock_exams;
create policy "cdi_mock_exams_all" on public.cdi_mock_exams for all using (true) with check (true);

drop policy if exists "cdi_exam_lobby_all" on public.cdi_exam_lobby;
create policy "cdi_exam_lobby_all" on public.cdi_exam_lobby for all using (true) with check (true);

drop policy if exists "cdi_exam_submissions_all" on public.cdi_exam_submissions;
create policy "cdi_exam_submissions_all" on public.cdi_exam_submissions for all using (true) with check (true);

drop policy if exists "cdi_teachers_all" on public.cdi_teachers;
create policy "cdi_teachers_all" on public.cdi_teachers for all using (true) with check (true);
