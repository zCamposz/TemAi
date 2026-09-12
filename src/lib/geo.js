/** Origem padrão da busca (o protótipo já apresentava Vila Mariana). */
export const DEFAULT_ORIGIN = {
  lat: -23.5893,
  lng: -46.6344,
  label: "Vila Mariana, São Paulo",
};

const EARTH_RADIUS_KM = 6371;

export function haversineKm(from, to) {
  if (!from || !to || from.lat == null || to.lat == null || from.lng == null || to.lng == null) {
    return null;
  }

  const toRad = (value) => (Number(value) * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export function withDistance(products, origin) {
  if (!origin) return products;
  return products.map((product) => ({
    ...product,
    distance: haversineKm(origin, { lat: product.lat, lng: product.lng }),
  }));
}

function parseCoord(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function isUsableCoord(lat, lng) {
  if (lat == null || lng == null) return false;
  if (lat === 0 && lng === 0) return false;
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

function isInBrazil(lat, lng) {
  return lat >= -34 && lat <= 6 && lng >= -74 && lng <= -32;
}

function preferBrazil(candidates) {
  return candidates.find((item) => isInBrazil(item.lat, item.lng)) ?? null;
}

async function geocodeOpenMeteo(name) {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", name);
  url.searchParams.set("count", "5");
  url.searchParams.set("language", "pt");
  url.searchParams.set("countryCode", "BR");

  const response = await fetch(url);
  if (!response.ok) return null;
  const data = await response.json();
  const hits = (data?.results ?? [])
    .map((hit) => ({
      lat: hit.latitude,
      lng: hit.longitude,
      label: [hit.name, hit.admin1].filter(Boolean).join(", ") || name,
    }))
    .filter((hit) => isUsableCoord(hit.lat, hit.lng));

  return preferBrazil(hits) ?? hits[0] ?? null;
}

async function geocodePhoton(query) {
  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "5");
  url.searchParams.set("lang", "pt");
  url.searchParams.set("lat", String(DEFAULT_ORIGIN.lat));
  url.searchParams.set("lon", String(DEFAULT_ORIGIN.lng));

  const response = await fetch(url);
  if (!response.ok) return null;
  const data = await response.json();
  const hits = (data?.features ?? [])
    .map((feature) => {
      const [lng, lat] = feature.geometry?.coordinates ?? [];
      const props = feature.properties ?? {};
      const label = [props.name, props.city, props.state].filter(Boolean).join(", ") || query;
      return { lat, lng, label };
    })
    .filter((hit) => isUsableCoord(hit.lat, hit.lng));

  return preferBrazil(hits) ?? hits[0] ?? null;
}

/** CEP brasileiro → bairro, cidade e coordenadas (BrasilAPI, com fallback). */
export async function geocodeCep(raw) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (digits.length !== 8) return null;

  let bairro = "";
  let cidade = "";

  try {
    const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${digits}`);
    if (response.ok) {
      const data = await response.json();
      bairro = data.neighborhood || "";
      cidade = data.city || "";
      const lat = parseCoord(data.location?.coordinates?.latitude);
      const lng = parseCoord(data.location?.coordinates?.longitude);
      const label = [bairro, cidade].filter(Boolean).join(", ") || `CEP ${digits}`;
      if (lat != null && lng != null) {
        return { cep: digits, bairro, cidade, lat, lng, label };
      }
    }
  } catch {
    /* tenta ViaCEP + geocode textual */
  }

  if (!bairro && !cidade) {
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      if (response.ok) {
        const data = await response.json();
        if (!data.erro) {
          bairro = data.bairro || "";
          cidade = data.localidade || "";
        }
      }
    } catch {
      /* endereço manual */
    }
  }

  const query = [bairro, cidade, "Brasil"].filter(Boolean).join(", ");
  let place = null;
  if (query) {
    try {
      place = await geocodeOpenMeteo(query);
    } catch {
      /* Photon */
    }
    if (!place) {
      try {
        place = await geocodePhoton(query);
      } catch {
        place = null;
      }
    }
  }

  return {
    cep: digits,
    bairro: bairro || "",
    cidade: cidade || "",
    lat: place?.lat ?? null,
    lng: place?.lng ?? null,
    label: place?.label || [bairro, cidade].filter(Boolean).join(", ") || `CEP ${digits}`,
  };
}

/** Texto livre (bairro, cidade ou CEP) → ponto. */
export async function geocodePlace(query) {
  const text = String(query ?? "").trim();
  if (!text) return null;

  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (normalized === "vila mariana, sao paulo" || normalized === "vila mariana") {
    return DEFAULT_ORIGIN;
  }

  const asCep = text.replace(/\D/g, "");
  if (asCep.length === 8 && /^\d{5}-?\d{3}$/.test(text.replace(/\s/g, ""))) {
    const fromCep = await geocodeCep(text);
    if (fromCep?.lat != null) {
      return { lat: fromCep.lat, lng: fromCep.lng, label: fromCep.label };
    }
  }

  try {
    const meteo = await geocodeOpenMeteo(text);
    if (meteo && isInBrazil(meteo.lat, meteo.lng)) return meteo;
  } catch {
    /* Photon como segunda opção */
  }

  try {
    const photon = await geocodePhoton(text);
    if (photon && isInBrazil(photon.lat, photon.lng)) return photon;
  } catch {
    return null;
  }

  return null;
}

export function getBrowserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Seu navegador não oferece geolocalização."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        if (!isUsableCoord(lat, lng)) {
          reject(new Error("Não foi possível obter sua localização."));
          return;
        }
        resolve({
          lat,
          lng,
          label: "Sua localização",
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(new Error("Permita o acesso à localização para buscar perto de você."));
        } else {
          reject(new Error("Não foi possível obter sua localização."));
        }
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 }
    );
  });
}

export function parseOriginParams(searchParams) {
  const lat = parseCoord(searchParams.get("lat"));
  const lng = parseCoord(searchParams.get("lng"));
  const label = (searchParams.get("local") ?? "").trim();
  if (!isUsableCoord(lat, lng)) return null;
  return { lat, lng, label: label || "Local escolhido" };
}
