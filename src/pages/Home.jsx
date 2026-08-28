import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import SearchBar from "../components/SearchBar";
import ProductCard from "../components/ProductCard";
import Icon, { Stars } from "../components/Icon";
import { CATEGORIES, PRODUCTS } from "../data/catalog";

const STEPS = [
  {
    icon: "search",
    title: "Busque perto de você",
    text: "Pesquise o item e encontre opções por proximidade, com filtros de geolocalização, preço e avaliação.",
  },
  {
    icon: "calendar",
    title: "Reserve com segurança",
    text: "Escolha as datas, combine a retirada e pague pela plataforma, com o valor protegido até a entrega.",
  },
  {
    icon: "zap",
    title: "Use e resolva",
    text: "Faça o que precisa sem gastar com um item que ficaria parado depois — pague só pelos dias de uso.",
  },
  {
    icon: "recycle",
    title: "Devolva e avalie",
    text: "Entregue no prazo combinado e avalie a experiência. O item segue circulando na comunidade.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Precisei de uma betoneira por dois dias para a reforma do quintal. Comprar custaria mais de R$ 1.500 — aluguei a 4 km de casa por R$ 160 e devolvi sem dor de cabeça.",
    name: "Mariana S.",
    role: "Locatária · Vila Mariana",
    initials: "MS",
    avatar: "av-5",
  },
  {
    quote:
      "Minhas ferramentas ficavam paradas na garagem de segunda a segunda. Hoje elas pagam a conta de luz: são quase R$ 400 por mês em aluguéis para vizinhos.",
    name: "Carlos E.",
    role: "Locador · Ipiranga",
    initials: "CE",
    avatar: "av-3",
  },
  {
    quote:
      "Montei a festa da minha filha inteira pelo app: tenda, mesas, caixa de som e máquina de algodão-doce. Tudo no mesmo bairro, tudo pela metade do preço das locadoras.",
    name: "Juliana P.",
    role: "Locatária · Saúde",
    initials: "JP",
    avatar: "av-2",
  },
];

const FAQ = [
  {
    q: "E se o item for danificado durante o aluguel?",
    a: "O locador pode definir uma caução reembolsável, retida no momento da reserva e devolvida integralmente após a entrega do item em bom estado. Em caso de dano, o valor cobre o reparo conforme a política da plataforma.",
  },
  {
    q: "Como recebo pelos aluguéis dos meus itens?",
    a: "O locatário paga pela plataforma no momento da reserva. O valor fica protegido e é repassado ao locador após a confirmação da retirada do item, garantindo segurança para os dois lados.",
  },
  {
    q: "Quem cuida da retirada e da devolução?",
    a: "Locador e locatário combinam o formato pelo chat: retirada no local, ponto de encontro ou entrega (quando o locador oferece). Como a busca prioriza a proximidade, os deslocamentos tendem a ser curtos.",
  },
  {
    q: "Preciso pagar algo para anunciar?",
    a: "Não. Anunciar é gratuito — a plataforma retém apenas uma taxa de serviço sobre os aluguéis concluídos, usada para manter os pagamentos protegidos e o suporte à comunidade.",
  },
];

