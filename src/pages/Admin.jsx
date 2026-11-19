import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { useToast } from "../components/ToastProvider";
import { useAuth } from "../components/AuthProvider";
import {
  PRODUCT_STATUS_LABEL,
  fetchAdminProducts,
  fetchAdminProfiles,
  fetchAdminStats,
  setProductStatus,
  setUserAdmin,
  setUserVerified,
} from "../lib/admin";
import { formatPrice } from "../data/catalog";

function Icon({ children }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

const STAT_LABELS = [
  [
    "usuarios",
    "Usuários",
    <Icon key="u">
      <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="10" cy="7" r="4" />
      <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Icon>,
    "blue",
  ],
  [
    "verificados",
    "Verificados",
    <Icon key="v">
      <path d="M12 2 4 5v6c0 5 3.4 9.3 8 11 4.6-1.7 8-6 8-11V5l-8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </Icon>,
    "green",
  ],
  [
    "anuncios",
    "Anúncios",
    <Icon key="a">
      <path d="m21 8-9-5-9 5 9 5 9-5Z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </Icon>,
    "amber",
  ],
  [
    "publicados",
    "Publicados",
    <Icon key="p">
      <circle cx="12" cy="12" r="10" />
      <path d="m8 12 3 3 5-6" />
    </Icon>,
    "green",
  ],
  [
    "suspensos",
    "Suspensos",
    <Icon key="s">
      <circle cx="12" cy="12" r="10" />
      <path d="m4.9 4.9 14.2 14.2" />
    </Icon>,
    "red",
  ],
];

export default function Admin() {
  const showToast = useToast();
  const { user } = useAuth();
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

      <div className="container admin-layout">
        {error ? <p role="alert" className="admin-error">{error}</p> : null}

        {stats ? (
          <div className="admin-stats">
            {STAT_LABELS.map(([key, label, icon, tone]) => (
              <div key={key} className={`admin-stat tone-${tone}`}>
                <span className="admin-stat-icon" aria-hidden="true">{icon}</span>
                <div>
                  <strong>{stats[key]}</strong>
                  <span>{label}</span>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <section className="admin-panel">
          <div className="admin-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "anuncios"}
              className={tab === "anuncios" ? "admin-tab active" : "admin-tab"}
              onClick={() => setTab("anuncios")}
            >
              Anúncios <span className="admin-count">{products.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "usuarios"}
              className={tab === "usuarios" ? "admin-tab active" : "admin-tab"}
              onClick={() => setTab("usuarios")}
            >
              Usuários <span className="admin-count">{profiles.length}</span>
            </button>
          </div>

          {loading ? (
            <p className="admin-empty">Carregando…</p>
          ) : tab === "anuncios" ? (
            products.length === 0 ? (
              <p className="admin-empty">Nenhum anúncio cadastrado.</p>
            ) : (
              <ul className="listing-list">
                {products.map((p) => (
                  <li key={p.id} className="listing-row admin-row">
                    <div>
                      <h3>
                        <Link to={`/produto/${p.slug}`}>{p.titulo}</Link>
                      </h3>
                      <p>
                        {p.categoria} · {p.bairro}, {p.cidade} · {formatPrice(Number(p.preco_dia))}/dia
                      </p>
                      <p className="admin-meta">Locador: {p.owner_nome}</p>
                      <span className={`admin-badge status-${p.status}`}>
                        {PRODUCT_STATUS_LABEL[p.status] ?? p.status}
                      </span>
                    </div>
                    <div className="admin-actions">
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
                <li key={u.id} className="listing-row admin-row">
                  <span className="admin-avatar" aria-hidden="true">
                    {(u.nome || "?").trim().charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <h3>
                      {u.nome}
                      {u.is_admin ? <span className="admin-badge status-admin">Admin</span> : null}
                    </h3>
                    <p className="admin-meta">
                      {u.telefone || "Sem telefone"} · {u.anuncios}{" "}
                      {Number(u.anuncios) === 1 ? "anúncio" : "anúncios"}
                    </p>
                    <span className={`admin-badge ${u.verificado ? "status-publicado" : "status-rascunho"}`}>
                      {u.verificado ? "Verificado" : "Não verificado"}
                    </span>
                  </div>
                  <div className="admin-actions">
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
                    {u.id !== user?.id ? (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        disabled={busyId === u.id}
                        onClick={() => {
                          if (
                            u.is_admin &&
                            !window.confirm(`Remover ${u.nome} como administrador?`)
                          )
                            return;
                          run(
                            u.id,
                            () => setUserAdmin(u.id, !u.is_admin),
                            u.is_admin ? "Admin removido" : "Novo administrador",
                            u.nome
                          );
                        }}
                      >
                        {u.is_admin ? "Remover admin" : "Tornar admin"}
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Layout>
  );
}
