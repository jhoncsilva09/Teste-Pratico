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

-- Importação de CSV: importe primeiro o arquivo nesta tabela de staging.
-- As colunas são text e aceitam células vazias durante a importação.
create table if not exists public.students_import (
  date text,
  name text,
  reason text,
  result text
);

-- Depois de importar o CSV, execute:
-- select public.import_students('UUID_DO_USUARIO');
-- Linhas inválidas não são inseridas e podem ser conferidas na consulta abaixo.
create or replace function public.import_students(import_user_id uuid)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  imported_count integer;
begin
  insert into public.students (user_id, date, name, reason, result)
  select
    import_user_id,
    coalesce(nullif(trim(date), ''), current_date::text)::date,
    trim(name),
    coalesce(nullif(upper(trim(reason)), ''), 'TESTE'),
    coalesce(nullif(upper(trim(result)), ''), 'PENDENTE')
  from public.students_import
  where char_length(trim(name)) >= 2
    and coalesce(nullif(upper(trim(reason)), ''), 'TESTE') in ('TESTE', 'RETESTE')
    and coalesce(nullif(upper(trim(result)), ''), 'PENDENTE') in ('PENDENTE', 'APROVADO', 'REPROVADO');

  get diagnostics imported_count = row_count;
  return imported_count;
end;
$$;

-- Confira as linhas que precisam de correção antes de repetir a importação.
select *
from public.students_import
where nullif(trim(name), '') is null
   or coalesce(nullif(upper(trim(reason)), ''), 'TESTE') not in ('TESTE', 'RETESTE')
   or coalesce(nullif(upper(trim(result)), ''), 'PENDENTE') not in ('PENDENTE', 'APROVADO', 'REPROVADO');
