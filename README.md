# Tem Aí? — Marketplace de aluguel (React + Vite)

Plataforma de marketplace baseada nos princípios da **economia circular e colaborativa** para aluguel sob demanda de bens de uso esporádico (ferramentas elétricas, maquinário para eventos etc.). O projeto atua diretamente no **ODS 12 — Consumo e Produção Responsáveis** (Agenda 2030, ONU).

O projeto segue entrega **incremental**. A fase de **Prototipagem** e os **Incrementos 1, 2 e 3** (autenticação, anúncios e busca por geolocalização) estão concluídos. **Próxima fase: Incremento 4** — reserva e transação.

## Como rodar

Requer [Node.js](https://nodejs.org) 18 ou superior.

```bash
npm install     # instala as dependências (só na primeira vez)
npm run dev     # sobe o servidor de desenvolvimento em http://localhost:5173
```

Outros comandos disponíveis:

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento com recarga automática |
| `npm run build` | Gera a versão de produção na pasta `dist/` |
| `npm run preview` | Serve localmente o conteúdo já compilado em `dist/` |
| `npm run lint` | Verifica o código com ESLint |

## Stack

- **React 18** para a interface em componentes
- **React Router** (modo hash) para a navegação entre telas
- **Vite** como servidor de desenvolvimento e empacotador
- **CSS puro** com variáveis, sem framework de estilo
- **Supabase** (Incremento 1+) — autenticação, banco PostgreSQL, PostGIS, perfis, anúncios e Storage de fotos
- **Leaflet** + mapa de ruas da Esri (dados OpenStreetMap) em `/explorar`

O roteamento usa `HashRouter` de propósito: as URLs ficam no formato `/#/explorar`, o que permite publicar o site em qualquer hospedagem estática (GitHub Pages incluso) sem precisar configurar redirecionamentos no servidor.

## Estrutura

```
temai/
├── index.html              # Ponto de entrada do Vite
├── vite.config.js
├── eslint.config.js
└── src/
    ├── main.jsx            # Monta a aplicação
    ├── App.jsx             # Rotas e controle de rolagem
    ├── styles.css          # Design system e estilos de todas as telas
    ├── lib/
    │   ├── supabase.js     # Cliente Supabase compartilhado
    │   ├── authErrors.js   # Mensagens de erro e iniciais
    │   ├── geo.js          # CEP, lugar, GPS e distância
    │   └── products.js     # Anúncios: fetch, upload de fotos e insert
    ├── data/
    │   └── catalog.js      # Catálogo de demonstração, categorias e equipe
    ├── components/
    │   ├── Layout.jsx      # Aviso de protótipo + cabeçalho + rodapé
    │   ├── Header.jsx      # Navegação principal e menu mobile
    │   ├── Footer.jsx
    │   ├── AuthProvider.jsx  # Sessão e autenticação Supabase
    │   ├── ProtectedRoute.jsx # Exige login em /perfil e /anunciar
    │   ├── AuthLayout.jsx  # Estrutura das telas de login e cadastro
    │   ├── ProductCard.jsx # Card de item reutilizado em 3 telas
    │   ├── SearchBar.jsx   # Campo de busca que leva para /explorar
    │   ├── ResultsMap.jsx  # Mapa Leaflet dos resultados
    │   ├── Icon.jsx        # Biblioteca de ícones SVG
    │   └── ToastProvider.jsx
    └── pages/
        ├── Home.jsx        # Hero, categorias, destaques, ODS 12 e FAQ
        ├── Explore.jsx     # Busca por raio, filtros combinados, mapa e paginação
        ├── Product.jsx     # Detalhe do item com cálculo de reserva
        ├── Login.jsx
        ├── Register.jsx
        ├── Profile.jsx     # Perfil + lista dos anúncios do usuário
        ├── Announce.jsx    # Publicação real de anúncios (Incremento 2)
        └── About.jsx       # Projeto, metodologia, ODS 12 e equipe
```

## Telas × roadmap incremental

Cada tela do protótipo antecipa um incremento do desenvolvimento:

| Incremento | Funcionalidade | Rota | Status |
| --- | --- | --- | --- |
| 1 | Autenticação e perfis de usuário | `/login`, `/cadastro`, `/perfil` | Concluído |
| 2 | Cadastro de produtos com especificações detalhadas | `/anunciar` | Concluído |
| 3 | Pesquisa otimizada com filtragem por geolocalização | `/explorar` | Concluído |
| 4 | Processo end-to-end de reserva e transação | `/produto/:slug` | Planejado |

**Incremento 1 (concluído):** cadastro, login, logout, sessão persistente, perfil editável e rotas protegidas.

**Incremento 2 (concluído):** publicação real de anúncios com fotos, especificações, preço, caução e condições de entrega no Supabase. Os anúncios publicados aparecem em `/explorar`, `/` e `/produto/:slug`.

**Incremento 3 (concluído):** origem da busca (GPS, CEP ou bairro), raio em km, distância real até o anúncio, mapa de resultados e filtros combinados. O pin público usa o CEP (não o endereço da casa); clicar na bolinha abre o produto. Anúncios no mesmo ponto aparecem espalhados para não se sobrepor.

As ações do incremento ainda não entregue (reserva) exibem um aviso indicando em qual etapa a funcionalidade será implementada.

O que já funciona de verdade:

- autenticação e perfis de usuário (Supabase);
- cadastro de produtos com fotos e especificações detalhadas;
- geocodificação do CEP na publicação do anúncio (`lat` / `lng`);
- busca textual por nome e categoria, ignorando acentos (anúncios reais + demonstração em `src/data/catalog.js`);
- origem da busca por geolocalização do navegador, bairro/cidade ou CEP;
- filtros combinados de categoria, **raio em km**, faixa de preço, avaliação, entrega e locador verificado;
- mapa dos resultados (Leaflet + Esri) com a origem, os anúncios no raio e clique no pin para abrir o produto;
- ordenação por proximidade, preço, avaliação e número de aluguéis;
- paginação dos resultados;
- cálculo da reserva conforme as datas escolhidas (diárias, taxa de serviço e caução);
- simulador de renda extra na tela de anúncio.

## Publicar no GitHub Pages

```bash
npm run build
```

Suba o conteúdo da pasta `dist/` para a branch de publicação (ou configure o Pages para servir a partir dela). Como o `base` do Vite é relativo e o roteamento é por hash, o site funciona mesmo em subpastas como `usuario.github.io/TemAi/`.

## Incremento 1 — Supabase (concluído)

O Incremento 1 usa [Supabase](https://supabase.com) (plano gratuito) para autenticação e perfis. Siga os passos abaixo **uma vez** por ambiente (dev/produção) para configurar um clone do projeto.

### 1. Criar projeto no Supabase

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard) e crie uma conta (ou entre).
2. **New project** → escolha um nome (ex.: `temai`), senha do banco e região (ex.: South America).
3. Aguarde o projeto ficar pronto (~2 min).

### 2. Criar tabelas (schema)

1. No dashboard: **SQL Editor** → **New query**.
2. Copie e execute o conteúdo de [`supabase/schema.sql`](supabase/schema.sql). O script é idempotente: pode rodar de novo (Incremento 3 acrescenta colunas de geolocalização em `products`, sem recriar a tabela).
3. Confira em **Table Editor** se `profiles` e `products` apareceram (com `lat` / `lng` / `location`), e em **Storage** se o bucket `product-photos` foi criado.

### 3. Configurar variáveis de ambiente

1. No dashboard: **Project Settings** → **API**.
2. Copie **Project URL** e a chave **anon public**.
3. Na raiz do projeto:

```bash
cp .env.example .env
```

4. Edite `.env` e preencha:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
```

5. Reinicie o servidor de desenvolvimento (`npm run dev`) após salvar o `.env`.

> **Importante:** nunca commite o arquivo `.env`. A chave `anon` é pública no frontend, mas o `.env` evita expor credenciais do time no repositório.

### 4. Auth no Supabase (recomendado para dev)

Em **Authentication** → **Providers** → **Email**:

- Mantenha **Email** habilitado.
- Para testes locais sem confirmar e-mail: desative **Confirm email** (reative em produção).

Para **Google** (opcional, stretch do Incremento 1):

- Habilite o provider Google em **Authentication** → **Providers**.
- Configure OAuth no Google Cloud Console com a URL de callback indicada pelo Supabase.

### 5. Deploy (GitHub Pages / Vite)

Defina as mesmas variáveis `VITE_SUPABASE_*` no ambiente de build (Secrets do GitHub Actions ou painel da hospedagem). O Vite embute esses valores no bundle em tempo de compilação.

### Estrutura Supabase no repositório

| Arquivo | Função |
| --- | --- |
| `src/lib/supabase.js` | Cliente Supabase compartilhado |
| `.env.example` | Modelo das variáveis de ambiente |
| `supabase/schema.sql` | Schema de `profiles` e `products` + Storage + RLS + PostGIS + triggers |
| `src/lib/products.js` | Leitura, upload de fotos e publicação de anúncios |
| `src/lib/geo.js` | Geocodificação de CEP/lugar, GPS e cálculo de distância |

### Modelo de dados (Incremento 1)

| Campo | Origem | Uso |
| --- | --- | --- |
| `auth.users` | Supabase Auth | E-mail, senha, sessão |
| `profiles.nome` | Cadastro (`/cadastro`) | Nome exibido no header e cards |
| `profiles.telefone` | Cadastro | Contato para retirada/devolução |
| `profiles.avatar_url` | Perfil (futuro) | Foto do usuário |
| `profiles.verificado` | Admin/futuro fluxo | Badge “locador verificado” em `/explorar` |

### Modelo de dados (Incremento 2)

| Campo | Origem | Uso |
| --- | --- | --- |
| `products.titulo` | `/anunciar` | Nome do anúncio e busca |
| `products.categoria` / `estado` | Formulário | Filtros e especificações |
| `products.marca` / `modelo` / `voltagem` | Formulário | Especificações técnicas |
| `products.preco_dia` / `caucao` | Formulário | Preço do card e cálculo da reserva |
| `products.fotos` | Storage `product-photos` | Capa e galeria |
| `products.bairro` / `cidade` / `cep` | Formulário | Localização pública (bairro) |
| `products.status` | Publicar ou rascunho | Só `publicado` aparece na busca |

### Modelo de dados (Incremento 3)

| Campo | Origem | Uso |
| --- | --- | --- |
| `products.lat` / `lng` | Geocodificação do CEP em `/anunciar` | Distância e pin no mapa |
| `products.location` | Trigger PostGIS a partir de lat/lng | `ST_DWithin` na função `search_products_near` |

Depois de puxar este código, rode de novo o [`supabase/schema.sql`](supabase/schema.sql) no SQL Editor (é idempotente). Sem as colunas `lat`/`lng`, a publicação do anúncio ainda funciona, mas a busca por raio usa só o catálogo de demonstração.

Anúncios publicados **antes** do Incremento 3 não têm coordenadas. Edite e salve de novo (com CEP) para entrar no mapa.

## Equipe

| Integrante | RA |
| --- | --- |
| Lucas Pinheiro Marques | 8222242608 |
| Leonardo Del Carlo | 823157802 |
| Pedro Henrique Pontes | 823135028 |
| Gabriel Campos Batista de Souza | 823125083 |
