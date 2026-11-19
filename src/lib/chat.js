import { useCallback, useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "./supabase";

const CONVERSATION_SELECT = `
  *,
  owner:owner_id ( id, nome, avatar_url ),
  renter:renter_id ( id, nome, avatar_url )
`;

/** Busca (ou cria) a conversa entre o usuário e o dono do anúncio. */
export async function getOrCreateConversation({ product, userId }) {
  const { data: existing, error: findError } = await supabase
    .from("conversations")
    .select("id")
    .eq("product_slug", product.slug)
    .eq("renter_id", userId)
    .maybeSingle();

  if (findError) throw findError;
  if (existing) return existing.id;

  const { data, error } = await supabase
    .from("conversations")
    .insert({
      product_slug: product.slug,
      product_title: product.title,
      owner_id: product.ownerId,
      renter_id: userId,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

export async function fetchConversations(userId) {
  const { data, error } = await supabase
    .from("conversations")
    .select(CONVERSATION_SELECT)
    .or(`owner_id.eq.${userId},renter_id.eq.${userId}`)
    .order("last_message_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...row,
    other: row.owner_id === userId ? row.renter : row.owner,
  }));
}

export async function fetchMessages(conversationId) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function sendMessage({ conversationId, userId, body }) {
  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: userId, body: body.trim() })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function markConversationRead(conversationId, userId) {
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId)
    .is("read_at", null);
}

/** Mensagens da conversa, atualizadas em tempo real. */
export function useMessages(conversationId, userId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(Boolean(conversationId));

  useEffect(() => {
    if (!isSupabaseConfigured || !conversationId) {
      setMessages([]);
      setLoading(false);
      return undefined;
    }

    let mounted = true;
    setLoading(true);

    fetchMessages(conversationId)
      .then((rows) => {
        if (!mounted) return;
        setMessages(rows);
        markConversationRead(conversationId, userId);
      })
      .catch(() => mounted && setMessages([]))
      .finally(() => mounted && setLoading(false));

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((current) =>
            current.some((m) => m.id === payload.new.id) ? current : [...current, payload.new]
          );
          if (payload.new.sender_id !== userId) markConversationRead(conversationId, userId);
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [conversationId, userId]);

  const append = useCallback((message) => {
    setMessages((current) =>
      current.some((m) => m.id === message.id) ? current : [...current, message]
    );
  }, []);

  return { messages, loading, append };
}
