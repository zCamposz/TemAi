# Tem Aí? — Marketplace de aluguel (React + Vite)

Plataforma de marketplace baseada nos princípios da **economia circular e colaborativa** para aluguel sob demanda de bens de uso esporádico (ferramentas elétricas, maquinário para eventos etc.). O projeto atua diretamente no **ODS 12 — Consumo e Produção Responsáveis** (Agenda 2030, ONU).

O projeto segue entrega **incremental**. A fase de **Prototipagem** e os **Incrementos 1, 2, 3 e 4** (autenticação, anúncios, busca por geolocalização, reserva e transação) estão concluídos, além de **ecopontos** de São Paulo, **avaliações** (da plataforma e dos itens), **notificações no aplicativo** e **painel administrativo**. Reservas e notificações são **simuladas** no navegador (`localStorage`). Pendentes: persistir reservas no banco, pagamento e e-mail/SMS reais e medir a meta de 3 s na busca (veja [`docs/rascunhos.md`](docs/rascunhos.md)).

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

O roteamento usa `HashRouter` de propósito: as URLs ficam no formato `/#/explorar`, o que permite publicar o site em qualquer hospedagem estática (Vercel incluso) sem precisar configurar redirecionamentos no servidor.

## Estrutura

```
temai/
├── index.html              # Ponto de entrada do Vite
├── vite.config.js
├── eslint.config.js
├── docs/rascunhos.md       # Itens ainda pendentes
├── openspec/               # Propostas e specs (OpenSpec)
├── supabase/schema.sql     # Schema, RLS, funções e Storage
└── src/
    ├── main.jsx            # Monta a aplicação
    ├── App.jsx             # Rotas e controle de rolagem
    ├── styles.css          # Design system e estilos de todas as telas
    ├── lib/
    │   ├── supabase.js     # Cliente Supabase compartilhado
    │   ├── authErrors.js   # Mensagens de erro e iniciais
    │   ├── geo.js          # CEP, lugar, GPS e distância
    │   ├── products.js     # Anúncios: fetch, upload de fotos e insert
    │   ├── bookings.js     # Reservas simuladas (localStorage): período, conflito, valores e status
    │   ├── notifications.js # Notificações no app (localStorage); e-mail/SMS só no console
    │   ├── avaliacoes.js   # Avaliações da plataforma (depoimentos da home)
    │   ├── avaliacoesProduto.js # Avaliações de itens, feitas após a devolução
    │   └── admin.js        # RPCs do painel administrativo
    ├── data/
    │   ├── catalog.js      # Catálogo de demonstração, categorias e equipe
    │   └── ecopontos.json  # Ecopontos de São Paulo (endereço, horário, materiais)
    ├── components/
    │   ├── Layout.jsx      # Aviso de protótipo + cabeçalho + rodapé
    │   ├── Header.jsx      # Navegação principal e menu mobile
    │   ├── Footer.jsx
    │   ├── AuthProvider.jsx  # Sessão e autenticação Supabase
    │   ├── ProtectedRoute.jsx # Exige login em /perfil, /anunciar, /reservas, /checkout e /avaliar
    │   ├── AdminRoute.jsx  # Exige profiles.is_admin em /admin
    │   ├── NotificationBell.jsx # Sino de notificações no cabeçalho
    │   ├── Testimonials.jsx # Depoimentos e formulário de avaliação da plataforma
    │   ├── AuthLayout.jsx  # Estrutura das telas de login e cadastro
    │   ├── ProductCard.jsx # Card de item reutilizado em 3 telas
    │   ├── SearchBar.jsx   # Campo de busca que leva para /explorar
    │   ├── ResultsMap.jsx  # Mapa Leaflet dos resultados
    │   ├── EcopontosMap.jsx # Mapa dos ecopontos
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
        ├── Bookings.jsx    # Minhas reservas e solicitações (Incremento 4)
        ├── Checkout.jsx    # Pagamento simulado (Pix/cartão) da reserva
        ├── ReviewItem.jsx  # Avaliação do item após a devolução
        ├── Admin.jsx       # Painel administrativo (só admins)
        ├── Ecopontos.jsx   # Ecopontos de SP com busca, mapa e proximidade
        └── About.jsx       # Projeto, metodologia, ODS 12 e equipe
```

## Telas × roadmap incremental

Cada tela do protótipo antecipa um incremento do desenvolvimento:

| Incremento | Funcionalidade | Rota | Status |
| --- | --- | --- | --- |
| 1 | Autenticação e perfis de usuário | `/login`, `/cadastro`, `/perfil` | Concluído |
| 2 | Cadastro de produtos com especificações detalhadas | `/anunciar` | Concluído |
| 3 | Pesquisa otimizada com filtragem por geolocalização | `/explorar` | Concluído |
| 4 | Processo end-to-end de reserva e transação | `/produto/:slug`, `/reservas`, `/checkout/:id`, `/avaliar/:id` | Concluído (simulado) |
| — | Ecopontos de São Paulo | `/ecopontos` | Concluído |
| — | Painel administrativo | `/admin` | Concluído |

