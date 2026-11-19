import { useCallback, useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "./supabase";

/**
 * Reservas guardadas no Supabase (tabela `bookings`), compartilhadas entre
 * locador e locatário. As mudanças de status passam por funções do banco
 * (`create_booking` e `booking_transition`) que validam quem pode fazer o quê.
 */

export const SERVICE_FEE = 0.1;

/** Status que ocupam as datas do item (impedem reservas conflitantes). */
export const BLOCKING = ["pendente", "confirmada", "paga", "em_andamento"];

export const STATUS_LABEL = {
  pendente: "Aguardando locador",
  confirmada: "Aguardando pagamento",
  paga: "Paga — aguardando retirada",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  recusada: "Recusada",
  cancelada: "Cancelada",
};

const listeners = new Set();
const refresh = () => listeners.forEach((fn) => fn());

function fromRow(r) {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    icon: r.icon,
    hue: r.hue,
    photo: r.photo,
    ownerId: r.owner_id,
    ownerName: r.owner_name,
    renterId: r.renter_id,
    renterName: r.renter_name,
    start: r.start_date,
    end: r.end_date,
    days: r.days,
    subtotal: Number(r.subtotal),
    fee: Number(r.fee),
    deposit: Number(r.deposit),
    total: Number(r.total),
    status: r.status,
    payment: r.payment,
    createdAt: r.created_at,
  };
}

/** Reservas em que o usuário é locatário ou locador, atualizadas em tempo real. */
export function useBookings(userId) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(Boolean(userId) && isSupabaseConfigured);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !userId) {
      setBookings([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });
    setBookings((data ?? []).map(fromRow));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
    if (!isSupabaseConfigured || !userId) return undefined;
    listeners.add(load);
    const channel = supabase
      .channel(`bookings-${userId}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, load)
      .subscribe();
    // Reserva de segurança caso o tempo real esteja desligado no projeto.
    const timer = setInterval(load, 20000);
    return () => {
      listeners.delete(load);
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [load, userId]);

  return { bookings, loading };
}

/** Períodos já ocupados de um item (para bloquear datas conflitantes). */
export function useBlockedRanges(slug) {
  const [ranges, setRanges] = useState([]);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !slug) return setRanges([]);
    const { data } = await supabase.rpc("booking_blocked_ranges", { p_slug: slug });
    setRanges((data ?? []).map((r) => ({ start: r.start_date, end: r.end_date })));
  }, [slug]);

  useEffect(() => {
    load();
    listeners.add(load);
    return () => listeners.delete(load);
  }, [load]);

  return ranges;
}

export function calcTotals(price, deposit, days) {
  const subtotal = price * days;
  const fee = Math.round(subtotal * SERVICE_FEE);
  return { subtotal, fee, deposit, total: subtotal + fee + deposit };
}

/** Retorna o período que conflita com as datas, ou null. Devolução e retirada no mesmo dia são permitidas. */
export function findConflict(ranges, start, end) {
  return ranges.find((r) => start < r.end && end > r.start) ?? null;
}

export async function createBooking({ product, renterName, start, end }) {
  const { data, error } = await supabase.rpc("create_booking", {
    p_slug: product.slug,
    p_start: start,
    p_end: end,
    p_renter_name: renterName,
    p_title: product.title,
    p_icon: product.icon ?? null,
    p_hue: product.hue ?? null,
    p_photo: product.photos?.[0] ?? null,
    p_owner_name: product.owner.name,
    p_price: product.price,
    p_deposit: product.deposit ?? 0,
  });
  if (error) throw error;
  refresh();
  return fromRow(data);
}

async function transition(id, action, payment = null) {
  const { data, error } = await supabase.rpc("booking_transition", {
    p_id: id,
    p_action: action,
    p_payment: payment,
  });
  if (error) throw error;
  refresh();
  return fromRow(data);
}

export const cancelBooking = (id) => transition(id, "cancel");
export const payBooking = (id, method) => transition(id, "pay", method);
export const confirmPickup = (id) => transition(id, "pickup");
export const confirmReturn = (id) => transition(id, "return");
