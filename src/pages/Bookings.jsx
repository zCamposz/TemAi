import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Icon from "../components/Icon";
import { useAuth } from "../components/AuthProvider";
import { useToast } from "../components/ToastProvider";
import { formatPrice } from "../data/catalog";
import {
  STATUS_LABEL,
  cancelBooking,
  clearBookings,
  confirmPickup,
  confirmReturn,
  respondBooking,
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
    <li className="listing-row" style={{ alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
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
  const all = useBookings();
  const [tab, setTab] = useState("minhas");
  const navigate = useNavigate();

  const mine = all.filter((b) => b.renterId === user.id);
  const received = all.filter((b) => b.ownerId === user.id);

  function act(fn, title, message) {
    return () => {
      fn();
      showToast(title, message);
    };
  }

  function renterActions(b) {
    const btn = (label, onClick, cls = "btn-outline") => (
      <button key={label} type="button" className={`btn ${cls} btn-sm`} onClick={onClick}>
        {label}
      </button>
    );
    const out = [];

    if (b.status === "pendente") {
      out.push(
        btn("Cancelar", act(() => cancelBooking(b.id), "Reserva cancelada", "Cancelamento gratuito."))
      );
      // Apoio à demonstração: o locador do catálogo é fictício.
      if (!b.ownerId) {
        out.push(
          btn(
            "Locador aceita",
            act(() => respondBooking(b.id, true), "Locador confirmou", "Agora é só pagar para garantir."),
            "btn-primary"
          ),
          btn(
            "Locador recusa",
            act(() => respondBooking(b.id, false), "Locador recusou", "Tente outro período ou item.")
          )
        );
      }
    }
    if (b.status === "confirmada") {
      out.push(
        btn("Pagar", () => navigate(`/checkout/${b.id}`), "btn-primary"),
        btn("Cancelar", act(() => cancelBooking(b.id), "Reserva cancelada", "Nada foi cobrado."))
      );
    }
    if (b.status === "paga") {
      out.push(
        btn(
          "Confirmar retirada",
          act(
            () => confirmPickup(b.id),
            "Retirada confirmada",
            "O valor foi repassado ao locador. A caução fica retida até a devolução."
          ),
          "btn-primary"
        )
      );
    }
    if (b.status === "em_andamento" && !b.ownerId) {
      out.push(
        btn(
          "Item devolvido",
          act(() => confirmReturn(b.id), "Devolução confirmada", "Caução liberada. Aluguel concluído!"),
          "btn-primary"
        )
      );
    }
    return out;
  }

  function ownerActions(b) {
    const btn = (label, onClick, cls = "btn-outline") => (
      <button key={label} type="button" className={`btn ${cls} btn-sm`} onClick={onClick}>
        {label}
      </button>
    );
    if (b.status === "pendente") {
      return [
        btn(
          "Confirmar",
          act(() => respondBooking(b.id, true), "Reserva confirmada", "O locatário foi avisado para pagar."),
          "btn-primary"
        ),
        btn("Recusar", act(() => respondBooking(b.id, false), "Reserva recusada", "O período fica livre.")),
      ];
    }
    if (b.status === "em_andamento") {
      return [
        btn(
          "Confirmar devolução",
          act(() => confirmReturn(b.id), "Devolução confirmada", "Caução liberada ao locatário."),
          "btn-primary"
        ),
      ];
    }
    return [];
  }

  const list = tab === "minhas" ? mine : received;

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
          <p>Acompanhe o que você alugou e os pedidos recebidos nos seus anúncios.</p>
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
          </div>

          {list.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>
              {tab === "minhas" ? (
                <>
                  Você ainda não reservou nada. <Link to="/explorar">Explorar itens</Link>
                </>
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
                  actions={tab === "minhas" ? renterActions(b) : ownerActions(b)}
                />
              ))}
            </ul>
          )}

          {all.length > 0 && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ marginTop: 16 }}
              onClick={act(clearBookings, "Demonstração reiniciada", "Todas as reservas foram apagadas.")}
            >
              Limpar reservas
            </button>
          )}
        </section>

      </div>
    </Layout>
  );
}
