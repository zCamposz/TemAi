import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import SearchBar from "../components/SearchBar";
import ProductCard from "../components/ProductCard";
import ResultsMap from "../components/ResultsMap";
import Icon from "../components/Icon";
import { CATEGORIES } from "../data/catalog";
import { fetchNearbyDistances, useMergedProducts } from "../lib/products";
import {
  DEFAULT_ORIGIN,
  geocodePlace,
  getBrowserLocation,
  parseOriginParams,
  withDistance,
} from "../lib/geo";

const PAGE_SIZE = 9;

const RATING_OPTIONS = [
  { label: "4,5+ ★", value: 4.5 },
  { label: "4,0+ ★", value: 4 },
  { label: "Todas", value: 0 },
];

const SORTERS = {
  proximos: (a, b) => (a.distance ?? Number.POSITIVE_INFINITY) - (b.distance ?? Number.POSITIVE_INFINITY),
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
  const { products, loading } = useMergedProducts();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const placeParam = searchParams.get("local") ?? "";
  const categoryParam = searchParams.get("categoria");

  const [origin, setOrigin] = useState(() => parseOriginParams(searchParams) || DEFAULT_ORIGIN);
  const [originStatus, setOriginStatus] = useState("");
  const [locating, setLocating] = useState(false);
  const [rpcDistances, setRpcDistances] = useState(null);
  const [selectedSlug, setSelectedSlug] = useState(null);

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

  useEffect(() => {
    const fromParams = parseOriginParams(searchParams);
    if (fromParams) {
      setOrigin(fromParams);
      setOriginStatus("");
      return undefined;
    }

    const local = placeParam.trim();
    if (!local || local === DEFAULT_ORIGIN.label) {
      setOrigin(DEFAULT_ORIGIN);
      setOriginStatus("");
      return undefined;
    }

    let cancelled = false;
    setOriginStatus("Localizando o endereço…");

    geocodePlace(local).then((found) => {
      if (cancelled) return;
      if (found) {
        setOrigin(found);
        setOriginStatus("");
      } else {
        setOrigin(DEFAULT_ORIGIN);
        setOriginStatus("Não encontramos esse local. Mostrando perto de Vila Mariana.");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [searchParams, placeParam]);

  useEffect(() => {
    if (!origin) return undefined;
    let cancelled = false;

    fetchNearbyDistances(origin, maxDistance)
      .then((map) => {
        if (!cancelled) setRpcDistances(map);
      })
      .catch(() => {
        if (!cancelled) setRpcDistances(null);
      });

    return () => {
      cancelled = true;
    };
  }, [origin, maxDistance]);

  const locatedProducts = useMemo(() => {
    const withGeo = withDistance(products, origin);
    if (!rpcDistances) return withGeo;
    return withGeo.map((product) =>
      rpcDistances.has(product.id) ? { ...product, distance: rpcDistances.get(product.id) } : product
    );
  }, [products, origin, rpcDistances]);

  const results = useMemo(() => {
    const term = normalize(query);

    const filtered = locatedProducts.filter((product) => {
      if (term && !normalize(`${product.title} ${product.category}`).includes(term)) return false;
      if (categories.length > 0 && !categories.includes(product.category)) return false;
      if (product.distance != null && product.distance > maxDistance) return false;
      if (priceMin !== "" && product.price < Number(priceMin)) return false;
      if (priceMax !== "" && product.price > Number(priceMax)) return false;
      if (product.rating < minRating) return false;
      if (onlyDelivery && !product.delivery) return false;
      if (onlyVerified && !product.owner.verified) return false;
      return true;
    });

    return filtered.sort(SORTERS[sort]);
  }, [
    locatedProducts,
    query,
    categories,
    maxDistance,
    priceMin,
    priceMax,
    minRating,
    onlyDelivery,
    onlyVerified,
    sort,
  ]);

  useEffect(() => {
    setPage(1);
  }, [query, categories, maxDistance, priceMin, priceMax, minRating, onlyDelivery, onlyVerified, sort, origin]);

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = results.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const mapped = results.filter((product) => product.lat != null && product.lng != null);
  const placeLabel = origin?.label || placeParam || DEFAULT_ORIGIN.label;

  const counts = useMemo(() => {
    const map = {};
    for (const product of locatedProducts) {
      map[product.category] = (map[product.category] ?? 0) + 1;
    }
    return map;
  }, [locatedProducts]);

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

  const handleLocate = async () => {
    setLocating(true);
    setOriginStatus("");
    try {
      const found = await getBrowserLocation();
      setOrigin(found);
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.set("lat", found.lat.toFixed(6));
          next.set("lng", found.lng.toFixed(6));
          next.set("local", found.label);
          return next;
        },
        { replace: true }
      );
    } catch (error) {
      setOriginStatus(error.message || "Não foi possível obter sua localização.");
    } finally {
      setLocating(false);
    }
  };

  const handleSelectPin = (slug) => {
    setSelectedSlug(slug);
    navigate(`/produto/${slug}`);
  };

  return (
    <Layout note="Incremento 3 — busca por proximidade, raio configurável e mapa de resultados">
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
            initialPlace={placeParam || origin?.label || ""}
            placePlaceholder="Vila Mariana, São Paulo"
            className="explore-search"
          />

          <div className="origin-bar">
            <button type="button" className="btn btn-outline btn-sm" onClick={handleLocate} disabled={locating}>
              <Icon name="locate" size="sm" />
              {locating ? "Obtendo localização…" : "Usar minha localização"}
            </button>
            {originStatus ? <p className="origin-status">{originStatus}</p> : null}
          </div>
        </div>
      </section>

      <section className="container explore-layout">
        <aside className="explore-aside">
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

          <div className="map-teaser">
            <ResultsMap
              origin={origin}
              products={mapped}
              selectedSlug={selectedSlug}
              onSelect={handleSelectPin}
            />
            <p className="map-note">
              <strong>Mapa dos resultados:</strong> o ponto amarelo é a origem da busca; os verdes
              são anúncios dentro do raio de {maxDistance} km. O pin usa o CEP, não o endereço da
              casa.
            </p>
          </div>
        </aside>

        <div ref={resultsRef}>
          <div className="explore-toolbar">
            <p>
              Mostrando{" "}
              <strong>
                {visible.length} de {results.length} {results.length === 1 ? "item" : "itens"}
              </strong>{" "}
              {query ? `para "${query}" ` : ""}
              perto de {placeLabel}
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

          {loading ? (
            <div className="empty-state">
              <p>Carregando itens…</p>
            </div>
          ) : visible.length > 0 ? (
            <div className="product-grid cols-3">
              {visible.map((product) => (
                <div id={`item-${product.slug}`} key={product.slug}>
                  <ProductCard product={product} />
                </div>
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
