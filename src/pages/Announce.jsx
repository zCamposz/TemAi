import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import Icon from "../components/Icon";
import { useAuth } from "../components/AuthProvider";
import { useToast } from "../components/ToastProvider";
import { CATEGORIES, formatPrice } from "../data/catalog";
import { getAuthErrorMessage } from "../lib/authErrors";
import { isSupabaseConfigured } from "../lib/supabase";
import { geocodeCep } from "../lib/geo";
import { MAX_PHOTOS, saveProduct } from "../lib/products";

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

const EMPTY_FORM = {
  titulo: "",
  categoria: "",
  estado: "",
  descricao: "",
  marca: "",
  modelo: "",
  voltagem: "",
  preco: 25,
  descontoSemana: 15,
  caucao: 100,
  retirada: true,
  entregaRegiao: false,
  pontoEncontro: false,
  cep: "",
  bairro: "",
  cidade: "",
  lat: null,
  lng: null,
};

function formatCep(value) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export default function Announce() {
  const { user } = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const formRef = useRef(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [simDays, setSimDays] = useState(8);
  const [files, setFiles] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [draftId, setDraftId] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const estimate = Math.max(0, Number(form.preco) || 0) * Math.min(30, Math.max(0, simDays));
  const remainingSlots = MAX_PHOTOS - existingPhotos.length - files.length;

  const previews = useMemo(
    () => [
      ...existingPhotos.map((url) => ({ url, stored: true })),
      ...files.map((file) => ({ url: URL.createObjectURL(file), stored: false })),
    ],
    [existingPhotos, files]
  );

  useEffect(() => {
    return () => {
      previews.forEach((preview) => {
        if (!preview.stored) URL.revokeObjectURL(preview.url);
      });
    };
  }, [previews]);

  const setField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  function addFiles(list) {
    const incoming = [...list].filter((file) => file.type.startsWith("image/"));
    if (incoming.length === 0) return;
    setFiles((current) =>
      [...current, ...incoming].slice(0, MAX_PHOTOS - existingPhotos.length)
    );
  }

  function removePreview(index) {
    if (index < existingPhotos.length) {
      setExistingPhotos((current) => current.filter((_, i) => i !== index));
      return;
    }
    setFiles((current) => current.filter((_, i) => i !== index - existingPhotos.length));
  }

  async function lookupCep(raw) {
    const digits = raw.replace(/\D/g, "");
    if (digits.length !== 8) {
      setForm((current) => ({ ...current, lat: null, lng: null }));
      return;
    }
    try {
      const found = await geocodeCep(digits);
      if (!found) return;
      setForm((current) => ({
        ...current,
        bairro: found.bairro || current.bairro,
        cidade: found.cidade || current.cidade,
        lat: found.lat,
        lng: found.lng,
      }));
    } catch {
      /* geocodificação é opcional — o usuário ainda preenche à mão */
    }
  }

  function payloadFromForm() {
    return {
      titulo: form.titulo.trim(),
      categoria: form.categoria,
      estado: form.estado,
      descricao: form.descricao.trim(),
      marca: form.marca.trim(),
      modelo: form.modelo.trim(),
      voltagem: form.voltagem,
      preco_dia: Number(form.preco),
      desconto_semana: Number(form.descontoSemana) || 0,
      caucao: Number(form.caucao) || 0,
      retirada: form.retirada,
      entrega_regiao: form.entregaRegiao,
      ponto_encontro: form.pontoEncontro,
      cep: form.cep.trim(),
      bairro: form.bairro.trim(),
      cidade: form.cidade.trim(),
      lat: form.lat,
      lng: form.lng,
    };
  }

  async function persist(status) {
    setError("");

    if (!isSupabaseConfigured) {
      setError("Supabase não configurado. Verifique o arquivo .env.");
      return null;
    }

    if (!form.retirada && !form.entregaRegiao && !form.pontoEncontro) {
      setError("Escolha pelo menos uma opção de entrega.");
      return null;
    }

    setSaving(true);
    try {
      const product = await saveProduct({
        id: draftId,
        userId: user.id,
        payload: payloadFromForm(),
        files,
        existingPhotos,
        status,
      });

      setExistingPhotos(product.photos);
      setFiles([]);
      setDraftId(product.id);
      return product;
    } catch (err) {
      setError(getAuthErrorMessage(err));
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const product = await persist("publicado");
    if (!product) return;
    showToast("Anúncio publicado!", "Seu item já aparece na busca da comunidade.");
    navigate(`/produto/${product.slug}`);
  }

  async function handleDraft() {
    if (!formRef.current?.reportValidity()) return;
    const product = await persist("rascunho");
    if (!product) return;
    showToast("Rascunho salvo", "Você pode voltar depois e publicar quando quiser.");
  }

  return (
    <Layout>
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
        <form className="announce-form" ref={formRef} onSubmit={handleSubmit}>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <div className="form-card">
            <h2>
              <span className="step-num">1</span> Fotos do item
            </h2>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              hidden
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              className="dropzone"
              disabled={remainingSlots <= 0}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                addFiles(e.dataTransfer.files);
              }}
            >
              <Icon name="camera" />
              <strong>Arraste as fotos aqui ou clique para enviar</strong>
              <span>
                Até {MAX_PHOTOS} fotos · JPG, PNG ou WebP · A primeira será a capa do anúncio
              </span>
            </button>

            {previews.length > 0 && (
              <ul className="photo-grid">
                {previews.map((preview, index) => (
                  <li className="photo-preview" key={preview.url}>
                    <img src={preview.url} alt="" />
                    {index === 0 && <span className="cover-tag">Capa</span>}
                    <button
                      type="button"
                      className="photo-remove"
                      aria-label="Remover foto"
                      onClick={() => removePreview(index)}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

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
                value={form.titulo}
                onChange={(e) => setField("titulo", e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="categoria">Categoria</label>
                <select
                  id="categoria"
                  value={form.categoria}
                  onChange={(e) => setField("categoria", e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Selecione...
                  </option>
                  {CATEGORIES.map((category) => (
                    <option key={category.name} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="estado">Estado de conservação</label>
                <select
                  id="estado"
                  value={form.estado}
                  onChange={(e) => setField("estado", e.target.value)}
                  required
                >
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
                value={form.descricao}
                onChange={(e) => setField("descricao", e.target.value)}
                required
              />
            </div>

            <div className="form-row cols-3">
              <div className="form-field">
                <label htmlFor="marca">Marca</label>
                <input
                  type="text"
                  id="marca"
                  placeholder="Ex.: Bosch"
                  value={form.marca}
                  onChange={(e) => setField("marca", e.target.value)}
                />
              </div>
              <div className="form-field">
                <label htmlFor="modelo">Modelo</label>
                <input
                  type="text"
                  id="modelo"
                  placeholder="Ex.: GSB 550 RE"
                  value={form.modelo}
                  onChange={(e) => setField("modelo", e.target.value)}
                />
              </div>
              <div className="form-field">
                <label htmlFor="voltagem">Voltagem</label>
                <select
                  id="voltagem"
                  value={form.voltagem}
                  onChange={(e) => setField("voltagem", e.target.value)}
                >
                  <option value="">Selecione...</option>
                  <option>110 V</option>
                  <option>220 V</option>
                  <option>Bivolt</option>
                  <option>Bateria / não se aplica</option>
                </select>
              </div>
            </div>
          </div>

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
                    step="1"
                    placeholder="25"
                    value={form.preco}
                    onChange={(e) => setField("preco", e.target.value)}
                    required
                  />
                </div>
                <span className="hint">Sincronizado com o simulador ao lado</span>
              </div>
              <div className="form-field">
                <label htmlFor="descontoSemana">Desconto semanal</label>
                <div className="input-prefix">
                  <span className="prefix">%</span>
                  <input
                    type="number"
                    id="descontoSemana"
                    min="0"
                    max="90"
                    placeholder="15"
                    value={form.descontoSemana}
                    onChange={(e) => setField("descontoSemana", e.target.value)}
                  />
                </div>
                <span className="hint">Para aluguéis de 7+ dias</span>
              </div>
              <div className="form-field">
                <label htmlFor="caucao">Caução reembolsável</label>
                <div className="input-prefix">
                  <span className="prefix">R$</span>
                  <input
                    type="number"
                    id="caucao"
                    min="0"
                    placeholder="100"
                    value={form.caucao}
                    onChange={(e) => setField("caucao", e.target.value)}
                  />
                </div>
                <span className="hint">Devolvida após a entrega</span>
              </div>
            </div>

            <div className="form-field">
              <span className="field-legend">Opções de entrega</span>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={form.retirada}
                  onChange={(e) => setField("retirada", e.target.checked)}
                />{" "}
                Retirada no meu endereço
              </label>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={form.entregaRegiao}
                  onChange={(e) => setField("entregaRegiao", e.target.checked)}
                />{" "}
                Entrego na região (posso cobrar taxa)
              </label>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={form.pontoEncontro}
                  onChange={(e) => setField("pontoEncontro", e.target.checked)}
                />{" "}
                Ponto de encontro combinado
              </label>
            </div>
          </div>

          <div className="form-card">
            <h2>
              <span className="step-num">4</span> Localização
            </h2>

            <div className="form-row cols-3">
              <div className="form-field">
                <label htmlFor="cep">CEP</label>
                <input
                  type="text"
                  id="cep"
                  placeholder="04101-300"
                  inputMode="numeric"
                  value={form.cep}
                  onChange={(e) => {
                    const next = formatCep(e.target.value);
                    setField("cep", next);
                    lookupCep(next);
                  }}
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="bairro">Bairro</label>
                <input
                  type="text"
                  id="bairro"
                  placeholder="Vila Mariana"
                  value={form.bairro}
                  onChange={(e) => setField("bairro", e.target.value)}
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="cidade">Cidade</label>
                <input
                  type="text"
                  id="cidade"
                  placeholder="São Paulo"
                  value={form.cidade}
                  onChange={(e) => setField("cidade", e.target.value)}
                  required
                />
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
              onClick={handleDraft}
              disabled={saving}
            >
              {saving ? "Salvando…" : "Salvar rascunho"}
            </button>
            <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
              {saving ? "Publicando…" : "Publicar anúncio"}
              <Icon name="arrowRight" size="sm" />
            </button>
          </div>
        </form>

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
                  value={form.preco}
                  onChange={(e) => setField("preco", e.target.value)}
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
