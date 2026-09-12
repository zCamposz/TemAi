import { useEffect, useState } from "react";
import { CATEGORIES, PRODUCTS } from "../data/catalog";
import { DEFAULT_ORIGIN, withDistance } from "./geo";
import { getInitials } from "./authErrors";
import { isSupabaseConfigured, supabase } from "./supabase";

const PHOTO_BUCKET = "product-photos";
const MAX_PHOTOS = 8;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const CACHE_TTL_MS = 15_000;

const PRODUCT_SELECT = `
  *,
  profiles:owner_id (
    nome,
    verificado,
    avatar_url,
    created_at
  )
`;

let publishedCache = null;
let publishedCacheAt = 0;

export function invalidateProductCache() {
  publishedCache = null;
  publishedCacheAt = 0;
}

export function slugify(text) {
  const base = (text ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 56);

  return base || "item";
}

export function uniqueSlug(title) {
  const suffix = crypto.randomUUID().slice(0, 8);
  return `${slugify(title)}-${suffix}`;
}

function categoryMeta(name) {
  return CATEGORIES.find((category) => category.name === name);
}

function splitDescription(text) {
  const parts = (text ?? "")
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : ["Sem descrição."];
}

function buildSpecs(row) {
  const marcaModelo = [row.marca, row.modelo].filter(Boolean).join(" ");
  const specs = [];

  if (marcaModelo) specs.push(["Marca / modelo", marcaModelo]);
  if (row.voltagem) specs.push(["Voltagem", row.voltagem]);
  if (row.estado) specs.push(["Estado de conservação", row.estado]);
  if (Number(row.desconto_semana) > 0) {
    specs.push(["Desconto semanal", `${row.desconto_semana}% em aluguéis de 7+ dias`]);
  }

  const entrega = [];
  if (row.retirada) entrega.push("retirada no endereço");
  if (row.entrega_regiao) entrega.push("entrega na região");
  if (row.ponto_encontro) entrega.push("ponto de encontro");
  if (entrega.length > 0) specs.push(["Entrega", entrega.join(" · ")]);

  return specs;
}

export function mapRowToProduct(row) {
  const meta = categoryMeta(row.categoria);
  const profile = row.profiles ?? {};
  const name = profile.nome || "Locador";
  const photos = Array.isArray(row.fotos) ? row.fotos.filter(Boolean) : [];
  const sinceDate = profile.created_at ? new Date(profile.created_at) : new Date(row.created_at);

  return {
    id: row.id,
    slug: row.slug,
    title: row.titulo,
    category: row.categoria,
    icon: meta?.icon ?? "box",
    hue: meta?.hue ?? "hue-tools",
    price: Number(row.preco_dia),
    deposit: Number(row.caucao) || 0,
    weekDiscount: Number(row.desconto_semana) || 0,
    rating: 0,
    reviews: 0,
    neighborhood: row.bairro,
    city: row.cidade,
    cep: row.cep,
    lat: row.lat != null ? Number(row.lat) : null,
    lng: row.lng != null ? Number(row.lng) : null,
    distance: row.distance_km != null ? Number(row.distance_km) : null,
    badge: "Novo",
    featured: false,
    rentals: 0,
    delivery: Boolean(row.entrega_regiao),
    pickup: Boolean(row.retirada),
    meetup: Boolean(row.ponto_encontro),
    photos,
    description: splitDescription(row.descricao),
    specs: buildSpecs(row),
    owner: {
      name,
      initials: getInitials(name),
      avatar: "av-1",
      avatarUrl: profile.avatar_url || null,
      since: sinceDate.getFullYear(),
      reply: "~1 h",
      verified: Boolean(profile.verificado),
    },
    status: row.status,
    source: "supabase",
  };
}

export function mergeCatalog(liveProducts) {
  const slugs = new Set(liveProducts.map((product) => product.slug));
  return [...liveProducts, ...PRODUCTS.filter((product) => !slugs.has(product.slug))];
}

export async function fetchPublishedProducts({ force = false } = {}) {
  if (!isSupabaseConfigured) return [];

  if (!force && publishedCache && Date.now() - publishedCacheAt < CACHE_TTL_MS) {
    return publishedCache;
  }

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("status", "publicado")
    .order("created_at", { ascending: false });

  if (error) throw error;

  publishedCache = (data ?? []).map(mapRowToProduct);
  publishedCacheAt = Date.now();
  return publishedCache;
}