export default function Home() {
  const featured = PRODUCTS.filter((product) => product.featured);

  return (
    <Layout note="Incremento 1 concluído · Incremento 2 em andamento — cadastro de produtos com especificações detalhadas">
      {/* ============ HERO ============ */}
      <section className="hero">
        <div className="container">
          <div className="hero-grid">
            <div>
              <span className="pill fade-up">
                <Icon name="recycle" size="sm" />
                Economia circular · ODS 12
              </span>

              <h1 className="fade-up d1">
                Por que comprar, se você pode perguntar: <span className="hl">tem&nbsp;aí?</span>
              </h1>

              <p className="hero-sub fade-up d2">
                Alugue ferramentas, equipamentos para eventos e outros itens de uso esporádico de
                pessoas perto de você — e coloque o que está parado na sua casa para render.
              </p>

              <SearchBar
                large
                className="fade-up d3"
                queryPlaceholder="O que você precisa? Ex.: furadeira, tenda 3x3..."
              />

              <div className="hero-chips fade-up d4">
                <span>Mais buscados:</span>
                <Link className="chip" to="/explorar?q=furadeira">
                  Furadeira
                </Link>
                <Link className="chip" to="/explorar?q=tenda">
                  Tenda 3x3
                </Link>
                <Link className="chip" to="/explorar?q=projetor">
                  Projetor
                </Link>
                <Link className="chip" to="/explorar?q=caixa de som">
                  Caixa de som
                </Link>
              </div>

              <div className="hero-stats fade-up d4">
                <div className="hero-stat">
                  <strong>1.200+</strong>
                  <span>itens cadastrados</span>
                </div>
                <div className="hero-stat">
                  <strong>R$ 320</strong>
                  <span>economia média por mês</span>
                </div>
                <div className="hero-stat">
                  <strong>4,8 ★</strong>
                  <span>avaliação da comunidade</span>
                </div>
              </div>
            </div>

            <div className="hero-visual" aria-hidden="true">
              <div className="hero-blob" />

              <div className="float-card fc-item">
                <div className="fc-media">
                  <Icon name="tool" size="lg" />
                </div>
                <h4>Furadeira de impacto</h4>
                <div className="fc-meta">
                  <span>a 1,2 km de você</span>
                  <span className="price">
                    R$ 25<small>/dia</small>
                  </span>
                </div>
              </div>

              <div className="float-card fc-pin">
                <Icon name="pin" size="sm" />
                14 itens no seu bairro
              </div>

              <div className="float-card fc-notify">
                <div className="fc-check">
                  <Icon name="checkCircle" />
                </div>
                <div>
                  <strong>Reserva confirmada!</strong>
                  <span>Retirada sáb., 9h — Vila Mariana</span>
                </div>
              </div>
            </div>
          </div>

          <div className="trust-row">
            <span>
              <Icon name="shield" />
              Pagamento protegido pela plataforma
            </span>
            <span>
              <Icon name="users" />
              Perfis verificados e avaliados
            </span>
            <span>
              <Icon name="pin" />
              Busca por proximidade
            </span>
            <span>
              <Icon name="chat" />
              Suporte todos os dias
            </span>
          </div>
        </div>
      </section>

      {/* ============ CATEGORIAS ============ */}
      <section className="section-tight">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Categorias</span>
            <h2>O que você precisa hoje?</h2>
            <p>
              Dos reparos de fim de semana à festa de aniversário: se é para usar poucas vezes,
              alguém perto de você já tem.
            </p>
          </div>

          <div className="cat-grid">
            {CATEGORIES.map((category) => (
              <Link
                key={category.name}
                className="cat-card"
                to={`/explorar?categoria=${encodeURIComponent(category.name)}`}
              >
                <span className={`cat-icon ${category.tint}`}>
                  <Icon name={category.icon} />
                </span>
                <div>
                  <strong>{category.name}</strong>
                  <span>{category.total} itens</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============ COMO FUNCIONA ============ */}
      <section className="section" id="como-funciona">
        <div className="container">
          <div className="section-head center">
            <span className="eyebrow" style={{ justifyContent: "center" }}>
              Como funciona
            </span>
            <h2>Do &quot;preciso disso&quot; ao &quot;resolvido&quot; em 4 passos</h2>
            <p>Um processo pensado para ser facilitado, funcional, ágil e seguro — do início ao fim.</p>
          </div>

          <div className="steps-grid">
            {STEPS.map((step) => (
              <article className="step-card" key={step.title}>
                <span className="step-icon">
                  <Icon name={step.icon} size="lg" />
                </span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============ DESTAQUES ============ */}
      <section className="section-tight">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Em destaque</span>
            <h2>Itens bem avaliados perto de você</h2>
            <p>Uma amostra do que a comunidade da Vila Mariana e região está compartilhando agora.</p>
          </div>

          <div className="product-grid">
            {featured.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>

          <div className="section-cta">
            <Link to="/explorar" className="btn btn-outline btn-lg">
              Ver todos os itens
              <Icon name="arrowRight" size="sm" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============ SUSTENTABILIDADE / ODS 12 ============ */}
      <section className="section eco-section" id="sustentabilidade">
        <div className="container">
          <div className="eco-grid">
            <div>
              <span className="pill pill-outline">
                <Icon name="leaf" size="sm" />
                Sustentabilidade
              </span>
              <h2>Alugar é o novo ter</h2>
              <p className="lead">
                O hiperconsumo enche armários de coisas que quase não usamos. O Tem Aí? estende o
                ciclo de vida dos produtos: em vez de cada casa comprar o próprio item, um mesmo bem
                atende toda a vizinhança.
              </p>

              <ul className="eco-points">
                <li>
                  <Icon name="recycle" />
                  <div>
                    <strong>Economia circular na prática</strong>
                    <span>
                      Menos produção e menos descarte: os bens circulam entre pessoas em vez de
                      acumular poeira.
                    </span>
                  </div>
                </li>
                <li>
                  <Icon name="dollar" />
                  <div>
                    <strong>Renda para quem compartilha</strong>
                    <span>
                      Itens parados viram fonte de renda extra para os locadores da comunidade.
                    </span>
                  </div>
                </li>
                <li>
                  <Icon name="users" />
                  <div>
                    <strong>Comunidades mais próximas</strong>
                    <span>
                      A geolocalização conecta vizinhos — quem precisa e quem tem, a poucos minutos
                      de distância.
                    </span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="ods-card">
              <div className="ods-badge">
                <span className="ods-num">12</span>
                <div>
                  <h3>Consumo e Produção Responsáveis</h3>
                  <span>ODS 12 · Agenda 2030 · ONU</span>
                </div>
              </div>
              <p>
                O projeto atua diretamente no Objetivo de Desenvolvimento Sustentável 12 da ONU, ao
                promover o uso eficiente de bens de consumo e reduzir a demanda por novas produções.
              </p>
              <div className="eco-stats">
                <div className="eco-stat">
                  <strong>13 min</strong>
                  <span>tempo médio de uso de uma furadeira em toda a vida útil</span>
                </div>
                <div className="eco-stat">
                  <strong>80%</strong>
                  <span>dos objetos de casa são usados menos de 1x por mês</span>
                </div>
                <div className="eco-stat">
                  <strong>1 = 30+</strong>
                  <span>um item compartilhado evita dezenas de compras</span>
                </div>
              </div>
              <p className="eco-note">
                Estimativas baseadas em estudos sobre consumo colaborativo, usadas como referência
                neste protótipo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ DEPOIMENTOS ============ */}
      <section className="section">
        <div className="container">
          <div className="section-head center">
            <span className="eyebrow" style={{ justifyContent: "center" }}>
              Comunidade
            </span>
            <h2>Quem usa, recomenda</h2>
            <p>Cenários reais que o Tem Aí? foi criado para resolver.</p>
          </div>

          <div className="testi-grid">
            {TESTIMONIALS.map((item) => (
              <article className="testi-card" key={item.name}>
                <Stars />
                <blockquote>&quot;{item.quote}&quot;</blockquote>
                <div className="testi-author">
                  <span className={`avatar ${item.avatar}`}>{item.initials}</span>
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.role}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="section-tight">
        <div className="container">
          <div className="cta-band">
            <div>
              <h2>Tem algo parado na garagem? Coloque para trabalhar.</h2>
              <p>
                Cadastre seus itens em poucos minutos, defina o preço por dia e comece a receber
                pedidos de vizinhos.
              </p>
              <div className="cta-actions">
                <Link to="/anunciar" className="btn btn-accent btn-lg">
                  Anunciar meu primeiro item
                </Link>
                <Link to="/sobre" className="btn btn-light">
                  Conhecer o projeto
                </Link>
              </div>
            </div>
            <ul className="cta-list">
              <li>
                <Icon name="checkCircle" />
                Você define preço, caução e regras de uso
              </li>
              <li>
                <Icon name="checkCircle" />
                Pagamento garantido antes da retirada
              </li>
              <li>
                <Icon name="checkCircle" />
                Locatários identificados e avaliados
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="section" id="faq">
        <div className="container">
          <div className="section-head center">
            <span className="eyebrow" style={{ justifyContent: "center" }}>
              Dúvidas frequentes
            </span>
            <h2>Perguntas que sempre recebemos</h2>
          </div>

          <div className="faq-list">
            {FAQ.map((item) => (
              <details className="faq-item" key={item.q}>
                <summary>
                  {item.q}
                  <Icon name="plus" />
                </summary>
                <p>{item.a}</p>
              </details>
            ))}

            <details className="faq-item">
              <summary>
                O Tem Aí? já está funcionando?
                <Icon name="plus" />
              </summary>
              <p>
                Este site é o protótipo navegável do projeto. As funcionalidades serão entregues de
                forma incremental: autenticação e perfis, cadastro de produtos, busca com
                geolocalização e, por fim, o processo completo de reserva e transação. Saiba mais na
                página{" "}
                <Link to="/sobre" style={{ color: "var(--brand)", fontWeight: 600 }}>
                  Sobre o projeto
                </Link>
                .
              </p>
            </details>
          </div>
        </div>
      </section>
    </Layout>
  );
}
