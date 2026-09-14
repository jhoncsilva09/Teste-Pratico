-- Execute este arquivo no Supabase SQL Editor.
-- Antes de testar o login, crie os usuários em Authentication > Users.

create extension if not exists pgcrypto;

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date date not null,
  name text not null check (char_length(trim(name)) >= 2),
  reason text not null check (reason in ('TESTE', 'RETESTE')),
  result text not null default 'PENDENTE' check (result in ('PENDENTE', 'APROVADO', 'REPROVADO')),
  created_at timestamptz not null default now()
);

create index if not exists students_user_id_idx on public.students(user_id);
create index if not exists students_date_idx on public.students(date desc);

alter table public.students enable row level security;
alter table public.students force row level security;

drop policy if exists "Usuários autenticados podem visualizar seus alunos" on public.students;
create policy "Usuários autenticados podem visualizar seus alunos"
on public.students for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Usuários autenticados podem cadastrar alunos" on public.students;
create policy "Usuários autenticados podem cadastrar alunos"
on public.students for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Usuários autenticados podem editar seus alunos" on public.students;
create policy "Usuários autenticados podem editar seus alunos"
on public.students for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Usuários autenticados podem excluir seus alunos" on public.students;
create policy "Usuários autenticados podem excluir seus alunos"
on public.students for delete
to authenticated
using (auth.uid() = user_id);

-- Opcional: impede que o cliente altere o dono do registro.
create or replace function public.prevent_student_owner_change()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.user_id := old.user_id;
  return new;
end;
$$;

drop trigger if exists protect_student_owner on public.students;
create trigger protect_student_owner
before update on public.students
for each row execute function public.prevent_student_owner_change();
