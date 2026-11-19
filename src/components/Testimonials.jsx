import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icon, { Stars } from "./Icon";
import { useAuth } from "./AuthProvider";
import { useToast } from "./ToastProvider";
import { getInitials } from "../lib/authErrors";
import { fetchOwnAvaliacao, PAPEL_LABEL, saveAvaliacao, useAvaliacoes } from "../lib/avaliacoes";

const AVATARS = ["av-1", "av-2", "av-3", "av-4", "av-5", "av-6"];

function avatarFor(id) {
  let sum = 0;
  for (const ch of id) sum += ch.charCodeAt(0);
  return AVATARS[sum % AVATARS.length];
}

export function RatingInput({ value, onChange }) {
  return (
    <div className="testi-stars" role="radiogroup" aria-label="Nota">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
          onClick={() => onChange(n)}
          style={{
            background: "none",
            border: 0,
            padding: 2,
            cursor: "pointer",
            opacity: n <= value ? 1 : 0.25,
          }}
        >
          <Icon name="star" />
        </button>
      ))}
    </div>
  );
}

function ReviewForm({ onSaved }) {
  const { user, profile } = useAuth();
  const showToast = useToast();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [nota, setNota] = useState(5);
  const [papel, setPapel] = useState("");
  const [comentario, setComentario] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setNome(profile?.nome ?? "");
    setEmail(user?.email ?? "");
    fetchOwnAvaliacao()
      .then((own) => {
        if (!active || !own) return;
        setEditing(true);
        setNome(own.nome);
        setEmail(own.email);
        setNota(own.nota);
        setPapel(own.papel ?? "");
        setComentario(own.comentario);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user, profile]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (comentario.trim().length < 10) {
      setError("Conte um pouco mais: o comentário precisa de pelo menos 10 caracteres.");
      return;
    }
    setSaving(true);
    try {
      const updated = await saveAvaliacao(user.id, {
        nome,
        email,
        nota,
        comentario,
        papel,
        bairro: profile?.bairro,
      });
      setEditing(true);
      showToast(
        updated ? "Avaliação atualizada" : "Obrigado pela avaliação!",
        "Ela já aparece na página inicial."
      );
      onSaved();
    } catch (err) {
      setError(err?.message ?? "Não foi possível enviar sua avaliação.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="form-card" onSubmit={handleSubmit} style={{ maxWidth: 640, margin: "40px auto 0" }}>
      <h2>{editing ? "Editar minha avaliação" : "Avalie o Tem Aí?"}</h2>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="av-nome">Nome</label>
          <input
            id="av-nome"
            type="text"
            required
            minLength={2}
            maxLength={80}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label htmlFor="av-email">E-mail</label>
          <input
            id="av-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <span className="hint">Não é exibido publicamente.</span>
        </div>
      </div>

      <div className="form-row">
        <div className="form-field">
          <label>Nota</label>
          <RatingInput value={nota} onChange={setNota} />
        </div>
        <div className="form-field">
          <label htmlFor="av-papel">Você é (opcional)</label>
          <select id="av-papel" value={papel} onChange={(e) => setPapel(e.target.value)}>
            <option value="">—</option>
            <option value="locatario">Locatário(a)</option>
            <option value="locador">Locador(a)</option>
          </select>
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="av-comentario">Sua experiência</label>
        <textarea
          id="av-comentario"
          required
          minLength={10}
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
        />
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Enviando..." : editing ? "Salvar alterações" : "Enviar avaliação"}
        </button>
      </div>
    </form>
  );
}

export default function Testimonials() {
  const { user, isConfigured } = useAuth();
  const { avaliacoes, loading, reload } = useAvaliacoes();

  return (
    <section className="section" id="avaliacoes">
      <div className="container">
        <div className="section-head center">
          <span className="eyebrow" style={{ justifyContent: "center" }}>
            Comunidade
          </span>
          <h2>Quem usa, recomenda</h2>
          <p>Avaliações de quem já usa o Tem Aí?.</p>
        </div>

        {!loading && avaliacoes.length > 0 && (
          <div className="testi-grid">
            {avaliacoes.map((item) => {
              const role = [PAPEL_LABEL[item.papel], item.bairro].filter(Boolean).join(" · ");
              return (
                <article className="testi-card" key={item.id}>
                  <Stars count={item.nota} />
                  <blockquote>&quot;{item.comentario}&quot;</blockquote>
                  <div className="testi-author">
                    <span className={`avatar ${avatarFor(item.id)}`}>{getInitials(item.nome)}</span>
                    <div>
                      <strong>{item.nome}</strong>
                      {role && <span>{role}</span>}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!loading && avaliacoes.length === 0 && (
          <p style={{ textAlign: "center", color: "var(--muted)" }}>
            Ainda não há avaliações. Seja o primeiro a avaliar!
          </p>
        )}

        {isConfigured && user && <ReviewForm onSaved={reload} />}

        {isConfigured && !user && (
          <div className="section-cta">
            <Link to="/login" state={{ from: "/" }} className="btn btn-outline btn-lg">
              Entre para avaliar
              <Icon name="arrowRight" size="sm" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
