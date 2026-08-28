import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { useAuth } from "../components/AuthProvider";
import { GoogleMark } from "../components/Icon";
import { useToast } from "../components/ToastProvider";
import { getAuthErrorMessage } from "../lib/authErrors";

const BENEFITS = [
  { icon: "pin", text: "Itens a poucos minutos de você" },
  { icon: "shield", text: "Pagamentos protegidos pela plataforma" },
  { icon: "dollar", text: "Renda extra com itens parados" },
  { icon: "leaf", text: "Consumo alinhado ao ODS 12 da ONU" },
];

export default function Login() {
  const { user, loading, isConfigured, signIn } = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from ?? "/";
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
    const email = form.email.value.trim();
    const password = form.senha.value;

    setSubmitting(true);
    try {
      await signIn(email, password);
      showToast("Bem-vindo!", "Login realizado com sucesso.");
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || user) return null;

  return (
    <AuthLayout
      headline="O que você precisa, a comunidade já tem."
      pitch="Entre para alugar itens de vizinhos, anunciar o que está parado e acompanhar suas reservas."
      benefits={BENEFITS}
    >
      <h1>Bem-vindo de volta!</h1>
      <p>Entre com seus dados para continuar.</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

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
          <label htmlFor="senha">Senha</label>
          <input
            type="password"
            id="senha"
            name="senha"
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
        </div>

        <div className="form-aux">
          <label className="check-row" style={{ padding: 0 }}>
            <input type="checkbox" defaultChecked /> Lembrar de mim
          </label>
          <a
            href="#/login"
            onClick={(e) => {
              e.preventDefault();
              showToast(
                "Recuperação de senha",
                "Em breve você poderá redefinir a senha por e-mail."
              );
            }}
          >
            Esqueci minha senha
          </a>
        </div>

        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
          {submitting ? "Entrando…" : "Entrar"}
        </button>

        <div className="auth-divider">ou continue com</div>

        <button
          type="button"
          className="btn btn-social btn-block"
          onClick={() =>
            showToast(
              "Login social",
              "A autenticação com Google será habilitada em uma próxima entrega."
            )
          }
        >
          <GoogleMark />
          Entrar com Google
        </button>
      </form>

      <p className="auth-switch">
        Ainda não tem conta? <Link to="/cadastro">Cadastre-se grátis</Link>
      </p>
    </AuthLayout>
  );
}
