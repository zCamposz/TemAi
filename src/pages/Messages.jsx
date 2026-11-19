import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../components/AuthProvider";
import { getInitials } from "../lib/authErrors";
import { fetchConversations, sendMessage, useMessages } from "../lib/chat";

export default function Messages() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const activeId = params.get("c");

  useEffect(() => {
    if (!user?.id) return undefined;
    let mounted = true;

    const load = () =>
      fetchConversations(user.id)
        .then((rows) => mounted && setConversations(rows))
        .catch((err) => mounted && setError(err?.message || "Não foi possível carregar o chat."))
        .finally(() => mounted && setLoading(false));

    load();
    const timer = setInterval(load, 10000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [user?.id]);

  const active = conversations.find((c) => c.id === activeId) ?? null;

  return (
    <Layout>
      <section className="page-hero">
        <div className="container">
          <h1>Mensagens</h1>
          <p>Converse com locadores e locatários da comunidade.</p>
        </div>
      </section>

      <div className="container" style={{ paddingBottom: 48 }}>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {loading ? (
          <p style={{ color: "var(--muted)" }}>Carregando conversas…</p>
        ) : conversations.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>
            Nenhuma conversa ainda. Abra um anúncio e toque em “Chat” para falar com o locador.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(220px, 300px) 1fr",
              gap: 20,
              alignItems: "start",
            }}
          >
            <ul className="listing-list">
              {conversations.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className="listing-row"
                    style={{
                      width: "100%",
                      textAlign: "left",
                      gridTemplateColumns: "1fr",
                      background: c.id === activeId ? "var(--surface-2, #f3f6f4)" : "transparent",
                      cursor: "pointer",
                    }}
                    onClick={() => setParams({ c: c.id })}
                  >
                    <div>
                      <h3>{c.other?.nome ?? "Usuário"}</h3>
                      <p>{c.product_title}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>

            {active ? (
              <Thread key={active.id} conversation={active} userId={user.id} />
            ) : (
              <p style={{ color: "var(--muted)" }}>Selecione uma conversa.</p>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

function Thread({ conversation, userId }) {
  const { messages, loading, append } = useMessages(conversation.id, userId);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setError("");
    try {
      const sent = await sendMessage({ conversationId: conversation.id, userId, body });
      append(sent);
      setText("");
    } catch (err) {
      setError(err?.message || "Não foi possível enviar.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="chat-box" style={{ position: "static", width: "100%", maxWidth: "none" }}>
      <div className="chat-head">
        <span className="avatar av-1">
          {conversation.other?.avatar_url ? (
            <img src={conversation.other.avatar_url} alt="" />
          ) : (
            getInitials(conversation.other?.nome ?? "U")
          )}
        </span>
        <div>
          <strong>{conversation.other?.nome ?? "Usuário"}</strong>
          <small>
            <Link to={`/produto/${conversation.product_slug}`}>{conversation.product_title}</Link>
          </small>
        </div>
      </div>
      <div className="chat-body" style={{ minHeight: 280, maxHeight: 460, overflowY: "auto" }}>
        {loading && <p style={{ color: "var(--muted)" }}>Carregando…</p>}
        {messages.map((m) => (
          <div key={m.id} className={`chat-msg ${m.sender_id === userId ? "me" : "owner"}`}>
            {m.body}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <form className="chat-form" onSubmit={handleSend}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escreva uma mensagem"
          maxLength={2000}
        />
        <button type="submit" className="btn btn-primary btn-sm" disabled={sending}>
          Enviar
        </button>
      </form>
    </div>
  );
}
