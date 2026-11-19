-- Tem Aí? — Incrementos 1 a 3 e endereço do perfil (origem das recomendações)
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

comment on table public.profiles is 'Perfil de cada usuário. Nome e verificação são públicos; o endereço não.';
comment on column public.profiles.verificado is 'Badge de identidade verificada (filtro em /explorar)';

-- Endereço residencial: origem privada das recomendações. Não entra no pin do anúncio.
alter table public.profiles add column if not exists cep text;
alter table public.profiles add column if not exists logradouro text;
alter table public.profiles add column if not exists numero text;
alter table public.profiles add column if not exists bairro text;
alter table public.profiles add column if not exists cidade text;
alter table public.profiles add column if not exists lat double precision;
alter table public.profiles add column if not exists lng double precision;

comment on column public.profiles.cep is 'CEP da casa do usuário. Não é público e não entra no pin do anúncio.';
comment on column public.profiles.logradouro is 'Logradouro da casa. Só o dono lê.';
comment on column public.profiles.numero is 'Número da casa. Só o dono lê; a coordenada continua sendo a do CEP.';
comment on column public.profiles.bairro is 'Bairro da casa, usado só como rótulo da origem para o próprio usuário.';
comment on column public.profiles.cidade is 'Cidade da casa, usada só como rótulo da origem para o próprio usuário.';
comment on column public.profiles.lat is 'Latitude do CEP do perfil. Não é pública.';
comment on column public.profiles.lng is 'Longitude do CEP do perfil. Não é pública.';

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

-- A policy pública precisa enxergar a linha (cards pedem nome e verificação).
-- O endereço fica de fora do SELECT de anon/authenticated. service_role não é revogado.
revoke select on table public.profiles from anon, authenticated;
grant select (
  id, nome, telefone, avatar_url, verificado, created_at, updated_at
) on public.profiles to anon, authenticated;

create or replace function public.get_own_profile()
returns public.profiles
language sql
stable
security definer
set search_path = ''
as $$
  select p.*
  from public.profiles p
  where p.id = auth.uid();
$$;

revoke all on function public.get_own_profile() from public, anon;
grant execute on function public.get_own_profile() to authenticated;

-- ---------------------------------------------------------------------------
-- Trigger: criar perfil automaticamente no cadastro
-- Nome, telefone e endereço vêm de raw_user_meta_data no signUp.
-- O trigger fica em auth.users — apagar public.profiles NÃO o remove.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  lat_text text := new.raw_user_meta_data ->> 'lat';
  lng_text text := new.raw_user_meta_data ->> 'lng';
