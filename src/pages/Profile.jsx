import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Icon from "../components/Icon";
import { useAuth } from "../components/AuthProvider";
import { useToast } from "../components/ToastProvider";
import { formatPrice } from "../data/catalog";
import { getAuthErrorMessage, getInitials } from "../lib/authErrors";
import { geocodeCep, hasProfileOrigin, isUsableCoord } from "../lib/geo";
import { fetchMyProducts } from "../lib/products";

export default function Profile() {
  const { user, profile, signOut, updateProfile } = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cep, setCep] = useState("");
  const [logradouro, setLogradouro] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [cepStatus, setCepStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(true);

  const displayName = profile?.nome ?? user?.user_metadata?.nome ?? "Usuário";

  useEffect(() => {
    if (profile) {
      setNome(profile.nome ?? "");
      setTelefone(profile.telefone ?? "");
      setCep(profile.cep ?? "");
      setLogradouro(profile.logradouro ?? "");
      setNumero(profile.numero ?? "");
      setBairro(profile.bairro ?? "");
      setCidade(profile.cidade ?? "");
    }
  }, [profile]);

  useEffect(() => {
    if (!user?.id) return undefined;
    let mounted = true;

    (async () => {
      try {
        const mine = await fetchMyProducts(user.id);
        if (mounted) setListings(mine);
      } catch {
        if (mounted) setListings([]);
      } finally {
        if (mounted) setListingsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const savedOrigin = hasProfileOrigin(profile);

  async function lookupCep(raw) {
    const digits = raw.replace(/\D/g, "");
    if (digits.length !== 8) {
      setCepStatus("");
      return;
    }

    setCepStatus("Buscando CEP…");
    try {
      const found = await geocodeCep(digits);
      if (!found || !isUsableCoord(found.lat, found.lng)) {
        setCepStatus("Não foi possível localizar esse CEP.");
        return;
      }
      setLogradouro(found.logradouro || "");
      setBairro(found.bairro || "");
      setCidade(found.cidade || "");
      setCepStatus("");
    } catch {
      setCepStatus("Não foi possível localizar esse CEP.");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const endereco = {
      cep: cep.replace(/\D/g, ""),
      logradouro: logradouro.trim(),
      numero: numero.trim(),
      bairro: bairro.trim(),
      cidade: cidade.trim(),
    };
    const touched = Object.values(endereco).some(Boolean);

    if (!savedOrigin && !touched) {
      setSaving(true);
      try {
        await updateProfile({ nome: nome.trim(), telefone: telefone.trim() });
        showToast("Perfil atualizado", "Suas informações foram salvas com sucesso.");
      } catch (err) {
        setError(getAuthErrorMessage(err));
      } finally {
        setSaving(false);
      }
      return;
    }

    if (!endereco.cep || !endereco.logradouro || !endereco.numero || !endereco.bairro || !endereco.cidade) {
      setError("Preencha CEP, logradouro, número, bairro e cidade.");
      return;
    }

    setSaving(true);
    try {
      const found = await geocodeCep(endereco.cep);
      if (!found || !isUsableCoord(found.lat, found.lng)) {
        setError("Não foi possível localizar esse CEP. O endereço não foi salvo.");
        return;
      }

      await updateProfile({
        nome: nome.trim(),
        telefone: telefone.trim(),
        endereco: {
          ...endereco,
          lat: found.lat,
          lng: found.lng,
        },
      });
      showToast("Perfil atualizado", "Endereço e coordenadas foram salvos.");
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
          <p>Gerencie seus dados de conta e os anúncios que você publicou.</p>
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

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="perfil-cep">CEP</label>
              <input
                id="perfil-cep"
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="00000-000"
                value={cep}
                required={savedOrigin}
                onChange={(event) => {
                  const next = event.target.value;
                  setCep(next);
                  lookupCep(next);
                }}
              />
            </div>
            <div className="form-field">
              <label htmlFor="perfil-numero">Número</label>
              <input
                id="perfil-numero"
                type="text"
                autoComplete="address-line2"
                value={numero}
                required={savedOrigin}
                onChange={(event) => setNumero(event.target.value)}
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="perfil-logradouro">Logradouro</label>
            <input
              id="perfil-logradouro"
              type="text"
              autoComplete="address-line1"
              value={logradouro}
              required={savedOrigin}
              onChange={(event) => setLogradouro(event.target.value)}
            />
            {cepStatus ? <span className="hint">{cepStatus}</span> : null}
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="perfil-bairro">Bairro</label>
              <input
                id="perfil-bairro"
                type="text"
                value={bairro}
                required={savedOrigin}
                onChange={(event) => setBairro(event.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="perfil-cidade">Cidade</label>
              <input
                id="perfil-cidade"
                type="text"
                autoComplete="address-level2"
                value={cidade}
                required={savedOrigin}
                onChange={(event) => setCidade(event.target.value)}
              />
            </div>
          </div>
          <span className="hint">
            {savedOrigin
              ? "Esse endereço só você vê. Ele define a origem das recomendações."
              : "Opcional por enquanto. Quando você salvar o endereço completo, ele vira a origem das recomendações."}
          </span>

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

        <section className="form-card">
          <h2>Meus anúncios</h2>
          {listingsLoading ? (
            <p style={{ color: "var(--muted)" }}>Carregando anúncios…</p>
          ) : listings.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>
              Você ainda não anunciou nenhum item.{" "}
              <Link to="/anunciar">Publicar o primeiro anúncio</Link>
            </p>
          ) : (
            <ul className="listing-list">
              {listings.map((item) => (
                <li key={item.id}>
                  <Link className="listing-row" to={`/produto/${item.slug}`}>
                    {item.photos?.[0] ? (
                      <img src={item.photos[0]} alt="" />
                    ) : (
                      <span className={`listing-thumb ${item.hue}`}>
                        <Icon name={item.icon} />
                      </span>
                    )}
                    <div>
                      <h3>{item.title}</h3>
                      <p>
                        {item.status === "publicado" ? "Publicado" : "Rascunho"} ·{" "}
                        {formatPrice(item.price)}/dia · {item.neighborhood}
                      </p>
                    </div>
                    <span className="btn btn-outline btn-sm">Ver</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Layout>
  );
}
