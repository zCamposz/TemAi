import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { useToast } from "../components/ToastProvider";
import {
  PRODUCT_STATUS_LABEL,
  fetchAdminProducts,
  fetchAdminProfiles,
  fetchAdminStats,
  setProductStatus,
  setUserVerified,
} from "../lib/admin";
import { formatPrice } from "../data/catalog";

const STATUS_COLOR = {
  publicado: "#137a50",
  rascunho: "#6b7c76",
  suspenso: "#d14d3f",
};

const STAT_LABELS = [
  ["usuarios", "Usuários"],
  ["verificados", "Verificados"],
  ["anuncios", "Anúncios"],
  ["publicados", "Publicados"],
  ["suspensos", "Suspensos"],
];

export default function Admin() {
  const showToast = useToast();
  const [tab, setTab] = useState("anuncios");
  const [stats, setStats] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const [s, pr, pd] = await Promise.all([
        fetchAdminStats(),
        fetchAdminProfiles(),
        fetchAdminProducts(),
      ]);
      setStats(s);
      setProfiles(pr ?? []);
      setProducts(pd ?? []);
      setError("");
    } catch (err) {
      setError(err.message || "Não foi possível carregar o painel.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function run(id, action, title, message) {
    setBusyId(id);
    try {
      await action();
      await load();
      showToast(title, message);
    } catch (err) {
      showToast("Ação não concluída", err.message || "Tente novamente.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Layout>
      <section className="page-hero">
        <div className="container">
          <nav className="breadcrumb" aria-label="Trilha de navegação">
            <Link to="/">Início</Link>
            <span className="sep">/</span>
            <span>Painel administrativo</span>
          </nav>
          <h1>Painel administrativo</h1>
          <p>Verifique locadores e modere os anúncios da plataforma.</p>
        </div>
      </section>

      <div className="container profile-layout">
        <section className="form-card">
          {error ? <p role="alert">{error}</p> : null}

          {stats ? (
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
              {STAT_LABELS.map(([key, label]) => (
                <div key={key} style={{ minWidth: 110 }}>
                  <strong style={{ fontSize: 24 }}>{stats[key]}</strong>
                  <p style={{ color: "var(--muted)", fontSize: 13 }}>{label}</p>
                </div>
              ))}
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <button
              type="button"
              className={tab === "anuncios" ? "chip active" : "chip"}
              onClick={() => setTab("anuncios")}
            >
              Anúncios ({products.length})
            </button>
            <button
              type="button"
              className={tab === "usuarios" ? "chip active" : "chip"}
              onClick={() => setTab("usuarios")}
            >
              Usuários ({profiles.length})
            </button>
          </div>

          {loading ? (
            <p style={{ color: "var(--muted)" }}>Carregando…</p>
          ) : tab === "anuncios" ? (
            products.length === 0 ? (
              <p style={{ color: "var(--muted)" }}>Nenhum anúncio cadastrado.</p>
            ) : (
              <ul className="listing-list">
                {products.map((p) => (
                  <li
                    key={p.id}
                    className="listing-row admin-row"
                  >
                    <div>
                      <h3>
                        <Link to={`/produto/${p.slug}`}>{p.titulo}</Link>
                      </h3>
                      <p>
                        {p.categoria} · {p.bairro}, {p.cidade} · {formatPrice(Number(p.preco_dia))}/dia
                      </p>
                      <p style={{ color: "var(--muted)", fontSize: 13 }}>Locador: {p.owner_nome}</p>
                      <span
                        style={{
                          display: "inline-block",
                          marginTop: 8,
                          color: STATUS_COLOR[p.status],
                          border: `1.5px solid ${STATUS_COLOR[p.status]}`,
                          borderRadius: 999,
                          padding: "2px 10px",
                          fontSize: 12.5,
                          fontWeight: 600,
                        }}
                      >
                        {PRODUCT_STATUS_LABEL[p.status] ?? p.status}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {p.status === "suspenso" ? (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={busyId === p.id}
                          onClick={() =>
                            run(
                              p.id,
                              () => setProductStatus(p.id, "publicado"),
                              "Anúncio reativado",
                              "Ele voltou a aparecer na busca."
                            )
                          }
                        >
                          Reativar
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          disabled={busyId === p.id}
                          onClick={() =>
                            run(
                              p.id,
                              () => setProductStatus(p.id, "suspenso"),
                              "Anúncio suspenso",
                              "Ele saiu da busca e o dono não pode reativar."
                            )
                          }
                        >
                          Suspender
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )
          ) : (
            <ul className="listing-list">
              {profiles.map((u) => (
                <li
                  key={u.id}
                  className="listing-row admin-row"
                >
                  <div>
                    <h3>
                      {u.nome}
                      {u.is_admin ? " · admin" : ""}
                    </h3>
                    <p style={{ color: "var(--muted)", fontSize: 13 }}>
                      {u.telefone || "Sem telefone"} · {u.anuncios}{" "}
                      {Number(u.anuncios) === 1 ? "anúncio" : "anúncios"} · {u.verificado ? "Verificado" : "Não verificado"}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={u.verificado ? "btn btn-outline btn-sm" : "btn btn-primary btn-sm"}
                    disabled={busyId === u.id}
                    onClick={() =>
                      run(
                        u.id,
                        () => setUserVerified(u.id, !u.verificado),
                        u.verificado ? "Verificação removida" : "Locador verificado",
                        u.nome
                      )
                    }
                  >
                    {u.verificado ? "Remover verificação" : "Verificar"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Layout>
  );
}
