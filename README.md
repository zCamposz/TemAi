# Tem Aí? — Protótipo estático

Protótipo navegável do **Tem Aí?**, uma plataforma de marketplace baseada nos princípios da **economia circular e colaborativa** para aluguel sob demanda de bens de uso esporádico (ferramentas elétricas, maquinário para eventos etc.). O projeto atua diretamente no **ODS 12 — Consumo e Produção Responsáveis** (Agenda 2030, ONU).

Este site corresponde à fase de **Prototipagem** do ciclo de vida do projeto: todas as telas das funcionalidades planejadas podem ser navegadas e validadas com usuários e stakeholders antes do desenvolvimento.

## Como visualizar

Não há dependências nem etapa de build — é HTML, CSS e JavaScript puros.

- **Opção 1:** abra o arquivo `index.html` diretamente no navegador.
- **Opção 2 (recomendada):** sirva a pasta com um servidor local:

```bash
# com Python instalado
python3 -m http.server 8080
# depois acesse http://localhost:8080
```

O site também pode ser hospedado como está em qualquer serviço de páginas estáticas (GitHub Pages, Netlify, Vercel etc.).

## Estrutura

```
temai/
├── index.html       # Página inicial (hero, categorias, destaques, ODS 12, FAQ)
├── explorar.html    # Busca e listagem de itens com filtros e teaser do mapa
├── produto.html     # Detalhe do item com painel de reserva e avaliações
├── login.html       # Tela de login
├── cadastro.html    # Tela de criação de conta
├── anunciar.html    # Formulário de cadastro de item + simulador de ganhos
├── sobre.html       # Visão do projeto, metodologia, ODS 12 e equipe
├── css/
│   └── styles.css   # Design system e estilos de todas as páginas
└── js/
    └── main.js      # Interações (menu, cálculo de reserva, toasts etc.)
```

## Telas × roadmap incremental

Cada tela do protótipo antecipa um incremento do desenvolvimento:

| Incremento | Funcionalidade | Telas do protótipo |
| --- | --- | --- |
| 1 | Autenticação e perfis de usuário | `login.html`, `cadastro.html` |
| 2 | Cadastro de produtos com especificações detalhadas | `anunciar.html` |
| 3 | Pesquisa otimizada com filtragem por geolocalização | `explorar.html` |
| 4 | Processo end-to-end de reserva e transação | `produto.html` (painel de reserva) |

As ações que dependem de backend (login, publicar anúncio, solicitar reserva etc.) exibem um aviso indicando em qual incremento a funcionalidade real será entregue.

## Equipe

| Integrante | RA |
| --- | --- |
| Lucas Pinheiro Marques | 8222242608 |
| Leonardo Del Carlo | 823157802 |
| Pedro Henrique Pontes | 823135028 |
| Gabriel Campos Batista de Souza | 823125083 |
