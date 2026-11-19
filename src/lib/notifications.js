import { useCallback, useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "./supabase";

/**
 * Notificações no aplicativo (tabela `notifications` no Supabase).
 * São criadas pelas funções do banco quando a reserva muda de status e
 * chegam em tempo real para a outra pessoa.
 */

export function useNotifications(userId) {
  const [items, setItems] = useState([]);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !userId) return setItems([]);
    const { data } = await supabase
      .from("notifications")
      .select("id, title, message, read, created_at, link")
      .order("created_at", { ascending: false })
      .limit(100);
    setItems(
      (data ?? []).map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        read: n.read,
        link: n.link,
        createdAt: n.created_at,
      }))
    );
  }, [userId]);

  useEffect(() => {
    load();
    if (!isSupabaseConfigured || !userId) return undefined;
    const channel = supabase
      .channel(`notifications-${userId}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, load)
      .subscribe();
    const timer = setInterval(load, 30000);
    return () => {
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [load, userId]);

  return { items, reload: load };
}

export async function markAllRead(userId) {
  await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
}

export async function markRead(id) {
  await supabase.from("notifications").update({ read: true }).eq("id", id);
}

export async function clearNotifications(userId) {
  await supabase.from("notifications").delete().eq("user_id", userId);
}
