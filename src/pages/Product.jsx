import { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import ProductCard from "../components/ProductCard";
import Icon, { Stars } from "../components/Icon";
import { useToast } from "../components/ToastProvider";
import {
  PRODUCTS,
  REVIEWS,
  formatPrice,
  formatRating,
  getProduct,
} from "../data/catalog";

const SERVICE_FEE = 0.1;
const THUMB_ICONS = ["box", "zap", "camera"];

const toISO = (date) => date.toISOString().slice(0, 10);

const addDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toISO(date);
};

export default function Product() {
  const { slug } = useParams();
  const product = getProduct(slug);
  const showToast = useToast();

  const [start, setStart] = useState(() => addDays(1));
  const [end, setEnd] = useState(() => addDays(3));
  const [activeThumb, setActiveThumb] = useState(0);

  const days = useMemo(() => {
    const diff = Math.round((new Date(end) - new Date(start)) / 86400000);
    return Number.isNaN(diff) || diff < 1 ? 1 : diff;
  }, [start, end]);

  if (!product) return <Navigate to="/explorar" replace />;

  const subtotal = product.price * days;
  const fee = Math.round(subtotal * SERVICE_FEE);
  const total = subtotal + fee + product.deposit;

  const handleStartChange = (value) => {
    setStart(value);
    if (value >= end) {
      const next = new Date(value);
      next.setDate(next.getDate() + 1);
      setEnd(toISO(next));
    }
  };

  const similar = PRODUCTS.filter(
    (item) => item.category === product.category && item.slug !== product.slug
  ).slice(0, 3);

  const thumbs = [product.icon, ...THUMB_ICONS];

  return (
    <Layout note="a reserva e a transação end-to-end serão entregues no Incremento 4 do projeto">
      <div className="container" style={{ paddingTop: 32 }}>
        <nav className="breadcrumb" aria-label="Trilha de navegação">
          <Link to="/">Início</Link>
          <span className="sep">/</span>
          <Link to="/explorar">Explorar</Link>
          <span className="sep">/</span>
          <Link to={`/explorar?categoria=${encodeURIComponent(product.category)}`}>
            {product.category}
          </Link>
          <span className="sep">/</span>
          <span>{product.title}</span>
        </nav>

        <div className="product-title-row">
          <h1>{product.title}</h1>
          <div className="product-meta">
            <span className="rating-inline">
              <Icon name="star" size="sm" />
              <strong>{formatRating(product.rating)}</strong>&nbsp;· {product.reviews} avaliações
            </span>
            <span>
              <Icon name="pin" size="sm" />
              {product.neighborhood}, São Paulo · a{" "}
              {product.distance.toFixed(1).replace(".", ",")} km de você
            </span>
            <span>
              <Icon name="recycle" size="sm" />
              Alugado {product.rentals} vezes
            </span>
          </div>
        </div>

        <div className="product-layout">
          {/* ============ COLUNA PRINCIPAL ============ */}
          <div>
            <div className={`gallery-main ${product.hue}`}>
              <span className="media-icon">
                <Icon name={thumbs[activeThumb]} />
              </span>
            </div>

            <div className="gallery-thumbs">
              {thumbs.map((icon, index) => (
                <button
                  type="button"
                  key={icon}
                  className={
                    index === activeThumb ? `thumb ${product.hue} current` : `thumb ${product.hue}`
                  }
                  aria-label={`Foto ${index + 1}`}
                  onClick={() => setActiveThumb(index)}
                >
                  <Icon name={icon} />
                </button>
              ))}
            </div>

            <div className="detail-block">
              <h2>Descrição</h2>
              {product.description.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <div className="detail-block">
              <h2>Especificações</h2>
              <table className="spec-table">
                <tbody>
                  {product.specs.map(([label, value]) => (
                    <tr key={label}>
                      <th>{label}</th>
                      <td>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="detail-block">
              <h2>Regras de uso</h2>
              <ul className="rules-list">
                <li>
                  <Icon name="checkCircle" />
                  {product.delivery
                    ? "Retirada no meu endereço ou entrega na região (taxa combinada pelo chat)."
                    : "Retirada e devolução no meu endereço (combinamos o horário pelo chat)."}
                </li>
                <li>
                  <Icon name="checkCircle" />
                  Uso residencial. Para demandas de grande porte, combine antes.
                </li>
                <li>
                  <Icon name="checkCircle" />
                  Caução de {formatPrice(product.deposit)}, devolvida integralmente na entrega em bom
                  estado.
                </li>
                <li>
                  <Icon name="checkCircle" />
                  Atraso na devolução: cobrança de diária adicional proporcional.
                </li>
              </ul>
            </div>

            <div className="detail-block">
              <h2>Avaliações ({product.reviews})</h2>
              {REVIEWS.map((review) => (
                <div className="review-item" key={review.name}>
                  <div className="review-head">
                    <span className={`avatar ${review.avatar}`}>{review.initials}</span>
                    <div>
                      <strong style={{ fontSize: "14.5px" }}>{review.name}</strong>
                      <br />
                      <span style={{ fontSize: "12.5px", color: "var(--muted)" }}>
                        {review.when}
                      </span>
                    </div>
                    <Stars />
                  </div>
                  <p>{review.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ============ PAINEL DE RESERVA ============ */}
          <aside>
            <div className="booking-box">
              <div className="booking-price">
                <span className="price">{formatPrice(product.price)}</span>
                <span style={{ color: "var(--muted)", fontSize: 14 }}>/ dia</span>
              </div>
              <div className="booking-rating">
                <Icon name="star" size="sm" />
                {formatRating(product.rating)} · {product.reviews} avaliações · Cancelamento grátis
                até 24h antes
              </div>

              <div className="date-grid">
                <div className="date-cell">
                  <label htmlFor="dtStart">Retirada</label>
                  <input
                    type="date"
                    id="dtStart"
                    value={start}
                    min={toISO(new Date())}
                    onChange={(e) => handleStartChange(e.target.value)}
                  />
                </div>
                <div className="date-cell">
                  <label htmlFor="dtEnd">Devolução</label>
                  <input
                    type="date"
                    id="dtEnd"
                    value={end}
                    min={start}
                    onChange={(e) => setEnd(e.target.value)}
                  />
                </div>
              </div>

              <div className="calc-rows">
                <div className="calc-row">
                  <span>
                    {formatPrice(product.price)} × {days} {days === 1 ? "dia" : "dias"}
                  </span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="calc-row">
                  <span>Taxa de serviço (10%)</span>
                  <span>{formatPrice(fee)}</span>
                </div>
                <div className="calc-row">
                  <span>Caução reembolsável</span>
                  <span>{formatPrice(product.deposit)}</span>
                </div>
                <div className="calc-row total">
                  <span>Total agora</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-primary btn-lg btn-block"
                onClick={() =>
                  showToast(
                    "Reserva simulada!",
                    "O processo end-to-end de reserva e transação será entregue no Incremento 4 do projeto."
                  )
                }
              >
                Solicitar reserva
              </button>
              <p className="booking-note">
                Você ainda não será cobrado — o locador precisa confirmar.
              </p>

              <div className="owner-card">
                <span className={`avatar ${product.owner.avatar}`}>{product.owner.initials}</span>
                <div>
                  <strong>
                    {product.owner.name}
                    {product.owner.verified && <Icon name="shield" size="sm" className="verified" />}
                  </strong>
                  <span>
                    Locador desde {product.owner.since} · responde em {product.owner.reply}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() =>
                    showToast(
                      "Chat em breve",
                      "A conversa entre locador e locatário faz parte dos perfis de usuário — Incremento 1 do projeto."
                    )
                  }
                >
                  Chat
                </button>
              </div>

              <div className="safety-note">
                <Icon name="shield" />
                <span>
                  Pagamento protegido: o valor só é repassado ao locador depois que você confirma a
                  retirada do item.
                </span>
              </div>
            </div>
          </aside>
        </div>

        {/* ============ SEMELHANTES ============ */}
        {similar.length > 0 && (
          <section className="section-tight">
            <div className="section-head">
              <span className="eyebrow">Você também pode precisar</span>
              <h2>Itens semelhantes por perto</h2>
            </div>

            <div className="product-grid cols-3">
              {similar.map((item) => (
                <ProductCard key={item.slug} product={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}
