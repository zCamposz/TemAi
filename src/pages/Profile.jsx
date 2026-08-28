import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Icon from "../components/Icon";
import { useAuth } from "../components/AuthProvider";
import { useToast } from "../components/ToastProvider";
import { getAuthErrorMessage, getInitials } from "../lib/authErrors";

export default function Profile() {
  const { user, profile, signOut, updateProfile } = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const displayName = profile?.nome ?? user?.user_metadata?.nome ?? "Usuário";

  useEffect(() => {
    if (profile) {
      setNome(profile.nome ?? "");
      setTelefone(profile.telefone ?? "");
    }
  }, [profile]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      await updateProfile({ nome: nome.trim(), telefone: telefone.trim() });
      showToast("Perfil atualizado", "Suas informações foram salvas com sucesso.");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      navigate("/");
      showToast("Até logo!", "Você saiu da sua conta.");
    } catch (err) {
      showToast("Erro ao sair", getAuthErrorMessage(err));
    }
  }

  return (
    <Layout>
      <section className="page-hero">
        <div className="container">
          <nav className="breadcrumb" aria-label="Trilha de navegação">
            <Link to="/">Início</Link>
            <span className="sep">/</span>
            <span>Meu perfil</span>
          </nav>
          <h1>Meu perfil</h1>
          <p>Gerencie seus dados de conta e preferências de contato.</p>
        </div>
      </section>

      <div className="container profile-layout">
        <div className="profile-summary form-card">
          <div
            className="avatar"
            style={{ background: "var(--brand)", width: 72, height: 72, fontSize: 22 }}
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" style={{ width: "100%", borderRadius: "50%" }} />
            ) : (
              getInitials(displayName)
            )}
          </div>
          <div>
            <strong style={{ fontSize: 18 }}>{displayName}</strong>
            <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>{user?.email}</p>
            {profile?.verificado && (
              <p className="verified" style={{ marginTop: 8, fontSize: 13.5 }}>
                <Icon name="checkCircle" size="sm" /> Identidade verificada
              </p>
            )}
          </div>
        </div>

        <form className="profile-form form-card" onSubmit={handleSubmit}>
          <h2>Dados pessoais</h2>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <div className="form-field">
            <label htmlFor="perfil-nome">Nome completo</label>
            <input
              id="perfil-nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="perfil-email">E-mail</label>
            <input id="perfil-email" type="email" value={user?.email ?? ""} disabled />
            <span className="hint">O e-mail não pode ser alterado aqui.</span>
          </div>

          <div className="form-field">
            <label htmlFor="perfil-telefone">Celular</label>
            <input
              id="perfil-telefone"
              type="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(11) 99999-9999"
              required
            />
          </div>

          <div className="profile-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Salvando…" : "Salvar alterações"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={handleSignOut}>
              Sair da conta
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
