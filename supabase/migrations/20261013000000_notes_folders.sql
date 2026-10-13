create extension if not exists pgcrypto;

create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  created_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, name)
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  folder_id uuid,
  title text not null default '',
  content text not null default '',
  favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint notes_folder_owner_fk
    foreign key (folder_id, user_id)
    references public.folders (id, user_id)
    on delete set null (folder_id)
);

create index if not exists notes_user_updated_idx
  on public.notes (user_id, updated_at desc);
create index if not exists folders_user_created_idx
  on public.folders (user_id, created_at asc);

alter table public.notes enable row level security;
alter table public.folders enable row level security;

grant select, insert, update, delete on public.notes, public.folders to authenticated;

create policy "Users can read their own notes"
  on public.notes for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can create their own notes"
  on public.notes for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can update their own notes"
  on public.notes for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users can delete their own notes"
  on public.notes for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read their own folders"
  on public.folders for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can create their own folders"
  on public.folders for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users can update their own folders"
  on public.folders for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users can delete their own folders"
  on public.folders for delete to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.set_note_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger notes_set_updated_at
before update on public.notes
for each row execute function public.set_note_updated_at();

alter publication supabase_realtime add table public.notes;
alter publication supabase_realtime add table public.folders;