begin
  insert into public.profiles (
    id, nome, telefone, cep, logradouro, numero, bairro, cidade, lat, lng
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', 'Usuário'),
    new.raw_user_meta_data ->> 'telefone',
    new.raw_user_meta_data ->> 'cep',
    new.raw_user_meta_data ->> 'logradouro',
    new.raw_user_meta_data ->> 'numero',
    new.raw_user_meta_data ->> 'bairro',
    new.raw_user_meta_data ->> 'cidade',
    case
      when lat_text ~ '^-?[0-9]+(\.[0-9]+)?$' then lat_text::double precision
      else null
    end,
    case
      when lng_text ~ '^-?[0-9]+(\.[0-9]+)?$' then lng_text::double precision
      else null
    end
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

-- ===========================================================================
-- Painel administrativo: papel de admin, moderação de anúncios e verificação
-- ===========================================================================

alter table public.profiles add column if not exists is_admin boolean not null default false;
comment on column public.profiles.is_admin is 'Administrador da plataforma. Só muda pelo SQL Editor (service_role).';

-- Ninguém promove a si mesmo: o cliente só escreve nas colunas abaixo
-- (is_admin e verificado ficam de fora). O trigger de cadastro é security definer.
revoke insert, update on table public.profiles from anon, authenticated;
grant insert (id, nome, telefone, avatar_url, cep, logradouro, numero, bairro, cidade, lat, lng)
  on public.profiles to authenticated;
grant update (nome, telefone, avatar_url, cep, logradouro, numero, bairro, cidade, lat, lng)
  on public.profiles to authenticated;

-- Anúncio suspenso pelo admin: some da busca e o dono não consegue reativar.
alter table public.products drop constraint if exists products_status_check;
alter table public.products
  add constraint products_status_check
  check (status in ('rascunho', 'publicado', 'suspenso'));

drop policy if exists "Dono atualiza anúncio" on public.products;
create policy "Dono atualiza anúncio"
  on public.products for update
  using (auth.uid() = owner_id and status <> 'suspenso')
  with check (auth.uid() = owner_id and status <> 'suspenso');

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create or replace function public.admin_stats()
returns json
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso restrito a administradores' using errcode = '42501';
  end if;
  return (
    select json_build_object(
      'usuarios', (select count(*) from public.profiles),
      'verificados', (select count(*) from public.profiles where verificado),
      'anuncios', (select count(*) from public.products),
      'publicados', (select count(*) from public.products where status = 'publicado'),
      'suspensos', (select count(*) from public.products where status = 'suspenso')
    )
  );
end;
$$;

create or replace function public.admin_list_profiles()
returns table (
  id uuid,
  nome text,
  telefone text,
  verificado boolean,
  is_admin boolean,
  anuncios bigint,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso restrito a administradores' using errcode = '42501';
  end if;
  return query
    select p.id, p.nome, p.telefone, p.verificado, p.is_admin,
           (select count(*) from public.products x where x.owner_id = p.id),
           p.created_at
    from public.profiles p
    order by p.created_at desc;
end;
$$;

create or replace function public.admin_list_products()
returns table (
  id uuid,
  slug text,
  titulo text,
  categoria text,
  bairro text,
  cidade text,
  preco_dia numeric,
  status text,
  owner_id uuid,
  owner_nome text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso restrito a administradores' using errcode = '42501';
  end if;
  return query
    select x.id, x.slug, x.titulo, x.categoria, x.bairro, x.cidade, x.preco_dia,
           x.status, x.owner_id, p.nome, x.created_at
    from public.products x
    join public.profiles p on p.id = x.owner_id
    order by x.created_at desc;
end;
$$;

create or replace function public.admin_set_verified(target uuid, value boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso restrito a administradores' using errcode = '42501';
  end if;
  update public.profiles set verificado = value where id = target;
end;
$$;

create or replace function public.admin_set_product_status(target uuid, new_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso restrito a administradores' using errcode = '42501';
  end if;
  if new_status not in ('publicado', 'suspenso') then
    raise exception 'Status inválido' using errcode = '22023';
  end if;
  update public.products set status = new_status where id = target;
end;
$$;

revoke all on function
  public.admin_stats(),
  public.admin_list_profiles(),
  public.admin_list_products(),
  public.admin_set_verified(uuid, boolean),
  public.admin_set_product_status(uuid, text)
from public, anon;
grant execute on function
  public.admin_stats(),
  public.admin_list_profiles(),
  public.admin_list_products(),
  public.admin_set_verified(uuid, boolean),
  public.admin_set_product_status(uuid, text)
to authenticated;

-- Para criar o primeiro admin (rode manualmente, trocando o e-mail):
--   update public.profiles set is_admin = true
--   where id = (select id from auth.users where email = 'admin@exemplo.com');

-- ===========================================================================
-- Avaliações da comunidade (depoimentos exibidos na home)
-- Só avalia quem está logado; nome e e-mail são informados no envio.
-- ===========================================================================

create table if not exists public.avaliacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  nome text not null check (char_length(btrim(nome)) between 2 and 80),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  nota smallint not null check (nota between 1 and 5),
  comentario text not null check (char_length(btrim(comentario)) >= 10),
  papel text check (papel in ('locatario', 'locador')),
  bairro text,
  visivel boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

-- Se a tabela já existia com limite de 500 caracteres, troca por "sem limite máximo".
alter table public.avaliacoes drop constraint if exists avaliacoes_comentario_check;
alter table public.avaliacoes
  add constraint avaliacoes_comentario_check
  check (char_length(btrim(comentario)) >= 10);

comment on table public.avaliacoes is 'Avaliações da plataforma feitas por usuários logados. Uma por usuário.';
comment on column public.avaliacoes.email is 'E-mail informado na avaliação. Privado: só o autor e admins leem.';
comment on column public.avaliacoes.visivel is 'Moderação: admin pode ocultar uma avaliação da home.';

create index if not exists avaliacoes_created_at_idx on public.avaliacoes (created_at desc);

alter table public.avaliacoes enable row level security;

drop policy if exists "Avaliações visíveis para todos" on public.avaliacoes;
create policy "Avaliações visíveis para todos"
  on public.avaliacoes for select
  using (visivel or auth.uid() = user_id);

drop policy if exists "Usuário logado cria a própria avaliação" on public.avaliacoes;
create policy "Usuário logado cria a própria avaliação"
  on public.avaliacoes for insert
  to authenticated
  with check (auth.uid() = user_id and visivel);

drop policy if exists "Autor atualiza a própria avaliação" on public.avaliacoes;
create policy "Autor atualiza a própria avaliação"
  on public.avaliacoes for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and visivel);

drop policy if exists "Autor remove a própria avaliação" on public.avaliacoes;
create policy "Autor remove a própria avaliação"
  on public.avaliacoes for delete
  to authenticated
  using (auth.uid() = user_id);

-- E-mail fica fora do SELECT público; o autor lê o próprio via get_own_avaliacao().
revoke all on table public.avaliacoes from anon, authenticated;
grant select (id, user_id, nome, nota, comentario, papel, bairro, visivel, created_at, updated_at)
  on public.avaliacoes to anon, authenticated;
grant insert (user_id, nome, email, nota, comentario, papel, bairro)
  on public.avaliacoes to authenticated;
grant update (nome, email, nota, comentario, papel, bairro)
  on public.avaliacoes to authenticated;
grant delete on table public.avaliacoes to authenticated;

drop trigger if exists avaliacoes_updated_at on public.avaliacoes;
create trigger avaliacoes_updated_at
  before update on public.avaliacoes
  for each row execute function public.set_updated_at();

create or replace function public.get_own_avaliacao()
returns public.avaliacoes
language sql
stable
security definer
set search_path = ''
as $$
  select a.* from public.avaliacoes a where a.user_id = auth.uid();
$$;

revoke all on function public.get_own_avaliacao() from public, anon;
grant execute on function public.get_own_avaliacao() to authenticated;

-- Admin: lista (com e-mail) e oculta/exibe avaliações
create or replace function public.admin_list_avaliacoes()
returns setof public.avaliacoes
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso restrito a administradores' using errcode = '42501';
  end if;
  return query select a.* from public.avaliacoes a order by a.created_at desc;
end;
$$;

create or replace function public.admin_set_avaliacao_visivel(target uuid, value boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso restrito a administradores' using errcode = '42501';
  end if;
  update public.avaliacoes set visivel = value where id = target;
end;
$$;

revoke all on function
  public.admin_list_avaliacoes(),
  public.admin_set_avaliacao_visivel(uuid, boolean)
from public, anon;
grant execute on function
  public.admin_list_avaliacoes(),
  public.admin_set_avaliacao_visivel(uuid, boolean)
to authenticated;

-- ===========================================================================
-- Avaliações de itens (feitas pelo locatário depois de devolver o item)
-- product_slug é texto porque o catálogo de demonstração não está no banco;
-- booking_id é o id da reserva (guardada no navegador), uma avaliação por reserva.
-- ===========================================================================

create table if not exists public.avaliacoes_produto (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_slug text not null,
  booking_id text not null,
  nome text not null check (char_length(btrim(nome)) between 2 and 80),
  nota smallint not null check (nota between 1 and 5),
  comentario text not null check (char_length(btrim(comentario)) >= 10),
  visivel boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, booking_id)
);

comment on table public.avaliacoes_produto is 'Avaliação de um item por quem o alugou e devolveu. Uma por reserva.';
comment on column public.avaliacoes_produto.visivel is 'Moderação: admin pode ocultar a avaliação.';

create index if not exists avaliacoes_produto_slug_idx
  on public.avaliacoes_produto (product_slug, created_at desc);

alter table public.avaliacoes_produto enable row level security;

drop policy if exists "Avaliações de itens visíveis" on public.avaliacoes_produto;
create policy "Avaliações de itens visíveis"
  on public.avaliacoes_produto for select
  using (visivel or auth.uid() = user_id);

drop policy if exists "Locatário cria avaliação do item" on public.avaliacoes_produto;
create policy "Locatário cria avaliação do item"
  on public.avaliacoes_produto for insert
  to authenticated
  with check (auth.uid() = user_id and visivel);

drop policy if exists "Autor atualiza avaliação do item" on public.avaliacoes_produto;
create policy "Autor atualiza avaliação do item"
  on public.avaliacoes_produto for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and visivel);

drop policy if exists "Autor remove avaliação do item" on public.avaliacoes_produto;
create policy "Autor remove avaliação do item"
  on public.avaliacoes_produto for delete
  to authenticated
  using (auth.uid() = user_id);

revoke all on table public.avaliacoes_produto from anon, authenticated;
grant select on table public.avaliacoes_produto to anon, authenticated;
grant insert (user_id, product_slug, booking_id, nome, nota, comentario)
  on public.avaliacoes_produto to authenticated;
grant update (nome, nota, comentario)
  on public.avaliacoes_produto to authenticated;
grant delete on table public.avaliacoes_produto to authenticated;

drop trigger if exists avaliacoes_produto_updated_at on public.avaliacoes_produto;
create trigger avaliacoes_produto_updated_at
  before update on public.avaliacoes_produto
  for each row execute function public.set_updated_at();

-- Média e total por item (só avaliações visíveis), para cards e filtros.
create or replace function public.produto_avaliacoes_resumo()
returns table (product_slug text, media numeric, total bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select a.product_slug, round(avg(a.nota)::numeric, 1), count(*)
  from public.avaliacoes_produto a
  where a.visivel
  group by a.product_slug;
$$;

grant execute on function public.produto_avaliacoes_resumo() to anon, authenticated;

-- Admin: oculta/exibe avaliação de item
create or replace function public.admin_set_avaliacao_produto_visivel(target uuid, value boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso restrito a administradores' using errcode = '42501';
  end if;
  update public.avaliacoes_produto set visivel = value where id = target;
end;
$$;

revoke all on function public.admin_set_avaliacao_produto_visivel(uuid, boolean) from public, anon;
grant execute on function public.admin_set_avaliacao_produto_visivel(uuid, boolean) to authenticated;

-- Admin: promove/rebaixa outros administradores (não permite mexer em si mesmo)
create or replace function public.admin_set_admin(target uuid, value boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso restrito a administradores' using errcode = '42501';
  end if;
  if target = auth.uid() then
    raise exception 'Você não pode alterar o seu próprio papel de administrador' using errcode = '42501';
  end if;
  update public.profiles set is_admin = value where id = target;
end;
$$;

revoke all on function public.admin_set_admin(uuid, boolean) from public, anon;
grant execute on function public.admin_set_admin(uuid, boolean) to authenticated;

-- ===========================================================================
-- Chat real entre locatário e locador (um chat por anúncio + locatário)
-- ===========================================================================

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  product_slug text not null,
  product_title text not null,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  renter_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  unique (product_slug, renter_id),
  check (owner_id <> renter_id)
);

create index if not exists conversations_owner_idx on public.conversations (owner_id);
create index if not exists conversations_renter_idx on public.conversations (renter_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

drop policy if exists "Participantes veem a conversa" on public.conversations;
create policy "Participantes veem a conversa"
  on public.conversations for select
  using (auth.uid() = owner_id or auth.uid() = renter_id);

drop policy if exists "Locatário inicia conversa" on public.conversations;
create policy "Locatário inicia conversa"
  on public.conversations for insert
  with check (auth.uid() = renter_id and owner_id <> renter_id);

drop policy if exists "Participantes veem mensagens" on public.messages;
create policy "Participantes veem mensagens"
  on public.messages for select
  using (exists (
    select 1 from public.conversations c
    where c.id = conversation_id and (c.owner_id = auth.uid() or c.renter_id = auth.uid())
  ));

drop policy if exists "Participantes enviam mensagens" on public.messages;
create policy "Participantes enviam mensagens"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id and (c.owner_id = auth.uid() or c.renter_id = auth.uid())
    )
  );

-- Só quem recebeu pode marcar como lida
drop policy if exists "Destinatário marca como lida" on public.messages;
create policy "Destinatário marca como lida"
  on public.messages for update
  using (
    sender_id <> auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id and (c.owner_id = auth.uid() or c.renter_id = auth.uid())
    )
  );

grant select, insert on table public.conversations to authenticated;
grant select, insert, update on table public.messages to authenticated;

create or replace function public.messages_touch_conversation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation
  after insert on public.messages
  for each row execute function public.messages_touch_conversation();

-- Tempo real
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null;
end $$;

-- ===========================================================================
-- Reservas e notificações no banco (antes ficavam no localStorage de cada
-- navegador, então locador e locatário nunca viam a mesma reserva).
-- Toda mudança de status passa por funções security definer que validam
-- quem pode fazer o quê; o cliente não escreve direto nas tabelas.
-- ===========================================================================

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  title text not null,
  icon text,
  hue text,
  photo text,
  owner_id uuid references public.profiles(id) on delete set null,
  owner_name text not null,
  renter_id uuid not null references public.profiles(id) on delete cascade,
  renter_name text not null,
  start_date date not null,
  end_date date not null,
  days integer not null check (days >= 1),
  subtotal numeric(10, 2) not null,
  fee numeric(10, 2) not null,
  deposit numeric(10, 2) not null default 0,
  total numeric(10, 2) not null,
  status text not null default 'confirmada'
    check (status in ('pendente', 'confirmada', 'paga', 'em_andamento', 'concluida', 'recusada', 'cancelada')),
  payment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date > start_date)
);

comment on table public.bookings is 'Reservas entre locatário e locador. owner_id é nulo nos itens de demonstração.';

create index if not exists bookings_renter_idx on public.bookings (renter_id, created_at desc);
create index if not exists bookings_owner_idx on public.bookings (owner_id, created_at desc);
create index if not exists bookings_slug_idx on public.bookings (slug, start_date);

alter table public.bookings enable row level security;

drop policy if exists "Partes leem a reserva" on public.bookings;
create policy "Partes leem a reserva"
  on public.bookings for select
  to authenticated
  using (auth.uid() = renter_id or auth.uid() = owner_id);

revoke all on table public.bookings from anon, authenticated;
grant select on table public.bookings to authenticated;

drop trigger if exists bookings_updated_at on public.bookings;
create trigger bookings_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "Usuário lê as próprias notificações" on public.notifications;
create policy "Usuário lê as próprias notificações"
  on public.notifications for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Usuário atualiza as próprias notificações" on public.notifications;
create policy "Usuário atualiza as próprias notificações"
  on public.notifications for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Usuário apaga as próprias notificações" on public.notifications;
create policy "Usuário apaga as próprias notificações"
  on public.notifications for delete
  to authenticated
  using (auth.uid() = user_id);

revoke all on table public.notifications from anon, authenticated;
grant select, delete on table public.notifications to authenticated;
grant update (read) on table public.notifications to authenticated;

-- Datas ocupadas de um item (qualquer visitante pode consultar; sem dados pessoais).
create or replace function public.booking_blocked_ranges(p_slug text)
returns table (start_date date, end_date date)
language sql
stable
security definer
set search_path = ''
as $$
  select b.start_date, b.end_date
  from public.bookings b
  where b.slug = p_slug
    and b.status in ('pendente', 'confirmada', 'paga', 'em_andamento')
    and b.end_date >= current_date;
$$;

revoke all on function public.booking_blocked_ranges(text) from public;
grant execute on function public.booking_blocked_ranges(text) to anon, authenticated;

create or replace function public.create_booking(
  p_slug text,
  p_start date,
  p_end date,
  p_renter_name text,
  p_title text,
  p_icon text,
  p_hue text,
  p_photo text,
  p_owner_name text,
  p_price numeric,
  p_deposit numeric
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  prod record;
  v_owner uuid;
  v_title text := p_title;
  v_owner_name text := p_owner_name;
  v_price numeric := p_price;
  v_deposit numeric := coalesce(p_deposit, 0);
  v_days integer;
  v_subtotal numeric;
  v_fee numeric;
  result public.bookings;
begin
  if uid is null then
    raise exception 'Entre na sua conta para reservar.';
  end if;
  if p_start is null or p_end is null or p_end <= p_start then
    raise exception 'Período inválido.';
  end if;

  -- Anúncio real: preço, caução e dono vêm do banco, não do navegador.
  select p.owner_id, p.titulo, p.preco_dia, p.caucao, pr.nome as owner_nome
    into prod
  from public.products p
  join public.profiles pr on pr.id = p.owner_id
  where p.slug = p_slug and p.status = 'publicado';

  if found then
    v_owner := prod.owner_id;
    v_title := prod.titulo;
    v_price := prod.preco_dia;
    v_deposit := prod.caucao;
    v_owner_name := prod.owner_nome;
    if v_owner = uid then
      raise exception 'Você não pode reservar o seu próprio anúncio.';
    end if;
  end if;

  if v_price is null or v_price <= 0 then
    raise exception 'Preço inválido.';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_slug));

  if exists (
    select 1 from public.bookings b
    where b.slug = p_slug
      and b.status in ('pendente', 'confirmada', 'paga', 'em_andamento')
      and p_start < b.end_date and p_end > b.start_date
  ) then
    raise exception 'Este item já está reservado nesse período.';
  end if;

  v_days := p_end - p_start;
  v_subtotal := v_price * v_days;
  v_fee := round(v_subtotal * 0.10);

  insert into public.bookings (
    slug, title, icon, hue, photo, owner_id, owner_name, renter_id, renter_name,
    start_date, end_date, days, subtotal, fee, deposit, total, status
  ) values (
    p_slug, v_title, p_icon, p_hue, p_photo, v_owner, coalesce(v_owner_name, 'Locador'),
    uid, coalesce(nullif(btrim(p_renter_name), ''), 'Locatário'),
    p_start, p_end, v_days, v_subtotal, v_fee, v_deposit, v_subtotal + v_fee + v_deposit,
    'confirmada'
  ) returning * into result;

  if v_owner is not null then
    insert into public.notifications (user_id, title, message) values (
      v_owner, 'Nova reserva',
      result.renter_name || ' reservou "' || result.title || '" de ' ||
        to_char(p_start, 'DD/MM/YYYY') || ' a ' || to_char(p_end, 'DD/MM/YYYY') ||
        '. Aguardando o pagamento.'
    );
  end if;
  insert into public.notifications (user_id, title, message) values (
    uid, 'Reserva criada',
    'Faça o pagamento de "' || result.title || '" para garantir o item.'
  );

  return result;
