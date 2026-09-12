import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "./Icon";
import { getBrowserLocation } from "../lib/geo";

export default function SearchBar({
  initialQuery = "",
  initialPlace = "",
  queryPlaceholder = "O que você precisa?",
  placePlaceholder = "Perto de onde?",
  large = false,
  className = "",
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState(initialQuery);
  const [place, setPlace] = useState(initialPlace);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState("");

  const goExplore = (extra = {}) => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    const label = extra.local ?? place.trim();
    if (label) params.set("local", label);
    if (extra.lat != null && extra.lng != null) {
      params.set("lat", Number(extra.lat).toFixed(6));
      params.set("lng", Number(extra.lng).toFixed(6));
    }
    navigate(`/explorar${params.toString() ? `?${params}` : ""}`);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    goExplore();
  };

  const handleLocate = async () => {
    setLocateError("");
    setLocating(true);
    try {
      const origin = await getBrowserLocation();
      setPlace(origin.label);
      goExplore({ local: origin.label, lat: origin.lat, lng: origin.lng });
    } catch (error) {
      setLocateError(error.message || "Não foi possível obter sua localização.");
    } finally {
      setLocating(false);
    }
  };

  return (
    <div className={`search-bar-wrap ${className}`.trim()}>
    <form className="search-bar" onSubmit={handleSubmit} role="search">
      <div className="search-field">
        <Icon name="search" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={queryPlaceholder}
          aria-label="O que você precisa?"
        />
      </div>

      <div className="search-divider" aria-hidden="true" />

      <div className="search-field">
        <Icon name="pin" />
        <input
          type="text"
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          placeholder={placePlaceholder}
          aria-label="Perto de onde?"
        />
        <button
          type="button"
          className="search-locate"
          onClick={handleLocate}
          disabled={locating}
          aria-label="Usar minha localização"
          title="Usar minha localização"
        >
          <Icon name="locate" size="sm" />
        </button>
      </div>

      <button type="submit" className={large ? "btn btn-primary btn-lg" : "btn btn-primary"}>
        Buscar
      </button>
    </form>
    {locateError ? <p className="search-locate-error">{locateError}</p> : null}
    </div>
  );
}
