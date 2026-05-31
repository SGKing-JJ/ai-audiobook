-- ============================================================
-- AI 聽書平台 — 初始資料庫 Schema（可重複執行版）
-- ============================================================

create extension if not exists "uuid-ossp";

-- 使用者 Profile
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  avatar_url    text,
  locale        text not null default 'zh-TW',
  plan          text not null default 'free',
  created_at    timestamptz default now()
);

-- 書籍分類
create table if not exists public.categories (
  id        uuid primary key default uuid_generate_v4(),
  slug      text unique not null,
  name_zh   text not null,
  name_en   text not null,
  parent_id uuid references public.categories(id)
);

-- 書籍
create table if not exists public.books (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references public.profiles(id) on delete cascade,
  title        text not null,
  author       text,
  cover_url    text,
  description  text,
  language     text not null default 'zh',
  source_type  text not null default 'upload',
  file_path    text,
  status       text not null default 'processing',
  category_id  uuid references public.categories(id),
  created_at   timestamptz default now()
);

-- AI 摘要
create table if not exists public.summaries (
  id            uuid primary key default uuid_generate_v4(),
  book_id       uuid not null references public.books(id) on delete cascade,
  version       text not null,
  content_text  text,
  audio_path    text,
  duration_sec  integer,
  language      text not null default 'zh',
  model_used    text,
  status        text not null default 'generating',
  created_at    timestamptz default now(),
  unique(book_id, version, language)
);

-- 播放進度
create table if not exists public.play_progress (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  summary_id    uuid not null references public.summaries(id) on delete cascade,
  position_sec  integer not null default 0,
  completed     boolean not null default false,
  updated_at    timestamptz default now(),
  unique(user_id, summary_id)
);

-- 收藏
create table if not exists public.favorites (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  book_id    uuid not null references public.books(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, book_id)
);

-- Trigger：新用戶自動建立 profile
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.books enable row level security;
alter table public.summaries enable row level security;
alter table public.play_progress enable row level security;
alter table public.favorites enable row level security;

-- Policies（先刪再建，避免重複）
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

drop policy if exists "books_select_own" on public.books;
drop policy if exists "books_insert_own" on public.books;
drop policy if exists "books_delete_own" on public.books;
create policy "books_select_own" on public.books for select using (auth.uid() = user_id);
create policy "books_insert_own" on public.books for insert with check (auth.uid() = user_id);
create policy "books_delete_own" on public.books for delete using (auth.uid() = user_id);

drop policy if exists "summaries_select_own" on public.summaries;
create policy "summaries_select_own" on public.summaries for select
  using (exists (
    select 1 from public.books
    where books.id = summaries.book_id and books.user_id = auth.uid()
  ));

drop policy if exists "progress_all_own" on public.play_progress;
create policy "progress_all_own" on public.play_progress for all using (auth.uid() = user_id);

drop policy if exists "favorites_all_own" on public.favorites;
create policy "favorites_all_own" on public.favorites for all using (auth.uid() = user_id);
