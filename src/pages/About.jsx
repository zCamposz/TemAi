import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import Icon from "../components/Icon";
import { TEAM } from "../data/catalog";

const FEATURES = [
  {
    num: "01",
    title: "Autenticação e perfis de usuário",
    text: "Cadastro e login seguros, com perfis que reúnem avaliações, histórico e verificação de identidade — a base de confiança da comunidade.",
  },
  {
    num: "02",
    title: "Cadastro de produtos",
    text: "Anúncios com especificações detalhadas: fotos, marca, modelo, estado de conservação, preço por dia, caução e regras de uso.",
  },
  {
    num: "03",
    title: "Pesquisa com geolocalização",
    text: "Busca otimizada com filtragem por proximidade entre locador e locatário, além de filtros por categoria, preço e avaliação.",
  },
  {
    num: "04",
    title: "Reserva e transação end-to-end",
    text: "Processo completo: solicitação de reserva, confirmação, pagamento protegido, retirada, devolução e avaliação mútua.",
  },
];

const QUALITY = [
  {
    icon: "bell",
    title: "Facilitada",
    text: "Interfaces simples e diretas: qualquer pessoa encontra, reserva ou anuncia sem precisar de manual.",
  },
  {
    icon: "checkCircle",
    title: "Funcional",
    text: "Cada fluxo cobre o processo completo, do primeiro clique à devolução do item, sem pontas soltas.",
  },
  {
    icon: "zap",
    title: "Ágil",
    text: 'Busca por proximidade e respostas rápidas: menos espera entre o "preciso" e o "resolvido".',
  },
  {
    icon: "shield",
    title: "Segura",
    text: "Perfis verificados, pagamento protegido e caução: segurança para quem aluga e para quem empresta.",
  },
];

const INCREMENTS = [
  {
    title: "Sistema de autenticação e perfis de usuário",
    text: "Cadastro, login e gestão de perfil — a fundação de identidade e confiança sobre a qual os demais incrementos são construídos.",
  },
  {
    title: "Cadastro de produtos com especificações detalhadas",
    text: "Publicação de anúncios com fotos, especificações técnicas, preço por dia, caução e condições de entrega.",
  },
  {
    title: "Pesquisa otimizada com filtragem por geolocalização",
    text: "Busca por proximidade entre locador e locatário, com raio configurável, mapa de resultados e filtros combinados.",
  },
  {
    title: "Processo end-to-end para reserva e transação de bens",
    text: "Fluxo completo de reserva: solicitação, confirmação, pagamento protegido, caução, devolução e avaliações mútuas.",
  },
];

