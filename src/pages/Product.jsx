import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import ProductCard from "../components/ProductCard";
import Icon, { Stars } from "../components/Icon";
import { getInitials } from "../lib/authErrors";
import { summarize, useProductReviews } from "../lib/avaliacoesProduto";
import { useAuth } from "../components/AuthProvider";
import { useToast } from "../components/ToastProvider";
import { formatDistance, formatPrice, formatRating, getProduct } from "../data/catalog";
import { calcTotals, createBooking, findConflict, useBlockedRanges } from "../lib/bookings";
import { getOrCreateConversation } from "../lib/chat";
import { deleteProduct, fetchProductBySlug, useMergedProducts } from "../lib/products";

const THUMB_ICONS = ["box", "zap", "camera"];

const toISO = (date) => date.toISOString().slice(0, 10);

const addDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toISO(date);
};

function deliveryRule(product) {
  const options = [];
  if (product.pickup !== false) options.push("retirada no endereço do locador");
  if (product.delivery) options.push("entrega na região (taxa combinada pelo chat)");
  if (product.meetup) options.push("ponto de encontro combinado");
  if (options.length === 0) {
    return "Retirada e devolução combinadas pelo chat.";
  }
  return options.join(", com ").replace(/^./, (c) => c.toUpperCase()) + ".";
}

