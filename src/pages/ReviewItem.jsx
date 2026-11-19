import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import Icon from "../components/Icon";
import { RatingInput } from "../components/Testimonials";
import { useAuth } from "../components/AuthProvider";
import { useToast } from "../components/ToastProvider";
import { useBookings } from "../lib/bookings";
import { fetchBookingReview, saveProductReview } from "../lib/avaliacoesProduto";
import { isSupabaseConfigured } from "../lib/supabase";

export default function ReviewItem() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const bookings = useBookings();
  const navigate = useNavigate();
  const showToast = useToast();
  const booking = bookings.find((b) => b.id === id && b.renterId === user.id);

  const [nome, setNome] = useState(profile?.nome ?? "");
  const [nota, setNota] = useState(5);
  const [comentario, setComentario] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    fetchBookingReview(user.id, id)
      .then((own) => {
        if (!active || !own) return;
        setEditing(true);
        setNome(own.nome);
        setNota(own.nota);
        setComentario(own.comentario);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user.id, id]);

  // Só quem alugou e já devolveu o item pode avaliar.
  if (!booking || booking.status !== "concluida") return <Navigate to="/reservas" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (comentario.trim().length < 10) {
      setError("Conte um pouco mais: o comentário precisa de pelo menos 10 caracteres.");
      return;
    }
    setSaving(true);
    try {
      const updated = await saveProductReview({ userId: user.id, booking, nome, nota, comentario });
      showToast(
        updated ? "Avaliação atualizada" : "Obrigado pela avaliação!",
        "Ela já aparece na página do item."
      );
      navigate(`/produto/${booking.slug}`);
    } catch (err) {
      setError(err?.message ?? "Não foi possível enviar sua avaliação.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <section className="page-hero">
        <div className="container">
          <nav className="breadcrumb" aria-label="Trilha de navegação">
            <Link to="/">Início</Link>
            <span className="sep">/</span>
            <Link to="/reservas">Reservas</Link>
            <span className="sep">/</span>
            <span>Avaliar item</span>
          </nav>
          <h1>Avaliar item</h1>
          <p>Conte como foi usar &quot;{booking.title}&quot;. Sua opinião ajuda a vizinhança.</p>
        </div>
      </section>

      <div className="container">
        {!isSupabaseConfigured ? (
          <p className="empty-state">Avaliações indisponíveis: o banco de dados não está configurado.</p>
        ) : (
          <form
            className="form-card"
            onSubmit={handleSubmit}
            style={{ maxWidth: 640, margin: "40px auto" }}
          >
            <h2>{editing ? "Editar minha avaliação" : "Como foi sua experiência?"}</h2>

            <div className="listing-row" style={{ marginBottom: 16 }}>
              {booking.photo ? (
                <img src={booking.photo} alt="" />
              ) : (
                <span className={`listing-thumb ${booking.hue}`}>
                  <Icon name={booking.icon} />
                </span>
              )}
              <div>
                <h3>{booking.title}</h3>
                <p>Locador: {booking.ownerName}</p>
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="ri-nome">Nome exibido</label>
                <input
                  id="ri-nome"
                  type="text"
                  required
                  minLength={2}
                  maxLength={80}
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label>Nota</label>
                <RatingInput value={nota} onChange={setNota} />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="ri-comentario">Sua opinião sobre o item</label>
              <textarea
                id="ri-comentario"
                required
                minLength={10}
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Estado do item, funcionamento, atendimento do locador…"
              />
            </div>

            {error && <p className="form-error">{error}</p>}

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Enviando..." : editing ? "Salvar alterações" : "Enviar avaliação"}
              </button>
              <Link to="/reservas" className="btn btn-ghost">
                Cancelar
              </Link>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
}
