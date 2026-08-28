-- Tem Aí? — Incremento 1: perfis de usuário
-- Execute no Supabase Dashboard → SQL Editor → New query → Run

-- ---------------------------------------------------------------------------
-- Tabela de perfis (estende auth.users com dados do marketplace)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  nome text not null,
  telefone text,
  avatar_url text,
  verificado boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Perfil público de cada usuário cadastrado no Tem Aí?';
comment on column public.profiles.verificado is 'Badge de identidade verificada (filtro em /explorar)';

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

-- Qualquer pessoa pode ver perfis (cards de locador, etc.)
create policy "Perfis visíveis para todos"
  on public.profiles for select
  using (true);

-- Só o próprio usuário cria o perfil (via trigger abaixo)
create policy "Usuário insere o próprio perfil"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Só o próprio usuário edita o perfil
create policy "Usuário atualiza o próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- Trigger: criar perfil automaticamente no cadastro
-- Os campos nome e telefone vêm de raw_user_meta_data no signUp.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, nome, telefone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', 'Usuário'),
    new.raw_user_meta_data ->> 'telefone'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Trigger: atualizar updated_at ao editar perfil
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
