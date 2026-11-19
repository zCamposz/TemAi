import { useSyncExternalStore } from "react";
import { notify } from "./notifications";

/**
 * Reservas simuladas (Incremento 4).
 * Para a apresentação, tudo é guardado no localStorage do navegador:
 * não há banco nem gateway de pagamento reais.
 */

const STORAGE_KEY = "temai.reservas.v1";
export const SERVICE_FEE = 0.1;

/** Status que ocupam as datas do item (impedem reservas conflitantes). */
export const BLOCKING = ["pendente", "confirmada", "paga", "em_andamento"];

export const STATUS_LABEL = {
  pendente: "Aguardando locador",
  confirmada: "Confirmada — falta pagar",
  paga: "Paga — aguardando retirada",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  recusada: "Recusada",
  cancelada: "Cancelada",
};

let cache = null;
const listeners = new Set();

function read() {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(next) {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* armazenamento indisponível: mantém só em memória */
  }
  listeners.forEach((fn) => fn());
}

function subscribe(fn) {
  listeners.add(fn);
  const onStorage = (e) => {
    if (e.key === STORAGE_KEY) {
      cache = null;
      fn();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", onStorage);
  };
}

export function useBookings() {
  return useSyncExternalStore(subscribe, read, read);
}

export function calcTotals(price, deposit, days) {
  const subtotal = price * days;
  const fee = Math.round(subtotal * SERVICE_FEE);
  return { subtotal, fee, deposit, total: subtotal + fee + deposit };
}

/** Retorna a reserva que conflita com o período, ou null. Devolução e retirada no mesmo dia são permitidas. */
export function findConflict(bookings, slug, start, end) {
  return (
    bookings.find(
      (b) => b.slug === slug && BLOCKING.includes(b.status) && start < b.end && end > b.start
    ) ?? null
  );
}

export function createBooking({ product, user, renterName, start, end, days }) {
  const booking = {
    id: crypto.randomUUID(),
    slug: product.slug,
    title: product.title,
    icon: product.icon,
    hue: product.hue,
    photo: product.photos?.[0] ?? null,
    ownerId: product.ownerId ?? null,
    ownerName: product.owner.name,
    renterId: user.id,
    renterName,
    start,
    end,
    days,
    ...calcTotals(product.price, product.deposit, days),
    status: "pendente",
    payment: null,
    createdAt: new Date().toISOString(),
  };
  write([booking, ...read()]);
  notify(booking.ownerId, {
    title: "Nova solicitação de reserva",
    message: `${renterName} quer alugar "${booking.title}" de ${start} a ${end}.`,
  });
  notify(booking.renterId, {
    title: "Solicitação enviada",
    message: `Aguardando ${booking.ownerName} responder sobre "${booking.title}".`,
  });
  return booking;
}

/** Atualiza a reserva e avisa as partes: `to` lista "owner" e/ou "renter". */
function patch(id, changes, to = [], title = "", text = (b) => "") {
  const current = read().find((b) => b.id === id);
  write(read().map((b) => (b.id === id ? { ...b, ...changes } : b)));
  if (!current) return;
  const message = text(current);
  if (to.includes("owner")) notify(current.ownerId, { title, message });
  if (to.includes("renter")) notify(current.renterId, { title, message });
}

export const respondBooking = (id, accept) =>
  patch(
    id,
    { status: accept ? "confirmada" : "recusada" },
    ["renter"],
    accept ? "Reserva confirmada" : "Reserva recusada",
    (b) =>
      accept
        ? `${b.ownerName} aceitou "${b.title}". Faça o pagamento para garantir.`
        : `${b.ownerName} recusou a reserva de "${b.title}".`
  );
export const cancelBooking = (id) =>
  patch(id, { status: "cancelada" }, ["owner"], "Reserva cancelada", (b) =>
    `${b.renterName} cancelou a reserva de "${b.title}".`
  );
export const payBooking = (id, method) =>
  patch(id, { status: "paga", payment: method }, ["owner"], "Pagamento recebido", (b) =>
    `${b.renterName} pagou a reserva de "${b.title}". Combine a retirada.`
  );
export const confirmPickup = (id) =>
  patch(id, { status: "em_andamento" }, ["renter"], "Retirada confirmada", (b) =>
    `"${b.title}" está com você até ${b.end}.`
  );
export const confirmReturn = (id) =>
  patch(id, { status: "concluida" }, ["renter", "owner"], "Reserva concluída", (b) =>
    `A devolução de "${b.title}" foi confirmada. Obrigado por usar o Tem Aí?`
  );
export const clearBookings = () => write([]);
