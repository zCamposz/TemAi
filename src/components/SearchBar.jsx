import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "./Icon";

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

  const handleSubmit = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (place.trim()) params.set("local", place.trim());
    navigate(`/explorar${params.toString() ? `?${params}` : ""}`);
  };

  return (
    <form className={`search-bar ${className}`.trim()} onSubmit={handleSubmit} role="search">
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
      </div>

      <button type="submit" className={large ? "btn btn-primary btn-lg" : "btn btn-primary"}>
        Buscar
      </button>
    </form>
  );
}