**Incremento 1 (concluído):** cadastro, login, logout, sessão persistente, perfil editável e rotas protegidas.

**Incremento 2 (concluído):** publicação real de anúncios com fotos, especificações, preço, caução e condições de entrega no Supabase. Os anúncios publicados aparecem em `/explorar`, `/` e `/produto/:slug`.

**Incremento 4 (concluído):** solicitação de reserva com bloqueio de datas conflitantes, confirmação/recusa pelo locador, pagamento (Pix/cartão), confirmação de retirada e devolução. Para a apresentação, as reservas ficam no `localStorage` do navegador (sem banco nem cobrança reais); em `/reservas` há botões "Simular" para fazer o papel do locador de itens do catálogo e um botão para reiniciar a demonstração. Depois da devolução, o locatário avalia o item em `/avaliar/:id` (uma avaliação por reserva, gravada no Supabase). Os eventos da reserva geram **notificações no aplicativo** (sino no cabeçalho, também em `localStorage`; para ver o aviso chegar, entre com a outra conta no mesmo navegador). O envio por e-mail/SMS é só simulado no console.

**Incremento 3 (concluído):** origem da busca (GPS, CEP ou bairro), raio em km, distância real até o anúncio, mapa de resultados e filtros combinados. O pin público usa o CEP (não o endereço da casa); clicar na bolinha abre o produto. Anúncios no mesmo ponto aparecem espalhados para não se sobrepor.

O que já funciona de verdade:

- autenticação e perfis de usuário (Supabase);
- cadastro de produtos com fotos e especificações detalhadas;
- geocodificação do CEP na publicação do anúncio (`lat` / `lng`);
- busca textual por nome e categoria, ignorando acentos (anúncios reais + demonstração em `src/data/catalog.js`);
- origem da busca por geolocalização do navegador, bairro/cidade ou CEP;
- endereço do perfil (CEP, logradouro, número, bairro e cidade) como origem padrão de itens e ecopontos para quem está logado;
- filtros combinados de categoria, **raio em km**, faixa de preço, avaliação, entrega e locador verificado;
- mapa dos resultados (Leaflet + Esri) com a origem, os anúncios no raio e clique no pin para abrir o produto;
- ordenação por proximidade, preço, avaliação e número de aluguéis;
- paginação dos resultados;
- cálculo da reserva conforme as datas escolhidas (diárias, taxa de serviço de 10% e caução);
- solicitação de reserva sem datas conflitantes e confirmação/recusa pelo locador;
- painel administrativo em `/admin` (só `profiles.is_admin`): verificar locadores e suspender/reativar anúncios. Para criar o primeiro admin, rode o `update` comentado no fim de `supabase/schema.sql`;
- ecopontos de São Paulo com busca textual, mapa e ordenação por proximidade;
- endereço exato do locador nunca público (só bairro e distância aproximada);
- avaliações da plataforma na home (uma por usuário logado) e avaliações de itens após a devolução, com nota média nos cards; admins podem ocultá-las;
- notificações no aplicativo para eventos de reserva (simuladas);
- simulador de renda extra na tela de anúncio.

## Requisitos

| Requisito | Status |
| --- | --- |
| Sistema de autenticação com cadastro e login | Validado |
| Cadastro de produtos com especificações detalhadas | Validado |
| Pesquisa otimizada com filtragem por geolocalização | Validado |
| Processo end-to-end de reserva e transação | Validado (simulado no navegador) |
| Integração com banco de dados | Validado |
| APIs de geolocalização e mapas | Validado |
| Interface responsiva | Validado |
| Notificações (e-mail, no aplicativo ou SMS) | Validado (no aplicativo, simuladas) |
| Sistema de avaliações e reputação | Validado |
| Painel administrativo | Validado |
| Exibir um mapa com a origem da busca e os anúncios do raio, abrindo o produto ao clicar no pin | Validado |
| Exibir a página do produto e simular o valor por período (diárias, taxa de serviço de 10% e caução) | Validado |
| Permitir que o locatário autenticado solicite a reserva de um item para um período, sem datas conflitantes | Validado |
| Permitir que o locador confirme ou recuse solicitações de reserva | Validado |
| Autenticar os usuários com senha de no mínimo 8 caracteres | Validado |
| Garantir que cada usuário altere apenas o próprio perfil, anúncios e fotos | Validado |
| Não exibir publicamente o endereço exato do locador, somente bairro e distância aproximada | Validado |
| Interface responsiva e utilizável em celulares, tablets e computadores | Validado |
| Apresentar os resultados da busca por proximidade em até 3 segundos em condições normais de uso | Pendente (não medido) |
| Continuar permitindo anunciar e buscar caso um serviço externo de CEP ou geocodificação esteja indisponível | Validado |
| Código modular e verificação de lint sem erros | Validado |
| Credenciais do banco de dados fora do repositório | Validado |
| Informar o endereço residencial (CEP, logradouro, número, bairro e cidade) no cadastro e no perfil, usando-o como origem padrão das buscas | Validado |
| Exibir os ecopontos de São Paulo com endereço, horário e materiais aceitos, com busca textual, mapa e ordenação por proximidade | Validado |
| Permitir que apenas o dono leia logradouro, número, CEP e coordenadas do próprio perfil | Validado |

