import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import SearchBar from "../components/SearchBar";
import ProductCard from "../components/ProductCard";
import Icon from "../components/Icon";
import { CATEGORIES, PRODUCTS } from "../data/catalog";

const PAGE_SIZE = 9;

const RATING_OPTIONS = [
  { label: "4,5+ ★", value: 4.5 },
  { label: "4,0+ ★", value: 4 },
  { label: "Todas", value: 0 },
];

const SORTERS = {
  proximos: (a, b) => a.distance - b.distance,
  menorPreco: (a, b) => a.price - b.price,
  maiorPreco: (a, b) => b.price - a.price,
  avaliacao: (a, b) => b.rating - a.rating,
  alugados: (a, b) => b.rentals - a.rentals,
};

/** Ignora acentos e caixa para a busca textual. */
const normalize = (text) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export default function Explore() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const place = searchParams.get("local") ?? "";
  const categoryParam = searchParams.get("categoria");

  const [categories, setCategories] = useState(() => (categoryParam ? [categoryParam] : []));
  const [maxDistance, setMaxDistance] = useState(5);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [onlyDelivery, setOnlyDelivery] = useState(false);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [sort, setSort] = useState("proximos");
  const [page, setPage] = useState(1);

  const resultsRef = useRef(null);

  useEffect(() => {
    setCategories(categoryParam ? [categoryParam] : []);
  }, [categoryParam]);

  const results = useMemo(() => {
    const term = normalize(query);

    const filtered = PRODUCTS.filter((product) => {
      if (term && !normalize(`${product.title} ${product.category}`).includes(term)) return false;
      if (categories.length > 0 && !categories.includes(product.category)) return false;
      if (product.distance > maxDistance) return false;
      if (priceMin !== "" && product.price < Number(priceMin)) return false;
      if (priceMax !== "" && product.price > Number(priceMax)) return false;
      if (product.rating < minRating) return false;
      if (onlyDelivery && !product.delivery) return false;
      if (onlyVerified && !product.owner.verified) return false;
      return true;
    });

    return filtered.sort(SORTERS[sort]);
  }, [query, categories, maxDistance, priceMin, priceMax, minRating, onlyDelivery, onlyVerified, sort]);

  // Qualquer mudança de filtro volta para a primeira página
  useEffect(() => {
    setPage(1);
  }, [query, categories, maxDistance, priceMin, priceMax, minRating, onlyDelivery, onlyVerified, sort]);

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = results.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const counts = useMemo(() => {
    const map = {};
    for (const product of PRODUCTS) {
      map[product.category] = (map[product.category] ?? 0) + 1;
    }
    return map;
  }, []);

  const toggleCategory = (name) => {
    setCategories((current) =>
      current.includes(name) ? current.filter((c) => c !== name) : [...current, name]
    );
  };

  const clearAll = () => {
    setCategories([]);
    setMaxDistance(25);
    setPriceMin("");
    setPriceMax("");
    setMinRating(0);
    setOnlyDelivery(false);
    setOnlyVerified(false);
  };

  const activeFilters = [
    { label: `até ${maxDistance} km`, clear: () => setMaxDistance(25), when: maxDistance < 25 },
    ...categories.map((name) => ({ label: name, clear: () => toggleCategory(name), when: true })),
    {
      label: minRating > 0 ? `${String(minRating).replace(".", ",")}+ ★` : "",
      clear: () => setMinRating(0),
      when: minRating > 0,
    },
    { label: "Com entrega", clear: () => setOnlyDelivery(false), when: onlyDelivery },
    { label: "Locadores verificados", clear: () => setOnlyVerified(false), when: onlyVerified },
    {
      label: priceMin !== "" ? `mín. R$ ${priceMin}` : "",
      clear: () => setPriceMin(""),
      when: priceMin !== "",
    },
    {
      label: priceMax !== "" ? `máx. R$ ${priceMax}` : "",
      clear: () => setPriceMax(""),
      when: priceMax !== "",
    },
  ].filter((filter) => filter.when);

  const scrollToResults = () => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <Layout note="a busca com geolocalização será entregue no Incremento 3 do projeto">
      <section className="page-hero">
        <div className="container">
          <nav className="breadcrumb" aria-label="Trilha de navegação">
            <Link to="/">Início</Link>
            <span className="sep">/</span>
            <span>Explorar</span>
          </nav>
          <h1>Explorar itens</h1>
          <p>Tudo o que a comunidade está compartilhando, ordenado pela distância até você.</p>

          <SearchBar
            initialQuery={query}
            initialPlace={place}
            placePlaceholder="Vila Mariana, São Paulo"
            className="explore-search"
          />
        </div>
      </section>

      <section className="container explore-layout">
        {/* ============ FILTROS ============ */}
        <aside>
          <div className="filters" aria-label="Filtros de busca">
            <div className="filter-group">
              <h4>Distância</h4>
              <div className="range-wrap">
                <input
                  type="range"
                  id="distRange"
                  min="1"
                  max="25"
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(Number(e.target.value))}
                  aria-label="Distância máxima em quilômetros"
                />
                <div className="range-label">
                  <span>Raio de busca</span>
                  <output htmlFor="distRange">até {maxDistance} km</output>
                </div>
              </div>
            </div>

            <div className="filter-group">
              <h4>Categoria</h4>
              {CATEGORIES.filter((category) => counts[category.name]).map((category) => (
                <label className="check-row" key={category.name}>
                  <input
                    type="checkbox"
                    checked={categories.includes(category.name)}
                    onChange={() => toggleCategory(category.name)}
                  />
                  {category.name}
                  <span className="count">{counts[category.name]}</span>
                </label>
              ))}
            </div>

            <div className="filter-group">
              <h4>Preço por dia</h4>
              <div className="price-inputs">
                <input
                  type="number"
                  placeholder="Mín. R$"
                  min="0"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  aria-label="Preço mínimo"
                />
                <input
                  type="number"
                  placeholder="Máx. R$"
                  min="0"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  aria-label="Preço máximo"
                />
              </div>
            </div>

            <div className="filter-group">
              <h4>Avaliação</h4>
              <div className="stars-filter">
                {RATING_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option.label}
                    className={minRating === option.value ? "chip active" : "chip"}
                    onClick={() => setMinRating(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={onlyDelivery}
                  onChange={(e) => setOnlyDelivery(e.target.checked)}
                />
                Apenas itens com entrega
              </label>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={onlyVerified}
                  onChange={(e) => setOnlyVerified(e.target.checked)}
                />
                Locadores verificados
              </label>
            </div>

            <button type="button" className="btn btn-primary btn-block" onClick={scrollToResults}>
              Ver {results.length} {results.length === 1 ? "item" : "itens"}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-block"
              style={{ marginTop: "-14px" }}
              onClick={clearAll}
            >
              Limpar tudo
            </button>
          </div>

          <div className="map-teaser" style={{ marginTop: 20 }}>
            <div className="map-canvas" aria-hidden="true">
              <svg viewBox="0 0 280 150" preserveAspectRatio="xMidYMid slice">
                <rect width="280" height="150" fill="#e6efe7" />
                <rect x="18" y="18" width="52" height="34" rx="4" fill="#d9e7db" />
                <rect x="196" y="96" width="60" height="38" rx="4" fill="#d9e7db" />
                <rect x="118" y="10" width="44" height="26" rx="4" fill="#d9e7db" />
                <circle cx="52" cy="118" r="26" fill="#cde3d0" />
                <path d="M0 62 C60 56 96 80 146 74 S232 48 280 62" stroke="#fff" strokeWidth="9" fill="none" />
                <path d="M36 150 C48 104 76 84 96 44 S116 12 124 0" stroke="#fff" strokeWidth="6" fill="none" />
                <path d="M0 112 C84 106 156 126 280 110" stroke="#fff" strokeWidth="7" fill="none" />
                <path d="M186 0 C180 52 194 94 232 150" stroke="#fff" strokeWidth="6" fill="none" />
                <circle cx="140" cy="74" r="16" fill="#137a50" opacity="0.15" />
                <circle cx="140" cy="74" r="6" fill="#137a50" stroke="#fff" strokeWidth="2.5" />
                <circle cx="78" cy="52" r="5" fill="#137a50" stroke="#fff" strokeWidth="2" />
                <circle cx="212" cy="52" r="5" fill="#137a50" stroke="#fff" strokeWidth="2" />
                <circle cx="98" cy="116" r="5" fill="#137a50" stroke="#fff" strokeWidth="2" />
                <circle cx="238" cy="106" r="5" fill="#f4b942" stroke="#fff" strokeWidth="2" />
                <circle cx="176" cy="118" r="5" fill="#137a50" stroke="#fff" strokeWidth="2" />
              </svg>
            </div>
            <p className="map-note">
              <strong>Busca no mapa em breve:</strong> a filtragem por geolocalização, com raio de
              proximidade entre locador e locatário, chega no Incremento 3.
            </p>
          </div>
        </aside>

        {/* ============ RESULTADOS ============ */}
        <div ref={resultsRef}>
          <div className="explore-toolbar">
            <p>
              Mostrando{" "}
              <strong>
                {visible.length} de {results.length} {results.length === 1 ? "item" : "itens"}
              </strong>{" "}
              {query ? `para "${query}" ` : ""}
              perto de {place || "Vila Mariana, São Paulo"}
            </p>
            <label className="sort-select">
              Ordenar por
              <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Ordenar resultados">
                <option value="proximos">Mais próximos</option>
                <option value="menorPreco">Menor preço</option>
                <option value="maiorPreco">Maior preço</option>
                <option value="avaliacao">Melhor avaliação</option>
                <option value="alugados">Mais alugados</option>
              </select>
            </label>
          </div>

          {activeFilters.length > 0 && (
            <div className="active-filters">
              {activeFilters.map((filter) => (
                <button type="button" className="chip active" key={filter.label} onClick={filter.clear}>
                  {filter.label} ✕
                </button>
              ))}
            </div>
          )}

          {visible.length > 0 ? (
            <div className="product-grid cols-3">
              {visible.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Icon name="search" size="lg" />
              <h3>Nenhum item encontrado</h3>
              <p>
                Tente aumentar o raio de busca, remover alguns filtros ou pesquisar por outro termo.
              </p>
              <button type="button" className="btn btn-outline" onClick={clearAll}>
                Limpar filtros
              </button>
            </div>
          )}

          {totalPages > 1 && (
            <nav className="pagination" aria-label="Paginação de resultados">
              <button
                type="button"
                className="page-btn"
                aria-label="Página anterior"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
              >
                <Icon name="chevronLeft" size="sm" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                <button
                  type="button"
                  key={number}
                  className={number === currentPage ? "page-btn current" : "page-btn"}
                  aria-current={number === currentPage ? "page" : undefined}
                  onClick={() => setPage(number)}
                >
                  {number}
                </button>
              ))}

              <button
                type="button"
                className="page-btn"
                aria-label="Próxima página"
                disabled={currentPage === totalPages}
                onClick={() => setPage(currentPage + 1)}
              >
                <Icon name="chevronRight" size="sm" />
              </button>
            </nav>
          )}
        </div>
      </section>
    </Layout>
  );
}