export default function Product() {
  const { slug } = useParams();
  const catalogProduct = getProduct(slug);
  const { products } = useMergedProducts();
  const { user, profile } = useAuth();
  const blockedRanges = useBlockedRanges(slug);
  const navigate = useNavigate();
  const location = useLocation();
  const showToast = useToast();

  const { reviews: productReviews } = useProductReviews(slug);
  const [product, setProduct] = useState(catalogProduct ?? null);
  const [loading, setLoading] = useState(!catalogProduct);
  const [start, setStart] = useState(() => addDays(1));
  const [end, setEnd] = useState(() => addDays(3));
  const [activeThumb, setActiveThumb] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    setActiveThumb(0);
    setProduct(getProduct(slug) ?? null);
    setLoading(true);

    (async () => {
      try {
        const live = await fetchProductBySlug(slug);
        if (!mounted) return;
        if (live) setProduct(live);
        else setProduct(getProduct(slug) ?? null);
      } catch {
        if (mounted) setProduct(getProduct(slug) ?? null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [slug]);

  const days = useMemo(() => {
    const diff = Math.round((new Date(end) - new Date(start)) / 86400000);
    return Number.isNaN(diff) || diff < 1 ? 1 : diff;
  }, [start, end]);

  if (loading && !product) {
    return (
      <Layout>
        <div className="container" style={{ paddingTop: 48 }}>
          <p className="empty-state">Carregando anúncio…</p>
        </div>
      </Layout>
    );
  }

  if (!product) return <Navigate to="/explorar" replace />;

  const { rating, count: reviewCount } = summarize(productReviews);
  const { subtotal, fee, total } = calcTotals(product.price, product.deposit, days);
  const conflict = findConflict(blockedRanges, start, end);
  const invalidRange = !start || !end || end <= start;
  const city = product.city ?? "São Paulo";
  const photos = product.photos?.filter(Boolean) ?? [];
  const hasPhotos = photos.length > 0;
  const thumbs = hasPhotos ? photos : [product.icon, ...THUMB_ICONS];

  const isOwner = Boolean(user) && product.source === "supabase" && product.ownerId === user.id;

  const handleChat = async () => {
    if (product.source !== "supabase") {
      setChatOpen(true); // anúncio de demonstração: chat simulado
      return;
    }
    if (!user) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    if (isOwner) {
      navigate("/mensagens");
      return;
    }
    try {
      const id = await getOrCreateConversation({ product, userId: user.id });
      navigate(`/mensagens?c=${id}`);
    } catch (err) {
      showToast("Erro ao abrir o chat", err.message || "Tente novamente.");
    }
  };

  const handleDelete = async () => {
    if (!isOwner) return;
    if (!window.confirm(`Excluir o anúncio "${product.title}"? Essa ação não pode ser desfeita.`)) {
      return;
    }
    try {
      await deleteProduct({ id: product.id, userId: user.id });
      showToast("Anúncio excluído", "O anúncio foi removido do site.");
      navigate("/perfil");
    } catch (err) {
      showToast("Erro ao excluir", err.message || "Tente novamente.");
    }
  };

  const handleStartChange = (value) => {
    setStart(value);
    if (value >= end) {
      const next = new Date(value);
      next.setDate(next.getDate() + 1);
      setEnd(toISO(next));
    }
  };

  const similar = products
    .filter((item) => item.category === product.category && item.slug !== product.slug)
    .slice(0, 3);

  return (
    <Layout>
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
          {isOwner && (
            <button type="button" className="btn btn-outline btn-sm" onClick={handleDelete}>
              Excluir anúncio
            </button>
          )}
          <div className="product-meta">
            <span className="rating-inline">
              <Icon name="star" size="sm" />
              <strong>{formatRating(rating)}</strong>
              {reviewCount > 0 ? <>&nbsp;· {reviewCount} avaliações</> : <>&nbsp;· novo</>}
            </span>
            <span>
              <Icon name="pin" size="sm" />
              {product.neighborhood}, {city} · {formatDistance(product.distance)} de você
            </span>
            <span>
              <Icon name="recycle" size="sm" />
              {product.rentals > 0 ? `Alugado ${product.rentals} vezes` : "Ainda não foi alugado"}
            </span>
          </div>
        </div>

        <div className="product-layout">
          <div className="product-gallery">
            <div className={`gallery-main ${product.hue}${hasPhotos ? " has-photo" : ""}`}>
              {hasPhotos ? (
                <img src={thumbs[activeThumb]} alt={product.title} />
              ) : (
                <span className="media-icon">
                  <Icon name={thumbs[activeThumb]} />
                </span>
              )}
            </div>

            <div className="gallery-thumbs">
              {thumbs.map((thumb, index) => (
                <button
                  type="button"
                  key={hasPhotos ? thumb : `${thumb}-${index}`}
                  className={
                    index === activeThumb
                      ? `thumb ${product.hue} current${hasPhotos ? " has-photo" : ""}`
                      : `thumb ${product.hue}${hasPhotos ? " has-photo" : ""}`
                  }
                  aria-label={`Foto ${index + 1}`}
                  onClick={() => setActiveThumb(index)}
                >
                  {hasPhotos ? <img src={thumb} alt="" /> : <Icon name={thumb} />}
                </button>
              ))}
            </div>
          </div>

          <div className="product-details">
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
                  {deliveryRule(product)}
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
              <h2>Avaliações ({reviewCount})</h2>
              {reviewCount > 0 ? (
                productReviews.map((review) => (
                  <div className="review-item" key={review.id}>
                    <div className="review-head">
                      <span className="avatar av-2">{getInitials(review.nome)}</span>
                      <div>
                        <strong style={{ fontSize: "14.5px" }}>{review.nome}</strong>
                        <br />
                        <span style={{ fontSize: "12.5px", color: "var(--muted)" }}>
                          {new Date(review.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <Stars count={review.nota} />
                    </div>
                    <p>{review.comentario}</p>
                  </div>
                ))
              ) : (
                <p style={{ color: "var(--muted)" }}>
                  Este anúncio ainda não recebeu avaliações. Elas aparecem aqui depois que
                  alguém aluga e devolve o item.
                </p>
              )}
            </div>
          </div>

          <aside className="product-booking">
            <div className="booking-box">
              <div className="booking-price">
                <span className="price">{formatPrice(product.price)}</span>
                <span style={{ color: "var(--muted)", fontSize: 14 }}>/ dia</span>
              </div>
              <div className="booking-rating">
                <Icon name="star" size="sm" />
                {formatRating(rating)}
                {reviewCount > 0 ? ` · ${reviewCount} avaliações` : " · anúncio novo"} ·
                Cancelamento grátis até 24h antes
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
                disabled={Boolean(user) && (invalidRange || Boolean(conflict))}
                onClick={async () => {
                  if (!user) {
                    navigate("/login", { state: { from: location.pathname } });
                    return;
                  }
                  if (invalidRange || conflict) return;
                  try {
                    const booking = await createBooking({
                      product,
                      renterName: profile?.nome ?? user.user_metadata?.nome ?? "Locatário",
                      start,
                      end,
                    });
                    showToast("Reserva criada", "Finalize o pagamento para garantir o item.");
                    navigate(`/checkout/${booking.id}`);
                  } catch (err) {
                    showToast("Não foi possível reservar", err?.message || "Tente novamente.");
                  }
                }}
              >
                {user ? "Reservar e pagar" : "Entrar para reservar"}
              </button>
              {user && conflict && (
                <p className="form-error" role="alert">
                  Este item já está reservado de {conflict.start.split("-").reverse().join("/")} a{" "}
                  {conflict.end.split("-").reverse().join("/")}. Escolha outras datas.
                </p>
              )}
              <p className="booking-note">
                {user
                  ? "A reserva é imediata: você segue direto para o pagamento."
                  : "Você pode ver o item e simular o valor. Para alugar, entre na sua conta."}
              </p>

              <div className="owner-card">
                <span className={`avatar ${product.owner.avatar}`}>
                  {product.owner.avatarUrl ? (
                    <img src={product.owner.avatarUrl} alt="" />
                  ) : (
                    product.owner.initials
                  )}
                </span>
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
                  onClick={handleChat}
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
      {chatOpen && <ChatModal owner={product.owner} onClose={() => setChatOpen(false)} />}
    </Layout>
  );
}

const AUTO_REPLIES = [
  "Oi! Sim, o item está disponível. Para quais datas você precisa?",
  "Perfeito! Posso combinar a retirada ou a entrega, como preferir.",
  "Claro, qualquer dúvida é só falar. Pode reservar pelo site que eu confirmo rápido!",
  "Combinado! 👍",
];

function ChatModal({ owner, onClose }) {
  const [messages, setMessages] = useState([
    { from: "owner", text: `Olá! Aqui é ${owner.name.split(" ")[0]}. Como posso ajudar?` },
  ]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [replyIdx, setReplyIdx] = useState(0);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  function send(e) {
    e.preventDefault();
    const value = text.trim();
    if (!value || typing) return;
    setMessages((m) => [...m, { from: "me", text: value }]);
    setText("");
    setTyping(true);
    const reply = AUTO_REPLIES[replyIdx % AUTO_REPLIES.length];
    setReplyIdx((i) => i + 1);
    setTimeout(() => {
      setMessages((m) => [...m, { from: "owner", text: reply }]);
      setTyping(false);
    }, 1200);
  }

  return (
    <div className="chat-overlay" onClick={onClose}>
      <div className="chat-box" onClick={(e) => e.stopPropagation()}>
        <div className="chat-head">
          <span className={`avatar ${owner.avatar}`}>
            {owner.avatarUrl ? <img src={owner.avatarUrl} alt="" /> : owner.initials}
          </span>
          <div>
            <strong>{owner.name}</strong>
            <small>responde em {owner.reply}</small>
          </div>
          <button type="button" className="chat-close" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </div>
        <div className="chat-body">
          {messages.map((m, i) => (
            <div key={i} className={`chat-msg ${m.from}`}>
              {m.text}
            </div>
          ))}
          {typing && <div className="chat-msg owner chat-typing">digitando…</div>}
          <div ref={endRef} />
        </div>
        <form className="chat-form" onSubmit={send}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escreva uma mensagem"
            autoFocus
          />
          <button type="submit" className="btn btn-primary btn-sm">
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}