end;
$$;

-- Muda o status de uma reserva se o usuário tiver o papel certo e o status atual permitir.
create or replace function public.booking_transition(
  p_id uuid,
  p_action text,
  p_payment text default null
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  b public.bookings;
  is_renter boolean;
  is_owner boolean;
begin
  if uid is null then
    raise exception 'Entre na sua conta.';
  end if;

  select * into b from public.bookings where id = p_id for update;
  if not found then
    raise exception 'Reserva não encontrada.';
  end if;

  is_renter := b.renter_id = uid;
  -- Item de demonstração não tem locador real: o locatário assume o papel dele.
  is_owner := b.owner_id = uid or (b.owner_id is null and is_renter);

  if p_action = 'pay' then
    if not is_renter or b.status <> 'confirmada' then
      raise exception 'Esta reserva não pode ser paga.';
    end if;
    update public.bookings set status = 'paga', payment = p_payment where id = p_id returning * into b;
    if b.owner_id is not null then
      insert into public.notifications (user_id, title, message) values (
        b.owner_id, 'Pagamento recebido',
        b.renter_name || ' pagou a reserva de "' || b.title || '". Combine a retirada e confirme em Reservas.'
      );
    end if;

  elsif p_action = 'cancel' then
    if not is_renter or b.status not in ('pendente', 'confirmada') then
      raise exception 'Esta reserva não pode ser cancelada.';
    end if;
    update public.bookings set status = 'cancelada' where id = p_id returning * into b;
    if b.owner_id is not null then
      insert into public.notifications (user_id, title, message) values (
        b.owner_id, 'Reserva cancelada',
        b.renter_name || ' cancelou a reserva de "' || b.title || '".'
      );
    end if;

  elsif p_action = 'pickup' then
    if not is_owner or b.status <> 'paga' then
      raise exception 'Só o locador pode confirmar a retirada de uma reserva paga.';
    end if;
    update public.bookings set status = 'em_andamento' where id = p_id returning * into b;
    insert into public.notifications (user_id, title, message) values (
      b.renter_id, 'Retirada confirmada',
      '"' || b.title || '" está com você até ' || to_char(b.end_date, 'DD/MM/YYYY') ||
        '. Ao devolver, clique em "Item devolvido".'
    );

  elsif p_action = 'return' then
    if not is_renter or b.status <> 'em_andamento' then
      raise exception 'Esta reserva não está em andamento.';
    end if;
    update public.bookings set status = 'concluida' where id = p_id returning * into b;
    insert into public.notifications (user_id, title, message) values (
      b.renter_id, 'Reserva concluída',
      'A devolução de "' || b.title || '" foi registrada. Avalie o item em Reservas.'
    );
    if b.owner_id is not null then
      insert into public.notifications (user_id, title, message) values (
        b.owner_id, 'Item devolvido',
        b.renter_name || ' devolveu "' || b.title || '". Reserva concluída.'
      );
    end if;

  else
    raise exception 'Ação inválida.';
  end if;

  return b;
end;
$$;

revoke all on function public.create_booking(text, date, date, text, text, text, text, text, text, numeric, numeric) from public, anon;
grant execute on function public.create_booking(text, date, date, text, text, text, text, text, text, numeric, numeric) to authenticated;
revoke all on function public.booking_transition(uuid, text, text) from public, anon;
grant execute on function public.booking_transition(uuid, text, text) to authenticated;

-- Tempo real: o locador vê o pagamento e o locatário vê a retirada na hora.
do $$
begin
  alter publication supabase_realtime add table public.bookings;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null;
end $$;

notify pgrst, 'reload schema';
