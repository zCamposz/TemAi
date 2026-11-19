import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import Icon from "../components/Icon";
import { useAuth } from "../components/AuthProvider";
import { formatPrice } from "../data/catalog";
import { payBooking, useBookings } from "../lib/bookings";

const fmtDate = (iso) => iso.split("-").reverse().join("/");

const METHODS = [
  { id: "Pix", title: "Pix", desc: "Aprovação imediata", icon: "zap" },
  { id: "Cartão de crédito", title: "Cartão de crédito", desc: "Em até 3x sem juros", icon: "box" },
];

const STEPS = ["Pagamento", "Revisão", "Confirmação"];

const onlyDigits = (v) => v.replace(/\D/g, "");
const maskCard = (v) => onlyDigits(v).slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
const maskExp = (v) => {
  const d = onlyDigits(v).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

export default function Checkout() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const bookings = useBookings();
  const booking = bookings.find((b) => b.id === id && b.renterId === user.id);

  const [step, setStep] = useState(0);
  const [method, setMethod] = useState("Pix");
  const [installments, setInstallments] = useState(1);
  const [card, setCard] = useState({ number: "", name: "", exp: "", cvv: "" });
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [paidMethod, setPaidMethod] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  // Só permanece na página se ainda faltar pagar (ou se acabou de pagar).
  if (!booking) return <Navigate to="/reservas" replace />;
  if (booking.status !== "confirmada" && step < 2 && !processing) {
    return <Navigate to="/reservas" replace />;
  }

  const pixCode = `00020126TEMAI${booking.id.slice(0, 8).toUpperCase()}5204000053039865406${booking.total.toFixed(2)}`;

  function goReview() {
    if (method === "Cartão de crédito") {
      if (onlyDigits(card.number).length < 16) return setError("Informe os 16 dígitos do cartão.");
      if (card.name.trim().length < 3) return setError("Informe o nome impresso no cartão.");
      if (onlyDigits(card.exp).length < 4) return setError("Informe a validade (MM/AA).");
      if (onlyDigits(card.cvv).length < 3) return setError("Informe o código de segurança.");
    }
    setError("");
    setStep(1);
  }

  function confirm() {
    setProcessing(true);
    setTimeout(() => {
      const label =
        method === "Cartão de crédito" && installments > 1
          ? `${method} em ${installments}x`
          : method;
      payBooking(booking.id, label);
      setPaidMethod(label);
      setProcessing(false);
      setStep(2);
    }, 1800);
  }

  const lastDigits = onlyDigits(card.number).slice(-4);
  const done = step === 2;

  return (
    <Layout>
      <div className="container checkout">
        <ol className="co-steps" aria-label="Etapas">
          {STEPS.map((label, i) => (
            <li key={label} className={i === step ? "current" : i < step ? "done" : ""}>
              <span className="co-dot">{i < step ? "✓" : i + 1}</span>
              {label}
            </li>
          ))}
        </ol>

        <div className="co-layout">
          <div className="co-main">
            {processing && (
              <section className="co-card co-center">
                <div className="co-spinner" />
                <h2>Processando pagamento…</h2>
                <p>Não feche esta página.</p>
              </section>
            )}

            {!processing && step === 0 && (
              <section className="co-card">
                <h2>Como você quer pagar?</h2>
                <div className="co-methods">
                  {METHODS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className={`co-method${method === m.id ? " active" : ""}`}
                      onClick={() => {
                        setMethod(m.id);
                        setError("");
                      }}
                    >
                      <span className="co-radio" />
                      <Icon name={m.icon} />
                      <span>
                        <strong>{m.title}</strong>
                        <small>{m.desc}</small>
                      </span>
                    </button>
                  ))}
                </div>

                {method === "Cartão de crédito" && (
                  <div className="co-card-form">
                    <div className="form-field">
                      <label htmlFor="cc-num">Número do cartão</label>
                      <input
                        id="cc-num"
                        inputMode="numeric"
                        placeholder="0000 0000 0000 0000"
                        value={card.number}
                        onChange={(e) => setCard({ ...card, number: maskCard(e.target.value) })}
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="cc-name">Nome no cartão</label>
                      <input
                        id="cc-name"
                        placeholder="Como está impresso"
                        value={card.name}
                        onChange={(e) => setCard({ ...card, name: e.target.value })}
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-field">
                        <label htmlFor="cc-exp">Validade</label>
                        <input
                          id="cc-exp"
                          inputMode="numeric"
                          placeholder="MM/AA"
                          value={card.exp}
                          onChange={(e) => setCard({ ...card, exp: maskExp(e.target.value) })}
                        />
                      </div>
                      <div className="form-field">
                        <label htmlFor="cc-cvv">CVV</label>
                        <input
                          id="cc-cvv"
                          inputMode="numeric"
                          placeholder="123"
                          value={card.cvv}
                          onChange={(e) =>
                            setCard({ ...card, cvv: onlyDigits(e.target.value).slice(0, 4) })
                          }
                        />
                      </div>
                    </div>
                    <div className="form-field">
                      <label htmlFor="cc-inst">Parcelas</label>
                      <select
                        id="cc-inst"
                        value={installments}
                        onChange={(e) => setInstallments(Number(e.target.value))}
                      >
                        {[1, 2, 3].map((n) => (
                          <option key={n} value={n}>
                            {n}x de {formatPrice(Math.round((booking.total / n) * 100) / 100)} sem juros
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {method === "Pix" && (
                  <p className="co-hint">
                    O código Pix será exibido na próxima etapa. Esta é uma simulação: nenhum valor
                    real é cobrado.
                  </p>
                )}

                {error && (
                  <p className="form-error" role="alert">
                    {error}
                  </p>
                )}

                <div className="co-actions">
                  <Link to="/reservas" className="btn btn-ghost">
                    Voltar
                  </Link>
                  <button type="button" className="btn btn-primary btn-lg" onClick={goReview}>
                    Continuar
                  </button>
                </div>
              </section>
            )}

            {!processing && step === 1 && (
              <section className="co-card">
                <h2>Revise e confirme</h2>

                <div className="co-review">
                  <div>
                    <small>Forma de pagamento</small>
                    <strong>
                      {method === "Cartão de crédito"
                        ? `Cartão final ${lastDigits} · ${installments}x`
                        : "Pix"}
                    </strong>
                  </div>
                  <button type="button" className="co-link" onClick={() => setStep(0)}>
                    Alterar
                  </button>
                </div>
                <div className="co-review">
                  <div>
                    <small>Período</small>
                    <strong>
                      {fmtDate(booking.start)} a {fmtDate(booking.end)} · {booking.days}{" "}
                      {booking.days === 1 ? "dia" : "dias"}
                    </strong>
                  </div>
                </div>
                <div className="co-review">
                  <div>
                    <small>Locador</small>
                    <strong>{booking.ownerName}</strong>
                  </div>
                </div>

                {method === "Pix" && (
                  <div className="co-pix">
                    <div className="co-qr" aria-hidden="true">
                      {Array.from({ length: 81 }, (_, i) => (
                        <i key={i} className={(i * 7 + (i % 5) * 3) % 3 === 0 ? "on" : ""} />
                      ))}
                    </div>
                    <div>
                      <small>Pix copia e cola</small>
                      <code>{pixCode}</code>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                          navigator.clipboard?.writeText(pixCode);
                          setCopied(true);
                        }}
                      >
                        {copied ? "Copiado!" : "Copiar código"}
                      </button>
                    </div>
                  </div>
                )}

                <div className="safety-note">
                  <Icon name="shield" />
                  <span>
                    Pagamento protegido: o valor só é repassado ao locador depois que você confirma
                    a retirada do item.
                  </span>
                </div>

                <div className="co-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setStep(0)}>
                    Voltar
                  </button>
                  <button type="button" className="btn btn-primary btn-lg" onClick={confirm}>
                    {method === "Pix" ? "Já fiz o Pix" : `Pagar ${formatPrice(booking.total)}`}
                  </button>
                </div>
              </section>
            )}

            {!processing && done && (
              <section className="co-card co-center">
                <span className="co-success">
                  <Icon name="checkCircle" />
                </span>
                <h2>Pagamento aprovado!</h2>
                <p>
                  Pago via <strong>{paidMethod}</strong>. Combine a retirada de{" "}
                  <strong>{booking.title}</strong> com {booking.ownerName}.
                </p>
                <p className="co-hint">Pedido nº {booking.id.slice(0, 8).toUpperCase()}</p>
                <div className="co-actions center">
                  <button
                    type="button"
                    className="btn btn-primary btn-lg"
                    onClick={() => navigate("/reservas")}
                  >
                    Ver minhas reservas
                  </button>
                  <Link to="/explorar" className="btn btn-outline btn-lg">
                    Continuar explorando
                  </Link>
                </div>
              </section>
            )}
          </div>

          <aside className="co-summary">
            <h3>Resumo do pedido</h3>
            <div className="co-item">
              {booking.photo ? (
                <img src={booking.photo} alt="" />
              ) : (
                <span className={`listing-thumb ${booking.hue}`}>
                  <Icon name={booking.icon} />
                </span>
              )}
              <div>
                <strong>{booking.title}</strong>
                <small>
                  {fmtDate(booking.start)} a {fmtDate(booking.end)}
                </small>
              </div>
            </div>
            <div className="calc-rows">
              <div className="calc-row">
                <span>
                  Diárias ({booking.days} {booking.days === 1 ? "dia" : "dias"})
                </span>
                <span>{formatPrice(booking.subtotal)}</span>
              </div>
              <div className="calc-row">
                <span>Taxa de serviço</span>
                <span>{formatPrice(booking.fee)}</span>
              </div>
              <div className="calc-row">
                <span>Caução reembolsável</span>
                <span>{formatPrice(booking.deposit)}</span>
              </div>
              <div className="calc-row total">
                <span>Total</span>
                <span>{formatPrice(booking.total)}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
