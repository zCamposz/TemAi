import { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import Icon from "../components/Icon";
import RenterBookingActions from "../components/RenterBookingActions";
import { useAuth } from "../components/AuthProvider";
import { useToast } from "../components/ToastProvider";
import { formatPrice } from "../data/catalog";
import {
  STATUS_LABEL,
  confirmPickup,
  clearFinishedBookings,
  useBookings,
} from "../lib/bookings";

const fmtDate = (iso) => iso.split("-").reverse().join("/");

const STATUS_COLOR = {
  pendente: "#b7791f",
  confirmada: "#137a50",
  paga: "#137a50",
  em_andamento: "#2b6cb0",
  concluida: "#6b7c76",
  recusada: "#d14d3f",
  cancelada: "#d14d3f",
};

function StatusBadge({ status }) {
  return (
    <span
      style={{
        color: STATUS_COLOR[status],
        border: `1.5px solid ${STATUS_COLOR[status]}`,
        borderRadius: 999,
        padding: "2px 10px",
        fontSize: 12.5,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function BookingRow({ booking, role, actions }) {
  return (
    <li className="listing-row" style={{ alignItems: "flex-start", flexWrap: "wrap", gap: 20 }}>
      {booking.photo ? (
        <img src={booking.photo} alt="" />
      ) : (
        <span className={`listing-thumb ${booking.hue}`}>
          <Icon name={booking.icon} />
        </span>
      )}
      <div style={{ flex: 1, minWidth: 220 }}>
        <h3>
          <Link to={`/produto/${booking.slug}`}>{booking.title}</Link>
        </h3>
        <p>
          {fmtDate(booking.start)} a {fmtDate(booking.end)} · {booking.days}{" "}
          {booking.days === 1 ? "dia" : "dias"} · {formatPrice(booking.total)}
        </p>
        <p style={{ color: "var(--muted)", fontSize: 13 }}>
          {role === "renter" ? `Locador: ${booking.ownerName}` : `Locatário: ${booking.renterName}`}
          {booking.payment ? ` · Pago via ${booking.payment}` : ""}
        </p>
        <div style={{ marginTop: 8 }}>
          <StatusBadge status={booking.status} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{actions}</div>
    </li>
  );
}

export default function Bookings() {
  const { user } = useAuth();
  const showToast = useToast();
  const { bookings: all, loading } = useBookings(user.id);
  const [tab, setTab] = useState("minhas");

  const mine = all.filter((b) => b.renterId === user.id && !b.renterHidden);
  const received = all.filter((b) => b.ownerId === user.id && !b.ownerHidden);
  const FINISHED = ["concluida", "recusada", "cancelada"];

  function act(fn, title, message) {
    return async () => {
      try {
        await fn();
        showToast(title, message);
      } catch (err) {
        showToast("Não foi possível concluir", err?.message || "Tente novamente.");
      }
    };
  }

  function ownerActions(b) {
    const btn = (label, onClick, cls = "btn-outline") => (
      <button key={label} type="button" className={`btn ${cls} btn-sm`} onClick={onClick}>
        {label}
      </button>
    );
    if (b.status === "paga") {
      return [
        btn(
          "Confirmar retirada",
          act(
            () => confirmPickup(b.id),
            "Retirada confirmada",
            "O item está em andamento. O locatário foi avisado."
          ),
          "btn-primary"
        ),
      ];
    }
    return [];
  }

  const list = tab === "minhas" ? mine : received;
  const finishedCount = list.filter((b) => FINISHED.includes(b.status)).length;

  return (
    <Layout>
      <section className="page-hero">
        <div className="container">
          <nav className="breadcrumb" aria-label="Trilha de navegação">
            <Link to="/">Início</Link>
            <span className="sep">/</span>
            <span>Reservas</span>
          </nav>
          <h1>Reservas</h1>
          <p>Acompanhe seus aluguéis (pagamento, devolução e avaliação) e os pedidos recebidos nos seus anúncios.</p>
        </div>
      </section>

      <div className="container profile-layout">
        <section className="form-card">
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <button
              type="button"
              className={tab === "minhas" ? "chip active" : "chip"}
              onClick={() => setTab("minhas")}
            >
              Minhas reservas ({mine.length})
            </button>
            <button
              type="button"
              className={tab === "recebidas" ? "chip active" : "chip"}
              onClick={() => setTab("recebidas")}
            >
              Pedidos recebidos ({received.length})
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ marginLeft: "auto" }}
              disabled={!finishedCount}
              onClick={act(
                () => clearFinishedBookings(tab === "minhas" ? "renter" : "owner"),
                "Reservas limpas",
                "As reservas finalizadas foram removidas da lista."
              )}
            >
              Limpar reservas
            </button>
          </div>

          {loading ? (
            <p style={{ color: "var(--muted)" }}>Carregando reservas…</p>
          ) : list.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>
              {tab === "minhas" ? (
                "Você ainda não fez nenhuma reserva."
              ) : (
                "Nenhum pedido nos seus anúncios por enquanto."
              )}
            </p>
          ) : (
            <ul className="listing-list">
              {list.map((b) => (
                <BookingRow
                  key={b.id}
                  booking={b}
                  role={tab === "minhas" ? "renter" : "owner"}
                  actions={tab === "minhas" ? <RenterBookingActions booking={b} /> : ownerActions(b)}
                />
              ))}
            </ul>
          )}

        </section>

      </div>
    </Layout>
  );
}
