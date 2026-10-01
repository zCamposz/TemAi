import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import EcopontosMap from "../components/EcopontosMap";
import { useAuth } from "../components/AuthProvider";
import dados from "../data/ecopontos.json";
import { CATEGORIES, formatDistance } from "../data/catalog";
import { haversineKm, hasProfileOrigin, originFromProfile } from "../lib/geo";

const itensTemAi = (() => {
  const names = CATEGORIES.map((category) => category.name.toLowerCase());
  if (names.length < 2) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} e ${names.at(-1)}`;
})();

const normalize = (text) =>
  String(text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export default function Ecopontos() {
  const { profile } = useAuth();
  const origin = useMemo(
    () => (hasProfileOrigin(profile) ? originFromProfile(profile) : null),
    [profile]
  );
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  const points = useMemo(() => {
    const term = normalize(query.trim());
    const filtered = !term
      ? dados.pontos
      : dados.pontos.filter((point) =>
          normalize(
            [point.nome, point.endereco, point.distrito, point.subprefeitura, point.recebe, point.diferenciado].join(
              " "
            )
          ).includes(term)
        );

    if (!origin) return filtered;

    return filtered
      .map((point) => ({
        ...point,
        distance: point.lat == null || point.lng == null ? null : haversineKm(origin, point),
      }))
      .sort((a, b) => {
        if (a.distance == null && b.distance == null) return 0;
        if (a.distance == null) return 1;
        if (b.distance == null) return -1;
        return a.distance - b.distance;
      });
  }, [query, origin]);

  const groups = useMemo(() => {
    if (origin) return [["Mais próximos", points]];

    const buckets = new Map();
    for (const point of points) {
      const region = point.subprefeitura?.trim() || "Outras regiões";
      if (!buckets.has(region)) buckets.set(region, []);
      buckets.get(region).push(point);
    }
    return [...buckets.entries()].sort((a, b) => a[0].localeCompare(b[0], "pt-BR"));
  }, [points, origin]);

  const flat = useMemo(() => groups.flatMap(([, items]) => items), [groups]);

  const selected = useMemo(
    () => dados.pontos.find((point) => point.id === selectedId) ?? null,
    [selectedId]
  );

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  useEffect(() => {
    if (activeIndex > flat.length - 1) setActiveIndex(0);
  }, [activeIndex, flat.length]);

  useEffect(() => {
    if (!open || !flat[activeIndex]) return;
    document.getElementById(`ecoponto-opcao-${flat[activeIndex].id}`)?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex, flat]);

  function choose(id) {
    setSelectedId(id);
    setOpen(false);
  }

  function onKeyDown(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.min(index + 1, Math.max(flat.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && open && flat[activeIndex]) {
      event.preventDefault();
      choose(flat[activeIndex].id);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  let optionIndex = 0;

  return (
    <Layout>
      <section className="page-hero">
        <div className="container">
          <nav className="breadcrumb" aria-label="Trilha de navegação">
            <Link to="/">Início</Link>
            <span className="sep">/</span>
            <span>Ecopontos</span>
          </nav>
          <h1>Ecopontos de São Paulo</h1>
          <p>
            Pontos oficiais da Prefeitura para entregar entulho, móveis, poda e recicláveis. No Tem
            Aí, o aluguel cobre {itensTemAi}. Os dados vêm do GeoSampa (AMLURB), atualizados em{" "}
            {dados.atualizadoEm.split("-").reverse().join("/")}.
          </p>
        </div>
      </section>

      <section className="container ecopontos-page">
        <div className="ecopontos-picker" ref={rootRef}>
          <label htmlFor="ecoponto-busca">Escolher um ecoponto</label>
          <div className={open ? "ecopontos-combo open" : "ecopontos-combo"}>
            <input
              id="ecoponto-busca"
              ref={inputRef}
              className="input"
              type="search"
              role="combobox"
              aria-expanded={open}
              aria-controls="ecoponto-lista"
              aria-autocomplete="list"
              aria-activedescendant={open && flat[activeIndex] ? `ecoponto-opcao-${flat[activeIndex].id}` : undefined}
              value={query}
              placeholder="Nome, bairro ou material — ex.: gesso, Vila Mariana"
              onChange={(event) => {
                setQuery(event.target.value);
                setOpen(true);
                setActiveIndex(0);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={onKeyDown}
            />
            <span className="ecopontos-combo-count">
              {points.length}
            </span>
            <button
              type="button"
              className="ecopontos-combo-toggle"
              aria-label={open ? "Fechar lista de ecopontos" : "Abrir lista de ecopontos"}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setOpen((value) => !value)}
            >
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="M5 7.5 10 12.5 15 7.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {open ? (
              <div className="ecopontos-menu" id="ecoponto-lista" role="listbox" aria-label="Ecopontos">
                {flat.length === 0 ? (
                  <p className="ecopontos-empty">Nenhum ecoponto corresponde a essa busca.</p>
                ) : (
                  groups.map(([region, items]) => (
                    <div key={region} className="ecopontos-menu-group">
                      <p className="ecopontos-menu-region">{region}</p>
                      {items.map((point) => {
                        const index = optionIndex;
                        optionIndex += 1;
                        const active = index === activeIndex;
                        const isSelected = point.id === selectedId;
                        const nearby = Boolean(origin) && point.distance != null && index < 3;
                        return (
                          <button
                            key={point.id}
                            id={`ecoponto-opcao-${point.id}`}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            className={[
                              "ecopontos-option",
                              active || isSelected ? "active" : "",
                              nearby ? "nearby" : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                            onMouseEnter={() => setActiveIndex(index)}
                            onClick={() => choose(point.id)}
                          >
                            <strong>{point.nome.trim()}</strong>
                            <span>
                              {point.distrito}
                              {point.distance != null ? ` · ${formatDistance(point.distance)}` : ""}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            ) : null}
          </div>
        </div>

        <EcopontosMap
          points={points}
          selectedId={selectedId}
          origin={origin}
          onSelect={(id) => {
            setSelectedId(id);
            setOpen(false);
          }}
        />

        {selected ? (
          <article className="ecoponto-sheet" aria-live="polite">
            <div className="ecoponto-sheet-head">
              <div>
                <p className="ecoponto-sheet-kicker">
                  {selected.distrito} · {selected.subprefeitura}
                  {selected.distance != null ? ` · ${formatDistance(selected.distance)}` : ""}
                </p>
                <h2>{selected.nome.trim()}</h2>
              </div>
              <button type="button" className="ecoponto-sheet-clear" onClick={() => setSelectedId(null)}>
                Fechar
              </button>
            </div>
            <dl className="ecoponto-sheet-grid">
              <div>
                <dt>Endereço</dt>
                <dd>{selected.endereco}</dd>
              </div>
              <div>
                <dt>Horário</dt>
                <dd>{selected.horario}</dd>
              </div>
              <div>
                <dt>Recebe</dt>
                <dd>{selected.recebe}</dd>
              </div>
              {selected.diferenciado ? (
                <div>
                  <dt>Também recebe</dt>
                  <dd>{selected.diferenciado}</dd>
                </div>
              ) : null}
            </dl>
          </article>
        ) : (
          <p className="ecopontos-hint">
            Abra a lista ou toque um ponto no mapa. Os detalhes aparecem aqui, um ecoponto por vez.
          </p>
        )}

        <p className="map-note">
          Fonte: {dados.fonte}. Entrega gratuita para o morador, em geral até 1 m³ por vez. Horário
          e materiais podem mudar; confira no local.
        </p>
      </section>
    </Layout>
  );
}
