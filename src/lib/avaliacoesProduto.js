import { useCallback, useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "./supabase";

const COLUMNS = "id, user_id, product_slug, booking_id, nome, nota, comentario, created_at";

/** Avaliações visíveis de um item, da mais recente para a mais antiga. */
export function useProductReviews(slug) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  const reload = useCallback(async () => {
    if (!isSupabaseConfigured || !slug) {
      setReviews([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("avaliacoes_produto")
      .select(COLUMNS)
      .eq("product_slug", slug)
      .eq("visivel", true)
      .order("created_at", { ascending: false });
    setReviews(data ?? []);
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { reviews, loading, reload };
}

export function summarize(reviews) {
  if (reviews.length === 0) return { rating: 0, count: 0 };
  const sum = reviews.reduce((acc, r) => acc + r.nota, 0);
  return { rating: Math.round((sum / reviews.length) * 10) / 10, count: reviews.length };
}

/** Mapa slug → { rating, reviews } para todos os itens avaliados. */
export async function fetchRatingSummary() {
  if (!isSupabaseConfigured) return new Map();
  const { data, error } = await supabase.rpc("produto_avaliacoes_resumo");
  if (error) return new Map();
  return new Map(
    (data ?? []).map((row) => [
      row.product_slug,
      { rating: Number(row.media), reviews: Number(row.total) },
    ])
  );
}

/** Avaliação que o usuário já fez para uma reserva, ou null. */
export async function fetchBookingReview(userId, bookingId) {
  const { data, error } = await supabase
    .from("avaliacoes_produto")
    .select(COLUMNS)
    .eq("user_id", userId)
    .eq("booking_id", bookingId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Ids das reservas que o usuário já avaliou. */
export function useReviewedBookings(userId) {
  const [ids, setIds] = useState(() => new Set());

  useEffect(() => {
    if (!isSupabaseConfigured || !userId) return;
    let active = true;
    supabase
      .from("avaliacoes_produto")
      .select("booking_id")
      .eq("user_id", userId)
      .then(({ data }) => {
        if (active) setIds(new Set((data ?? []).map((r) => r.booking_id)));
      });
    return () => {
      active = false;
    };
  }, [userId]);

  return ids;
}

/** Cria ou atualiza a avaliação do item (uma por reserva). Retorna true se foi atualização. */
export async function saveProductReview({ userId, booking, nome, nota, comentario }) {
  const existing = await fetchBookingReview(userId, booking.id);
  const payload = { nome: nome.trim(), nota, comentario: comentario.trim() };

  const { error } = existing
    ? await supabase.from("avaliacoes_produto").update(payload).eq("id", existing.id)
    : await supabase.from("avaliacoes_produto").insert({
        ...payload,
        user_id: userId,
        product_slug: booking.slug,
        booking_id: booking.id,
      });
  if (error) throw error;
  return Boolean(existing);
}
