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

notify pgrst, 'reload schema';
