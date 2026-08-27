import { Link } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { GoogleMark } from "../components/Icon";
import { useToast } from "../components/ToastProvider";

const BENEFITS = [
  { icon: "pin", text: "Itens a poucos minutos de você" },
  { icon: "shield", text: "Pagamentos protegidos pela plataforma" },
  { icon: "dollar", text: "Renda extra com itens parados" },
  { icon: "leaf", text: "Consumo alinhado ao ODS 12 da ONU" },
];

const INCREMENT_1 =
  "O sistema de autenticação e perfis de usuário será a primeira entrega do projeto — Incremento 1.";

export default function Login() {
  const showToast = useToast();

  return (
    <AuthLayout
      headline="O que você precisa, a comunidade já tem."
      pitch="Entre para alugar itens de vizinhos, anunciar o que está parado e acompanhar suas reservas."
      benefits={BENEFITS}
    >
      <h1>Bem-vindo de volta!</h1>
      <p>Entre com seus dados para continuar.</p>

      <form
        className="auth-form"
        onSubmit={(e) => {
          e.preventDefault();
          showToast("Login simulado", INCREMENT_1);
        }}
      >
        <div className="form-field">
          <label htmlFor="email">E-mail</label>
          <input
            type="email"
            id="email"
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
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
        </div>

        <div className="form-aux">
          <label className="check-row" style={{ padding: 0 }}>
            <input type="checkbox" /> Lembrar de mim
          </label>
          <a
            href="#/login"
            onClick={(e) => {
              e.preventDefault();
              showToast("Recuperação de senha", INCREMENT_1);
            }}
          >
            Esqueci minha senha
          </a>
        </div>

        <button type="submit" className="btn btn-primary btn-lg btn-block">
          Entrar
        </button>

        <div className="auth-divider">ou continue com</div>

        <button
          type="button"
          className="btn btn-social btn-block"
          onClick={() =>
            showToast("Login social", "A autenticação com Google está prevista para o Incremento 1 do projeto.")
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
