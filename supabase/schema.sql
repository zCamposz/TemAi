-- Tem Aí? — Incrementos 1 a 3 (perfis + anúncios + geolocalização)
-- Execute no Supabase Dashboard → SQL Editor → New query → Run
-- Pode rodar de novo com segurança (idempotente): recria o que faltar
-- sem falhar se trigger/policy/tabela já existirem.

-- ---------------------------------------------------------------------------
-- Tabela de perfis (estende auth.users com dados do marketplace)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
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

drop policy if exists "Perfis visíveis para todos" on public.profiles;
create policy "Perfis visíveis para todos"
  on public.profiles for select
  using (true);

drop policy if exists "Usuário insere o próprio perfil" on public.profiles;
create policy "Usuário insere o próprio perfil"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Usuário atualiza o próprio perfil" on public.profiles;
create policy "Usuário atualiza o próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- Trigger: criar perfil automaticamente no cadastro
-- Os campos nome e telefone vêm de raw_user_meta_data no signUp.
-- O trigger fica em auth.users — apagar public.profiles NÃO o remove.
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

drop trigger if exists on_auth_user_created on auth.users;
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

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- Incremento 2: anúncios (produtos) + fotos no Storage
-- ===========================================================================

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  slug text not null unique,
  titulo text not null,
  categoria text not null,
  estado text not null,
  descricao text not null,
  marca text,
  modelo text,
  voltagem text,
  preco_dia numeric(10, 2) not null check (preco_dia > 0),
  desconto_semana integer not null default 0 check (desconto_semana >= 0 and desconto_semana <= 90),
  caucao numeric(10, 2) not null default 0 check (caucao >= 0),
  retirada boolean not null default true,
  entrega_regiao boolean not null default false,
  ponto_encontro boolean not null default false,
  cep text not null,
  bairro text not null,
  cidade text not null,
  fotos text[] not null default '{}',
  status text not null default 'publicado' check (status in ('rascunho', 'publicado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.products is 'Anúncios de itens para aluguel (Incremento 2)';
comment on column public.products.fotos is 'URLs públicas das fotos no bucket product-photos';
comment on column public.products.status is 'rascunho = só o dono vê; publicado = aparece em /explorar';

create index if not exists products_owner_id_idx on public.products (owner_id);
create index if not exists products_status_idx on public.products (status);
create index if not exists products_categoria_idx on public.products (categoria);

alter table public.products enable row level security;

drop policy if exists "Anúncios publicados visíveis" on public.products;
create policy "Anúncios publicados visíveis"
  on public.products for select
  using (status = 'publicado' or auth.uid() = owner_id);

drop policy if exists "Dono insere anúncio" on public.products;
create policy "Dono insere anúncio"
  on public.products for insert
  with check (auth.uid() = owner_id);

drop policy if exists "Dono atualiza anúncio" on public.products;
create policy "Dono atualiza anúncio"
  on public.products for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "Dono remove anúncio" on public.products;
create policy "Dono remove anúncio"
  on public.products for delete
  using (auth.uid() = owner_id);

grant select on table public.products to anon, authenticated;
grant insert, update, delete on table public.products to authenticated;

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- Fotos dos anúncios (leitura pública; escrita só na pasta do próprio usuário)
insert into storage.buckets (id, name, public)
values ('product-photos', 'product-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "Fotos de produtos públicas" on storage.objects;
create policy "Fotos de produtos públicas"
  on storage.objects for select
  using (bucket_id = 'product-photos');

drop policy if exists "Usuário envia fotos do anúncio" on storage.objects;
create policy "Usuário envia fotos do anúncio"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'product-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Usuário atualiza fotos do anúncio" on storage.objects;
create policy "Usuário atualiza fotos do anúncio"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'product-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Usuário remove fotos do anúncio" on storage.objects;
create policy "Usuário remove fotos do anúncio"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'product-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ===========================================================================
-- Incremento 3: geolocalização (PostGIS + busca por raio)
-- ===========================================================================

create extension if not exists postgis with schema extensions;

alter table public.products
  add column if not exists lat double precision;

alter table public.products
  add column if not exists lng double precision;

alter table public.products
  add column if not exists location extensions.geography(point, 4326);

comment on column public.products.lat is 'Latitude do CEP do anúncio (não é o endereço da casa)';
comment on column public.products.lng is 'Longitude do CEP do anúncio';
comment on column public.products.location is 'Ponto geográfico para ST_DWithin (preenchido pelo trigger)';

create or replace function public.products_sync_location()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
begin
  if new.lat is null or new.lng is null then
    new.location = null;
  else
    new.location = st_setsrid(st_makepoint(new.lng, new.lat), 4326)::geography;
  end if;
  return new;
end;
$$;

drop trigger if exists products_sync_location on public.products;
create trigger products_sync_location
  before insert or update of lat, lng
  on public.products
  for each row execute function public.products_sync_location();

update public.products
set lat = lat
where lat is not null and lng is not null and location is null;

create index if not exists products_location_gix
  on public.products using gist (location);

create or replace function public.search_products_near(
  origin_lat double precision,
  origin_lng double precision,
  radius_km double precision default 25
)
returns table (
  id uuid,
  distance_km double precision
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select
    p.id,
    st_distance(
      p.location,
      st_setsrid(st_makepoint(origin_lng, origin_lat), 4326)::geography
    ) / 1000.0 as distance_km
  from public.products p
  where p.status = 'publicado'
    and p.location is not null
    and st_dwithin(
      p.location,
      st_setsrid(st_makepoint(origin_lng, origin_lat), 4326)::geography,
      greatest(radius_km, 0) * 1000.0
    )
  order by 2;
$$;

grant execute on function public.search_products_near(double precision, double precision, double precision)
  to anon, authenticated;
