import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { useAuth } from "../components/AuthProvider";
import { GoogleMark } from "../components/Icon";
import { useToast } from "../components/ToastProvider";
import { getAuthErrorMessage } from "../lib/authErrors";
import { geocodeCep, isUsableCoord } from "../lib/geo";

const BENEFITS = [
  { icon: "checkCircle", text: "Cadastro gratuito, sem mensalidade" },
  { icon: "users", text: "Perfil verificado gera mais confiança" },
  { icon: "calendar", text: "Gerencie reservas e anúncios em um só lugar" },
];

export default function Register() {
  const { user, loading, isConfigured, signUp } = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from ?? "/";
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [cep, setCep] = useState("");
  const [logradouro, setLogradouro] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [coords, setCoords] = useState(null);
  const [cepStatus, setCepStatus] = useState("");

  useEffect(() => {
    if (!loading && user) navigate(redirectTo, { replace: true });
  }, [loading, user, navigate, redirectTo]);

  async function lookupCep(raw) {
    const digits = raw.replace(/\D/g, "");
    if (digits.length !== 8) {
      setCoords(null);
      setCepStatus("");
      return;
    }

    setCepStatus("Buscando CEP…");
    try {
      const found = await geocodeCep(digits);
      if (!found || !isUsableCoord(found.lat, found.lng)) {
        setCoords(null);
        setCepStatus("Não foi possível localizar esse CEP.");
        return;
      }
      setLogradouro(found.logradouro || "");
      setBairro(found.bairro || "");
      setCidade(found.cidade || "");
      setCoords({ lat: found.lat, lng: found.lng });
      setCepStatus("");
    } catch {
      setCoords(null);
      setCepStatus("Não foi possível localizar esse CEP.");
    }
  }

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
    const endereco = {
      cep: cep.replace(/\D/g, ""),
      logradouro: logradouro.trim(),
      numero: numero.trim(),
      bairro: bairro.trim(),
      cidade: cidade.trim(),
      lat: coords?.lat,
      lng: coords?.lng,
    };

    if (senha !== senha2) {
      setError("As senhas não coincidem.");
      return;
    }

    if (!endereco.cep || !endereco.logradouro || !endereco.numero || !endereco.bairro || !endereco.cidade) {
      setError("Preencha CEP, logradouro, número, bairro e cidade.");
      return;
    }

    if (!isUsableCoord(endereco.lat, endereco.lng)) {
      setError("Não foi possível localizar esse CEP. Confira os números e tente de novo.");
      return;
    }

    setSubmitting(true);
    try {
      const data = await signUp({ nome, email, telefone, password: senha, endereco });
      if (data?.session) {
        showToast("Conta criada!", "Bem-vindo(a) ao Tem Aí?");
        navigate(redirectTo, { replace: true });
      } else {
        showToast(
          "Confirme seu e-mail",
          "Enviamos um link de confirmação. Depois disso, entre com seu e-mail e senha."
        );
        navigate("/login", { replace: true, state: { from: redirectTo } });
      }
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
            <label htmlFor="cep">CEP</label>
            <input
              type="text"
              id="cep"
              name="cep"
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="00000-000"
              value={cep}
              required
              onChange={(event) => {
                const next = event.target.value;
                setCep(next);
                lookupCep(next);
              }}
            />
          </div>
          <div className="form-field">
            <label htmlFor="numero">Número</label>
            <input
              type="text"
              id="numero"
              name="numero"
              autoComplete="address-line2"
              placeholder="123"
              value={numero}
              required
              onChange={(event) => setNumero(event.target.value)}
            />
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="logradouro">Logradouro</label>
          <input
            type="text"
            id="logradouro"
            name="logradouro"
            autoComplete="address-line1"
            placeholder="Rua, avenida..."
            value={logradouro}
            required
            onChange={(event) => setLogradouro(event.target.value)}
          />
          {cepStatus ? <span className="hint">{cepStatus}</span> : null}
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="bairro">Bairro</label>
            <input
              type="text"
              id="bairro"
              name="bairro"
              value={bairro}
              required
              onChange={(event) => setBairro(event.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor="cidade">Cidade</label>
            <input
              type="text"
              id="cidade"
              name="cidade"
              autoComplete="address-level2"
              value={cidade}
              required
              onChange={(event) => setCidade(event.target.value)}
            />
          </div>
        </div>
        <span className="hint">O CEP localiza as recomendações. O número da casa não aparece publicamente.</span>

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
        Já tem uma conta?{" "}
        <Link to="/login" state={{ from: redirectTo }}>
          Entrar
        </Link>
      </p>
    </AuthLayout>
  );
}
