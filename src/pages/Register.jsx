import { Link } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { GoogleMark } from "../components/Icon";
import { useToast } from "../components/ToastProvider";

const BENEFITS = [
  { icon: "checkCircle", text: "Cadastro gratuito, sem mensalidade" },
  { icon: "users", text: "Perfil verificado gera mais confiança" },
  { icon: "calendar", text: "Gerencie reservas e anúncios em um só lugar" },
];

export default function Register() {
  const showToast = useToast();

  return (
    <AuthLayout
      headline="Crie sua conta em menos de um minuto."
      pitch="Com um único perfil você aluga o que precisa e anuncia o que tem parado — tudo com segurança."
      benefits={BENEFITS}
    >
      <h1>Criar conta</h1>
      <p>Preencha seus dados para começar.</p>

      <form
        className="auth-form"
        onSubmit={(e) => {
          e.preventDefault();
          showToast(
            "Cadastro simulado",
            "O sistema de autenticação e perfis de usuário será a primeira entrega do projeto — Incremento 1."
          );
        }}
      >
        <div className="form-field">
          <label htmlFor="nome">Nome completo</label>
          <input
            type="text"
            id="nome"
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

        <button type="submit" className="btn btn-primary btn-lg btn-block">
          Criar minha conta
        </button>

        <div className="auth-divider">ou continue com</div>

        <button
          type="button"
          className="btn btn-social btn-block"
          onClick={() =>
            showToast(
              "Cadastro social",
              "A autenticação com Google está prevista para o Incremento 1 do projeto."
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
