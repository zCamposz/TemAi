import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "./Icon";
import { formatDistance, formatPrice, formatRating } from "../data/catalog";

export default function ProductCard({ product }) {
  const [favorite, setFavorite] = useState(false);
  const href = `/produto/${product.slug}`;

  return (
    <article className="product-card">
      <Link className={`card-media ${product.hue}`} to={href} aria-label={`Ver ${product.title}`}>
        {product.badge && <span className="card-badge">{product.badge}</span>}
        <span className="media-icon">
          <Icon name={product.icon} size="lg" />
        </span>
      </Link>

      <button
        type="button"
        className={favorite ? "fav-btn active" : "fav-btn"}
        aria-label={favorite ? "Remover dos favoritos" : "Favoritar item"}
        aria-pressed={favorite}
        onClick={() => setFavorite((v) => !v)}
      >
        <Icon name="heart" size="sm" />
      </button>

      <div className="card-body">
        <div className="card-top">
          <span className="card-cat">{product.category}</span>
          <span className="card-rating">
            <Icon name="star" size="sm" />
            {formatRating(product.rating)} ({product.reviews})
          </span>
        </div>

        <h3>
          <Link to={href}>{product.title}</Link>
        </h3>

        <p className="card-loc">
          <Icon name="pin" size="sm" />
          {product.neighborhood} · {formatDistance(product.distance)}
        </p>

        <div className="card-foot">
          <span className="price">
            {formatPrice(product.price)}
            <small>/dia</small>
          </span>
          <Link className="btn btn-outline btn-sm" to={href}>
            Alugar
          </Link>
        </div>
      </div>
    </article>
  );
}