export default function About() {
  return (
    <Layout note="este site é o resultado da fase de Prototipagem do ciclo de vida do projeto">
      <section className="page-hero">
        <div className="container">
          <nav className="breadcrumb" aria-label="Trilha de navegação">
            <Link to="/">Início</Link>
            <span className="sep">/</span>
            <span>Sobre o projeto</span>
          </nav>
          <h1>Proposta de Projeto: Tem Aí?</h1>
          <p>
            Uma plataforma de marketplace baseada nos princípios da economia circular e colaborativa.
          </p>
        </div>
      </section>

      {/* ============ VISÃO GERAL ============ */}
      <section className="section-tight">
        <div className="container about-intro">
          <div>
            <span className="eyebrow">Visão geral e alinhamento estratégico</span>
            <h2
              style={{
                fontSize: "clamp(24px,3vw,34px)",
                letterSpacing: "-0.02em",
                marginBottom: 18,
              }}
            >
              Menos hiperconsumo, mais compartilhamento
            </h2>
            <p className="lead">
              O <strong>Tem Aí?</strong> tem como objetivo central mitigar a cultura do
              hiperconsumo, viabilizando o aluguel sob demanda de bens de consumo de uso esporádico —
              como ferramentas elétricas e maquinário para eventos.
            </p>
            <p className="lead">
              Ao estender o ciclo de vida dos produtos, o projeto atua diretamente no{" "}
              <strong>ODS 12 (Consumo e Produção Responsáveis)</strong> da Agenda 2030 da ONU: um
              mesmo bem passa a atender dezenas de pessoas, reduzindo a demanda por novas produções e
              o volume de descarte.
            </p>
          </div>

          <div className="about-visual">
            <div className="about-stat-card">
              <span
                className="step-icon"
                style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
              >
                <Icon name="recycle" size="lg" />
              </span>
              <div>
                <strong>Economia circular</strong>
                <span>Bens circulam entre pessoas em vez de acumular parados</span>
              </div>
            </div>
            <div className="about-stat-card">
              <span
                className="step-icon"
                style={{ background: "var(--accent-soft)", color: "var(--accent-dark)" }}
              >
                <Icon name="users" size="lg" />
              </span>
              <div>
                <strong>Economia colaborativa</strong>
                <span>Conexão direta entre locador e locatário, mediada pela plataforma</span>
              </div>
            </div>
            <div className="about-stat-card">
              <span className="step-icon" style={{ background: "#e8eef4", color: "#2e6e8e" }}>
                <Icon name="pin" size="lg" />
              </span>
              <div>
                <strong>Proximidade como critério</strong>
                <span>Geolocalização aproxima quem tem de quem precisa</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FUNCIONALIDADES ============ */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Funcionalidades</span>
            <h2>O que o sistema entrega</h2>
            <p>
              Quatro funcionalidades centrais, que também definem a ordem dos incrementos de
              desenvolvimento.
            </p>
          </div>

          <div className="feature-grid">
            {FEATURES.map((feature) => (
              <article className="feature-card" key={feature.num}>
                <span className="feature-num">{feature.num}</span>
                <div>
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============ QUALIDADE ============ */}
      <section className="section-tight">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Qualidade</span>
            <h2>Compromissos com o usuário final</h2>
            <p>Fazer com que o usuário consiga realizar todas as funções do sistema de maneira:</p>
          </div>

          <div className="quality-grid">
            {QUALITY.map((item) => (
              <article className="step-card" style={{ counterIncrement: "none" }} key={item.title}>
                <span className="step-icon">
                  <Icon name={item.icon} size="lg" />
                </span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============ METODOLOGIA ============ */}
      <section className="section" id="metodologia">
        <div className="container">
          <div className="section-head center">
            <span className="eyebrow" style={{ justifyContent: "center" }}>
              Ciclo de vida de software
            </span>
            <h2>Como o Tem Aí? está sendo construído</h2>
            <p>
              Combinamos dois modelos: <strong>Prototipagem</strong>, para validar as telas com
              usuários e stakeholders, e o modelo <strong>Incremental</strong>, para entregar o
              produto em etapas funcionais.
            </p>
          </div>

          <div className="timeline">
            <div className="tl-item current">
              <span className="tl-dot">
                <Icon name="penTool" />
              </span>
              <div className="tl-card">
                <span className="pill">Fase atual — você está aqui</span>
                <h3>Prototipagem</h3>
                <p>
                  Criação das telas do site para dar aos usuários e stakeholders uma ideia clara do
                  produto final. Este site é o resultado navegável dessa fase: todas as interfaces
                  das funcionalidades planejadas podem ser exploradas e validadas antes do
                  desenvolvimento.
                </p>
              </div>
            </div>

            {INCREMENTS.map((increment, index) => (
              <div className="tl-item" key={increment.title}>
                <span className="tl-dot">{index + 1}</span>
                <div className="tl-card">
                  <span className="pill pill-accent">Incremento {index + 1}</span>
                  <h3>{increment.title}</h3>
                  <p>{increment.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ EQUIPE ============ */}
      <section className="section-tight" id="equipe">
        <div className="container">
          <div className="section-head center">
            <span className="eyebrow" style={{ justifyContent: "center" }}>
              Equipe
            </span>
            <h2>Quem está por trás do Tem Aí?</h2>
          </div>

          <div className="team-grid">
            {TEAM.map((member) => (
              <article className="team-card" key={member.ra}>
                <span className={`avatar ${member.avatar}`}>{member.initials}</span>
                <h3>{member.name}</h3>
                <p className="ra">RA {member.ra}</p>
                <span className="role">Equipe de desenvolvimento</span>
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
              <h2>Explore o protótipo</h2>
              <p>
                Navegue pelas telas das quatro funcionalidades planejadas e ajude a validar o produto
                antes do primeiro incremento.
              </p>
              <div className="cta-actions">
                <Link to="/explorar" className="btn btn-accent btn-lg">
                  Explorar itens
                </Link>
                <Link to="/cadastro" className="btn btn-light">
                  Ver tela de cadastro
                </Link>
              </div>
            </div>
            <ul className="cta-list">
              <li>
                <Icon name="checkCircle" />
                Busca e listagem de itens
              </li>
              <li>
                <Icon name="checkCircle" />
                Página de produto com reserva
              </li>
              <li>
                <Icon name="checkCircle" />
                Login, cadastro e anúncio de itens
              </li>
            </ul>
          </div>
        </div>
      </section>
    </Layout>
  );
}
