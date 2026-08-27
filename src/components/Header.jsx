import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import Icon, { BrandMark } from "./Icon";

const LINKS = [
  { to: "/", label: "Início", end: true },
  { to: "/explorar", label: "Explorar" },
  { to: "/#como-funciona", label: "Como funciona" },
  { to: "/#sustentabilidade", label: "Sustentabilidade" },
  { to: "/sobre", label: "Sobre o projeto" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navRef = useRef(null);
  const toggleRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [location]);

  useEffect(() => {
    if (!open) return undefined;
    const onClickOutside = (e) => {
      if (!navRef.current?.contains(e.target) && !toggleRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, [open]);

  // A página de detalhe do produto pertence ao fluxo de busca
  const exploreActive = location.pathname.startsWith("/produto");

  return (
    <header className={scrolled ? "site-header scrolled" : "site-header"}>
      <div className="container header-inner">
        <Link to="/" className="brand" aria-label="Tem Aí? — página inicial">
          <BrandMark />
          <span>
            Tem <em>Aí?</em>
          </span>
        </Link>

        <nav
          ref={navRef}
          className={open ? "main-nav open" : "main-nav"}
          aria-label="Navegação principal"
        >
          {LINKS.map((link) => {
            const isHashLink = link.to.includes("#");
            if (isHashLink) {
              return (
                <Link key={link.to} to={link.to}>
                  {link.label}
                </Link>
              );
            }
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  isActive || (link.to === "/explorar" && exploreActive) ? "active" : undefined
                }
              >
                {link.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="header-actions">
          <Link to="/login" className="btn btn-ghost">
            Entrar
          </Link>
          <Link to="/anunciar" className="btn btn-primary">
            <Icon name="plus" size="sm" />
            Anunciar item
          </Link>
          <button
            ref={toggleRef}
            type="button"
            className="nav-toggle"
            aria-label="Abrir menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name="menu" />
          </button>
        </div>
      </div>
    </header>
  );
}
