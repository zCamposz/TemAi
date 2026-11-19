import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { useToast } from "./ToastProvider";
import { useReviewedBookings } from "../lib/avaliacoesProduto";
import { cancelBooking, confirmPickup, confirmReturn } from "../lib/bookings";

// Botões de ação do locatário, usados em "Reservas" e na Home.
export default function RenterBookingActions({ booking: b }) {
  const { user } = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();
  const reviewed = useReviewedBookings(user.id);

  const act = (fn, title, message) => () => {
    fn();
    showToast(title, message);
  };

  const btn = (label, onClick, cls = "btn-outline") => (
    <button key={label} type="button" className={`btn ${cls} btn-sm`} onClick={onClick}>
      {label}
    </button>
  );

  const out = [];

  if (b.status === "confirmada") {
    out.push(
      btn("Pagar", () => navigate(`/checkout/${b.id}`), "btn-primary"),
      btn("Cancelar", act(() => cancelBooking(b.id), "Reserva cancelada", "Nada foi cobrado."))
    );
  }
  // A retirada é confirmada pelo locador. Itens de demonstração (sem locador real) ficam com o locatário.
  if (b.status === "paga" && !b.ownerId) {
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
  if (b.status === "em_andamento") {
    out.push(
      btn(
        "Item devolvido",
        act(() => confirmReturn(b.id), "Devolução confirmada", "Caução liberada. Aluguel concluído!"),
        "btn-primary"
      )
    );
  }
  if (b.status === "concluida") {
    const done = reviewed.has(b.id);
    out.push(
      btn(
        done ? "Editar avaliação" : "Avaliar item",
        () => navigate(`/avaliar/${b.id}`),
        done ? "btn-outline" : "btn-primary"
      )
    );
  }

  return <>{out}</>;
}
