# Tem Aí? — Protótipo (React + Vite)

Protótipo navegável do **Tem Aí?**, uma plataforma de marketplace baseada nos princípios da **economia circular e colaborativa** para aluguel sob demanda de bens de uso esporádico (ferramentas elétricas, maquinário para eventos etc.). O projeto atua diretamente no **ODS 12 — Consumo e Produção Responsáveis** (Agenda 2030, ONU).

Este site corresponde à fase de **Prototipagem** do ciclo de vida do projeto: todas as telas das funcionalidades planejadas podem ser navegadas e validadas com usuários e stakeholders antes do desenvolvimento.

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
    ├── data/
    │   └── catalog.js      # Produtos, categorias, avaliações e equipe
    ├── components/
    │   ├── Layout.jsx      # Aviso de protótipo + cabeçalho + rodapé
    │   ├── Header.jsx      # Navegação principal e menu mobile
    │   ├── Footer.jsx
    │   ├── AuthLayout.jsx  # Estrutura das telas de login e cadastro
    │   ├── ProductCard.jsx # Card de item reutilizado em 3 telas
    │   ├── SearchBar.jsx   # Campo de busca que leva para /explorar
    │   ├── Icon.jsx        # Biblioteca de ícones SVG
    │   └── ToastProvider.jsx
    └── pages/
        ├── Home.jsx        # Hero, categorias, destaques, ODS 12 e FAQ
        ├── Explore.jsx     # Busca com filtros funcionais e paginação
        ├── Product.jsx     # Detalhe do item com cálculo de reserva
        ├── Login.jsx
        ├── Register.jsx
        ├── Announce.jsx    # Cadastro de item + simulador de ganhos
        └── About.jsx       # Projeto, metodologia, ODS 12 e equipe
```

## Telas × roadmap incremental

Cada tela do protótipo antecipa um incremento do desenvolvimento:

| Incremento | Funcionalidade | Rota |
| --- | --- | --- |
| 1 | Autenticação e perfis de usuário | `/login`, `/cadastro` |
| 2 | Cadastro de produtos com especificações detalhadas | `/anunciar` |
| 3 | Pesquisa otimizada com filtragem por geolocalização | `/explorar` |
| 4 | Processo end-to-end de reserva e transação | `/produto/:slug` |

As ações que dependem de backend (entrar, publicar anúncio, solicitar reserva) exibem um aviso indicando em qual incremento a funcionalidade real será entregue.

O que já funciona de verdade sobre os dados de demonstração em `src/data/catalog.js`:

- busca textual por nome e categoria, ignorando acentos;
- filtros combinados de categoria, distância, faixa de preço, avaliação, entrega e locador verificado;
- ordenação por proximidade, preço, avaliação e número de aluguéis;
- paginação dos resultados;
- cálculo da reserva conforme as datas escolhidas (diárias, taxa de serviço e caução);
- simulador de renda extra na tela de anúncio.

## Publicar no GitHub Pages

```bash
npm run build
```

Suba o conteúdo da pasta `dist/` para a branch de publicação (ou configure o Pages para servir a partir dela). Como o `base` do Vite é relativo e o roteamento é por hash, o site funciona mesmo em subpastas como `usuario.github.io/TemAi/`.

## Equipe

| Integrante | RA |
| --- | --- |
| Lucas Pinheiro Marques | 8222242608 |
| Leonardo Del Carlo | 823157802 |
| Pedro Henrique Pontes | 823135028 |
| Gabriel Campos Batista de Souza | 823125083 |
