import { Link } from "react-router-dom";
import { BrandMark } from "./Icon";
import { TEAM } from "../data/catalog";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link to="/" className="brand">
              <BrandMark />
              <span>
                Tem <em>Aí?</em>
              </span>
            </Link>
            <p className="footer-about">
              Marketplace de economia circular e colaborativa para aluguel de bens de uso esporádico
              entre pessoas próximas.
            </p>
          </div>

          <div className="footer-col">
            <h4>Navegação</h4>
            <ul>
              <li>
                <Link to="/">Início</Link>
              </li>
              <li>
                <Link to="/explorar">Explorar itens</Link>
              </li>
              <li>
                <Link to="/anunciar">Anunciar item</Link>
              </li>
              <li>
                <Link to="/sobre">Sobre o projeto</Link>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Conta</h4>
            <ul>
              <li>
                <Link to="/login">Entrar</Link>
              </li>
              <li>
                <Link to="/cadastro">Criar conta</Link>
              </li>
              <li>
                <Link to="/#faq">Dúvidas frequentes</Link>
              </li>
              <li>
                <Link to="/#como-funciona">Como funciona</Link>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Compromisso</h4>
            <div className="footer-ods">
              <span className="ods-num">12</span>
              <p>Alinhado ao ODS 12 — Consumo e Produção Responsáveis, da Agenda 2030 da ONU.</p>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} Tem Aí? · Protótipo acadêmico de Engenharia de Software
          </span>
          <span className="team">{TEAM.map((member) => member.name).join(" · ")}</span>
        </div>
      </div>
    </footer>
  );
}