## Publicar na Vercel

1. Importe o repositório em [vercel.com/new](https://vercel.com/new); o framework Vite é detectado automaticamente.
2. Confirme: **Build Command** `npm run build` e **Output Directory** `dist`.
3. Defina as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` em **Settings** → **Environment Variables**.
4. Cada push na branch principal gera um novo deploy. Também é possível publicar pela CLI com `npx vercel --prod`.

Como o roteamento é por hash (`/#/explorar`), não é preciso configurar redirecionamentos.

## Incremento 1 — Supabase (concluído)

O Incremento 1 usa [Supabase](https://supabase.com) (plano gratuito) para autenticação e perfis. Siga os passos abaixo **uma vez** por ambiente (dev/produção) para configurar um clone do projeto.

### 1. Criar projeto no Supabase

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard) e crie uma conta (ou entre).
2. **New project** → escolha um nome (ex.: `temai`), senha do banco e região (ex.: South America).
3. Aguarde o projeto ficar pronto (~2 min).

### 2. Criar tabelas (schema)

1. No dashboard: **SQL Editor** → **New query**.
2. Copie e execute o conteúdo de [`supabase/schema.sql`](supabase/schema.sql). O script é idempotente: pode rodar de novo (acrescenta colunas de geolocalização em `products`, o endereço em `profiles` e as tabelas de avaliações, sem recriar as tabelas existentes).
3. Confira em **Table Editor** se `profiles`, `products`, `avaliacoes` e `avaliacoes_produto` apareceram (`products` com `lat` / `lng`), e em **Storage** se o bucket `product-photos` foi criado.

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

### 5. Deploy (Vercel / Vite)

Defina as mesmas variáveis `VITE_SUPABASE_*` no ambiente de build (**Environment Variables** do projeto na Vercel). O Vite embute esses valores no bundle em tempo de compilação.

### Estrutura Supabase no repositório

| Arquivo | Função |
| --- | --- |
| `src/lib/supabase.js` | Cliente Supabase compartilhado |
| `.env.example` | Modelo das variáveis de ambiente |
| `supabase/schema.sql` | Schema de `profiles`, `products`, `avaliacoes` e `avaliacoes_produto` + Storage + RLS + PostGIS + triggers + funções de admin |
| `src/lib/products.js` | Leitura, upload de fotos e publicação de anúncios |
| `src/lib/geo.js` | Geocodificação de CEP/lugar, GPS e cálculo de distância |
| `src/lib/avaliacoes.js`, `src/lib/avaliacoesProduto.js` | Leitura e gravação das avaliações |
| `src/lib/admin.js` | Chamadas às funções `admin_*` (painel `/admin`) |

### Modelo de dados (Incremento 1)

| Campo | Origem | Uso |
| --- | --- | --- |
| `auth.users` | Supabase Auth | E-mail, senha, sessão |
| `profiles.nome` | Cadastro (`/cadastro`) | Nome exibido no header e cards |
| `profiles.telefone` | Cadastro | Contato para retirada/devolução |
| `profiles.avatar_url` | Perfil (futuro) | Foto do usuário |
| `profiles.verificado` | Admin/futuro fluxo | Badge “locador verificado” em `/explorar` |
| `profiles.cep` / `logradouro` / `numero` / `bairro` / `cidade` | Cadastro e `/perfil` | Endereço da casa. Só o dono lê (`get_own_profile`). Não aparece em anúncio, card, mapa nem na URL |
| `profiles.lat` / `lng` | Geocodificação do CEP do perfil | Origem padrão das recomendações de itens e ecopontos. Não são públicos |

Logradouro, número, CEP e coordenadas do perfil **não são públicos**. Visitantes e outros usuários autenticados continuam vendo nome, telefone, avatar e verificação. Quem não tem endereço no perfil segue com a origem de Vila Mariana nos itens e sem ordenação por proximidade nos ecopontos.

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

### Modelo de dados (avaliações e administração)

| Campo | Origem | Uso |
| --- | --- | --- |
| `profiles.is_admin` | Definido manualmente no SQL | Libera `/admin` e as funções `admin_*` |
| `avaliacoes` | Formulário da home | Depoimentos da plataforma. Uma por usuário; `email` é privado (só autor e admin leem) |
| `avaliacoes_produto` | `/avaliar/:id` | Nota e comentário de um item (`product_slug`) por reserva devolvida. Uma por `user_id` + `booking_id` |
| `avaliacoes*.visivel` | Moderação no `/admin` | Oculta a avaliação da exibição pública |

As reservas (`booking_id`) ficam no navegador, não no banco; por isso `avaliacoes_produto` guarda o id como texto.

## Equipe

| Integrante | RA |
| --- | --- |
| Lucas Pinheiro Marques | 8222242608 |
| Leonardo Del Carlo | 823157802 |
| Pedro Henrique Pontes da Silva| 823135028 |
| Gabriel Campos Batista de Souza | 823125083 |
