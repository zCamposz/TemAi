import { Link } from "react-router-dom";
import Icon, { BrandMark } from "./Icon";

export default function AuthLayout({ headline, pitch, benefits, children }) {
  return (
    <div className="auth-page">
      <aside className="auth-side">
        <Link to="/" className="brand" aria-label="Tem Aí? — página inicial">
          <BrandMark />
          <span>
            Tem <em>Aí?</em>
          </span>
        </Link>

        <div className="auth-side-body">
          <h2>{headline}</h2>
          <p>{pitch}</p>
          <ul className="auth-benefits">
            {benefits.map((benefit) => (
              <li key={benefit.text}>
                <Icon name={benefit.icon} />
                {benefit.text}
              </li>
            ))}
          </ul>
        </div>

        <p className="auth-side-foot">Tem Aí? · Protótipo acadêmico — Engenharia de Software</p>
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          <Link to="/" className="back-home">
            <Icon name="arrowLeft" size="sm" />
            Voltar para o início
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}