/** Distâncias via PostGIS. Retorna null se a função ainda não existir no projeto. */
export async function fetchNearbyDistances(origin, radiusKm = 25) {
  if (!isSupabaseConfigured || origin?.lat == null || origin?.lng == null) return null;

  const { data, error } = await supabase.rpc("search_products_near", {
    origin_lat: origin.lat,
    origin_lng: origin.lng,
    radius_km: radiusKm,
  });

  if (error) return null;
  return new Map((data ?? []).map((row) => [row.id, Number(row.distance_km)]));
}

export async function fetchProductBySlug(slug) {
  if (!isSupabaseConfigured || !slug) return null;

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data ? mapRowToProduct(data) : null;
}

export async function fetchMyProducts(userId) {
  if (!isSupabaseConfigured || !userId) return [];

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapRowToProduct);
}

function assertPhotoFile(file) {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) {
    throw new Error("Use fotos em JPG, PNG ou WebP.");
  }
  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error("Cada foto pode ter no máximo 5 MB.");
  }
}

export async function uploadProductPhotos(userId, files) {
  const selected = [...files].slice(0, MAX_PHOTOS);
  const urls = [];

  for (const file of selected) {
    assertPhotoFile(file);
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

    if (error) throw error;

    const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);
    urls.push(data.publicUrl);
  }

  return urls;
}

export async function saveProduct({
  id,
  userId,
  payload,
  files,
  status,
  existingPhotos = [],
}) {
  const uploaded = await uploadProductPhotos(userId, files ?? []);
  const fotos = [...existingPhotos, ...uploaded];

  const row = {
    titulo: payload.titulo,
    categoria: payload.categoria,
    estado: payload.estado,
    descricao: payload.descricao,
    marca: payload.marca || null,
    modelo: payload.modelo || null,
    voltagem: payload.voltagem || null,
    preco_dia: payload.preco_dia,
    desconto_semana: payload.desconto_semana || 0,
    caucao: payload.caucao || 0,
    retirada: payload.retirada,
    entrega_regiao: payload.entrega_regiao,
    ponto_encontro: payload.ponto_encontro,
    cep: payload.cep,
    bairro: payload.bairro,
    cidade: payload.cidade,
    lat: payload.lat ?? null,
    lng: payload.lng ?? null,
    fotos,
    status,
  };

  if (id) {
    const { data, error } = await supabase
      .from("products")
      .update(row)
      .eq("id", id)
      .select(PRODUCT_SELECT)
      .single();

    if (error) {
      if (!isMissingGeoColumn(error)) throw error;
      const { data: fallback, error: fallbackError } = await supabase
        .from("products")
        .update(withoutGeo(row))
        .eq("id", id)
        .select(PRODUCT_SELECT)
        .single();
      if (fallbackError) throw fallbackError;
      invalidateProductCache();
      return mapRowToProduct(fallback);
    }
    invalidateProductCache();
    return mapRowToProduct(data);
  }

  const insertRow = {
    ...row,
    owner_id: userId,
    slug: payload.slug ?? uniqueSlug(payload.titulo),
  };

  const { data, error } = await supabase.from("products").insert(insertRow).select(PRODUCT_SELECT).single();

  if (error) {
    if (!isMissingGeoColumn(error)) throw error;
    const { data: fallback, error: fallbackError } = await supabase
      .from("products")
      .insert(withoutGeo(insertRow))
      .select(PRODUCT_SELECT)
      .single();
    if (fallbackError) throw fallbackError;
    invalidateProductCache();
    return mapRowToProduct(fallback);
  }
  invalidateProductCache();
  return mapRowToProduct(data);
}

function withoutGeo(row) {
  const next = { ...row };
  delete next.lat;
  delete next.lng;
  return next;
}

function isMissingGeoColumn(error) {
  const message = `${error?.message ?? ""} ${error?.details ?? ""}`;
  return error?.code === "PGRST204" || /'lat'|'lng'|column .*lat|column .*lng/i.test(message);
}

export function useMergedProducts() {
  const [products, setProducts] = useState(() => withDistance(PRODUCTS, DEFAULT_ORIGIN));
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return undefined;
    }

    let mounted = true;

    (async () => {
      try {
        const live = await fetchPublishedProducts();
        if (mounted) setProducts(withDistance(mergeCatalog(live), DEFAULT_ORIGIN));
      } catch {
        if (mounted) setProducts(withDistance(PRODUCTS, DEFAULT_ORIGIN));
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return { products, loading };
}

export { MAX_PHOTOS };
