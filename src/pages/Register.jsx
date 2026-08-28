import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { useAuth } from "../components/AuthProvider";
import { GoogleMark } from "../components/Icon";
import { useToast } from "../components/ToastProvider";
import { getAuthErrorMessage } from "../lib/authErrors";

const BENEFITS = [
  { icon: "checkCircle", text: "Cadastro gratuito, sem mensalidade" },
  { icon: "users", text: "Perfil verificado gera mais confiança" },
  { icon: "calendar", text: "Gerencie reservas e anúncios em um só lugar" },
];

export default function Register() {
  const { user, loading, isConfigured, signUp } = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) navigate("/", { replace: true });
  }, [loading, user, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!isConfigured) {
      setError("Supabase não configurado. Verifique o arquivo .env.");
      return;
    }

    const form = e.currentTarget;
    const nome = form.nome.value.trim();
    const email = form.email.value.trim();
    const telefone = form.telefone.value.trim();
    const senha = form.senha.value;
    const senha2 = form.senha2.value;

    if (senha !== senha2) {
      setError("As senhas não coincidem.");
      return;
    }

    setSubmitting(true);
    try {
      await signUp({ nome, email, telefone, password: senha });
      showToast("Conta criada!", "Bem-vindo(a) ao Tem Aí?");
      navigate("/", { replace: true });
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || user) return null;

  return (
    <AuthLayout
      headline="Crie sua conta em menos de um minuto."
      pitch="Com um único perfil você aluga o que precisa e anuncia o que tem parado — tudo com segurança."
      benefits={BENEFITS}
    >
      <h1>Criar conta</h1>
      <p>Preencha seus dados para começar.</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <div className="form-field">
          <label htmlFor="nome">Nome completo</label>
          <input
            type="text"
            id="nome"
            name="nome"
            placeholder="Como você quer ser chamado(a)"
            autoComplete="name"
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="email">E-mail</label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="voce@exemplo.com"
            autoComplete="email"
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="telefone">Celular</label>
          <input
            type="tel"
            id="telefone"
            name="telefone"
            placeholder="(11) 99999-9999"
            autoComplete="tel"
            required
          />
          <span className="hint">Usado para combinar retiradas e devoluções com segurança.</span>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="senha">Senha</label>
            <input
              type="password"
              id="senha"
              name="senha"
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="senha2">Confirmar senha</label>
            <input
              type="password"
              id="senha2"
              name="senha2"
              placeholder="Repita a senha"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
        </div>

        <label className="check-row" style={{ alignItems: "flex-start" }}>
          <input type="checkbox" required style={{ marginTop: 3 }} />
          <span style={{ fontSize: "13.5px" }}>
            Li e aceito os{" "}
            <Link to="/cadastro" style={{ color: "var(--brand)", fontWeight: 600 }}>
              Termos de Uso
            </Link>{" "}
            e a{" "}
            <Link to="/cadastro" style={{ color: "var(--brand)", fontWeight: 600 }}>
              Política de Privacidade
            </Link>
            .
          </span>
        </label>

        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
          {submitting ? "Criando conta…" : "Criar minha conta"}
        </button>

        <div className="auth-divider">ou continue com</div>

        <button
          type="button"
          className="btn btn-social btn-block"
          onClick={() =>
            showToast(
              "Cadastro social",
              "A autenticação com Google será habilitada em uma próxima entrega."
            )
          }
        >
          <GoogleMark />
          Cadastrar com Google
        </button>
      </form>

      <p className="auth-switch">
        Já tem uma conta? <Link to="/login">Entrar</Link>
      </p>
    </AuthLayout>
  );
}
