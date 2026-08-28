import { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import Icon from "../components/Icon";
import { useToast } from "../components/ToastProvider";
import { CATEGORIES, formatPrice } from "../data/catalog";

const TIPS = [
  "Fotografe com luz natural e mostre o item de vários ângulos, incluindo acessórios.",
  "Informe marca, modelo e voltagem — anúncios completos aparecem melhor na busca.",
  "Pesquise itens parecidos na região para definir um preço competitivo.",
  "Responda rápido: locadores ágeis alugam até 3x mais.",
];

const PROTECTIONS = [
  "Pagamento garantido antes da retirada do item.",
  "Caução configurável para cobrir eventuais danos.",
  "Locatários com identidade verificada e histórico de avaliações.",
];

export default function Announce() {
  const showToast = useToast();
  const [simPrice, setSimPrice] = useState(25);
  const [simDays, setSimDays] = useState(8);

  const estimate = Math.max(0, simPrice) * Math.min(30, Math.max(0, simDays));

  return (
    <Layout note="Incremento 2 em andamento — cadastro de produtos com especificações detalhadas">
      <section className="page-hero">
        <div className="container">
          <nav className="breadcrumb" aria-label="Trilha de navegação">
            <Link to="/">Início</Link>
            <span className="sep">/</span>
            <span>Anunciar item</span>
          </nav>
          <h1>Anuncie um item</h1>
          <p>
            Quanto mais completo o anúncio, mais rápido ele é alugado. Leva menos de 5 minutos.
          </p>
        </div>
      </section>

      <div className="container announce-layout">
        <form
          className="announce-form"
          onSubmit={(e) => {
            e.preventDefault();
            showToast(
              "Anúncio enviado!",
              "No produto final, seu item entraria em revisão e ficaria visível na busca — parte do Incremento 2."
            );
          }}
        >
          {/* Fotos */}
          <div className="form-card">
            <h2>
              <span className="step-num">1</span> Fotos do item
            </h2>
            <button
              type="button"
              className="dropzone"
              onClick={() =>
                showToast(
                  "Upload de fotos",
                  "O envio de imagens faz parte do cadastro de produtos — Incremento 2."
                )
              }
            >
              <Icon name="camera" />
              <strong>Arraste as fotos aqui ou clique para enviar</strong>
              <span>Até 8 fotos · JPG ou PNG · A primeira será a capa do anúncio</span>
            </button>
          </div>

          {/* Detalhes */}
          <div className="form-card">
            <h2>
              <span className="step-num">2</span> Detalhes do item
            </h2>

            <div className="form-field">
              <label htmlFor="titulo">Título do anúncio</label>
              <input
                type="text"
                id="titulo"
                placeholder="Ex.: Furadeira de impacto Bosch GSB 550 RE"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="categoria">Categoria</label>
                <select id="categoria" defaultValue="" required>
                  <option value="" disabled>
                    Selecione...
                  </option>
                  {CATEGORIES.map((category) => (
                    <option key={category.name}>{category.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="estado">Estado de conservação</label>
                <select id="estado" defaultValue="" required>
                  <option value="" disabled>
                    Selecione...
                  </option>
                  <option>Novo (nunca usado)</option>
                  <option>Ótimo</option>
                  <option>Bom</option>
                  <option>Com marcas de uso</option>
                </select>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="descricao">Descrição</label>
              <textarea
                id="descricao"
                placeholder="Conte o que o item faz, o que acompanha (acessórios, maleta, manual) e em que situações ele é ideal."
                required
              />
            </div>

            <div className="form-row cols-3">
              <div className="form-field">
                <label htmlFor="marca">Marca</label>
                <input type="text" id="marca" placeholder="Ex.: Bosch" />
              </div>
              <div className="form-field">
                <label htmlFor="modelo">Modelo</label>
                <input type="text" id="modelo" placeholder="Ex.: GSB 550 RE" />
              </div>
              <div className="form-field">
                <label htmlFor="voltagem">Voltagem</label>
                <select id="voltagem" defaultValue="">
                  <option value="" disabled>
                    Selecione...
                  </option>
                  <option>110 V</option>
                  <option>220 V</option>
                  <option>Bivolt</option>
                  <option>Bateria / não se aplica</option>
                </select>
              </div>
            </div>
          </div>

          {/* Preço */}
          <div className="form-card">
            <h2>
              <span className="step-num">3</span> Preço e condições
            </h2>

            <div className="form-row cols-3">
              <div className="form-field">
                <label htmlFor="preco">Preço por dia</label>
                <div className="input-prefix">
                  <span className="prefix">R$</span>
                  <input
                    type="number"
                    id="preco"
                    min="1"
                    placeholder="25"
                    value={simPrice}
                    onChange={(e) => setSimPrice(Number(e.target.value))}
                    required
                  />
                </div>
                <span className="hint">Sincronizado com o simulador ao lado</span>
              </div>
              <div className="form-field">
                <label htmlFor="descontoSemana">Desconto semanal</label>
                <div className="input-prefix">
                  <span className="prefix">%</span>
                  <input type="number" id="descontoSemana" min="0" max="90" placeholder="15" />
                </div>
                <span className="hint">Para aluguéis de 7+ dias</span>
              </div>
              <div className="form-field">
                <label htmlFor="caucao">Caução reembolsável</label>
                <div className="input-prefix">
                  <span className="prefix">R$</span>
                  <input type="number" id="caucao" min="0" placeholder="100" />
                </div>
                <span className="hint">Devolvida após a entrega</span>
              </div>
            </div>

            <div className="form-field">
              <label>Opções de entrega</label>
              <label className="check-row">
                <input type="checkbox" defaultChecked /> Retirada no meu endereço
              </label>
              <label className="check-row">
                <input type="checkbox" /> Entrego na região (posso cobrar taxa)
              </label>
              <label className="check-row">
                <input type="checkbox" /> Ponto de encontro combinado
              </label>
            </div>
          </div>

          {/* Localização */}
          <div className="form-card">
            <h2>
              <span className="step-num">4</span> Localização
            </h2>

            <div className="form-row cols-3">
              <div className="form-field">
                <label htmlFor="cep">CEP</label>
                <input type="text" id="cep" placeholder="04101-300" inputMode="numeric" required />
              </div>
              <div className="form-field">
                <label htmlFor="bairro">Bairro</label>
                <input type="text" id="bairro" placeholder="Vila Mariana" required />
              </div>
              <div className="form-field">
                <label htmlFor="cidade">Cidade</label>
                <input type="text" id="cidade" placeholder="São Paulo" required />
              </div>
            </div>

            <div className="safety-note">
              <Icon name="pin" />
              <span>
                Seu endereço exato nunca aparece publicamente. Os interessados veem apenas o bairro e
                a distância aproximada — a localização precisa só é compartilhada após a reserva
                confirmada.
              </span>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() =>
                showToast(
                  "Rascunho salvo",
                  "No produto final, você poderia continuar o anúncio de onde parou."
                )
              }
            >
              Salvar rascunho
            </button>
            <button type="submit" className="btn btn-primary btn-lg">
              Publicar anúncio
              <Icon name="arrowRight" size="sm" />
            </button>
          </div>
        </form>

        {/* ============ LATERAL ============ */}
        <aside className="announce-aside">
          <div className="aside-card sim-card">
            <h3>
              <Icon name="dollar" />
              Simule seus ganhos
            </h3>
            <div className="sim-inputs">
              <div>
                <label htmlFor="simPrice">Preço/dia (R$)</label>
                <input
                  type="number"
                  id="simPrice"
                  min="1"
                  value={simPrice}
                  onChange={(e) => setSimPrice(Number(e.target.value))}
                />
              </div>
              <div>
                <label htmlFor="simDays">Dias alugados/mês</label>
                <input
                  type="number"
                  id="simDays"
                  min="1"
                  max="30"
                  value={simDays}
                  onChange={(e) => setSimDays(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="sim-result">
              <span>Renda extra estimada por mês</span>
              <strong>{formatPrice(estimate)}</strong>
            </div>
          </div>

          <div className="aside-card">
            <h3>
              <Icon name="zap" />
              Dicas de um bom anúncio
            </h3>
            <ul className="tips-list">
              {TIPS.map((tip) => (
                <li key={tip}>
                  <Icon name="star" size="sm" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <div className="aside-card">
            <h3>
              <Icon name="shield" />
              Você está protegido
            </h3>
            <ul className="tips-list">
              {PROTECTIONS.map((item) => (
                <li key={item}>
                  <Icon name="checkCircle" size="sm" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </Layout>
  );
}
