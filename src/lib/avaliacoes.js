import { useCallback, useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "./supabase";

// "email" fica de fora de propósito: a coluna é privada no banco.
const PUBLIC_COLUMNS = "id, user_id, nome, nota, comentario, papel, bairro, created_at";

export const PAPEL_LABEL = { locatario: "Locatário(a)", locador: "Locador(a)" };

export function useAvaliacoes() {
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  const reload = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const { data } = await supabase
      .from("avaliacoes")
      .select(PUBLIC_COLUMNS)
      .eq("visivel", true)
      .order("created_at", { ascending: false })
      .limit(12);
    setAvaliacoes(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { avaliacoes, loading, reload };
}

export async function fetchOwnAvaliacao() {
  const { data, error } = await supabase.rpc("get_own_avaliacao");
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row?.id ? row : null;
}

/** Cria ou atualiza a avaliação do usuário logado (uma por usuário). */
export async function saveAvaliacao(userId, { nome, email, nota, comentario, papel, bairro }) {
  const payload = {
    nome: nome.trim(),
    email: email.trim(),
    nota,
    comentario: comentario.trim(),
    papel: papel || null,
    bairro: bairro?.trim() || null,
  };
  const existing = await fetchOwnAvaliacao();
  const query = existing
    ? supabase.from("avaliacoes").update(payload).eq("user_id", userId)
    : supabase.from("avaliacoes").insert({ ...payload, user_id: userId });
  const { error } = await query;
  if (error) throw error;
  return Boolean(existing);
}
