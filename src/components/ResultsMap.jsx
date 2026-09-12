import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { DEFAULT_ORIGIN } from "../lib/geo";

const SAO_PAULO = [DEFAULT_ORIGIN.lat, DEFAULT_ORIGIN.lng];

/** Vários anúncios no mesmo CEP/bairro caem no mesmo ponto — espalha em um círculo. */
function spreadOverlapping(products) {
  const groups = new Map();

  for (const product of products) {
    if (product.lat == null || product.lng == null) continue;
    const key = `${Number(product.lat).toFixed(5)},${Number(product.lng).toFixed(5)}`;
    const list = groups.get(key) ?? [];
    list.push(product);
    groups.set(key, list);
  }

  const meters = 55;
  const placed = [];

  for (const group of groups.values()) {
    group.forEach((product, index) => {
      if (group.length === 1) {
        placed.push({ product, lat: product.lat, lng: product.lng });
        return;
      }
      const angle = (2 * Math.PI * index) / group.length - Math.PI / 2;
      const north = meters * Math.cos(angle);
      const east = meters * Math.sin(angle);
      const dLat = north / 111_320;
      const dLng = east / (111_320 * Math.cos((product.lat * Math.PI) / 180));
      placed.push({ product, lat: product.lat + dLat, lng: product.lng + dLng });
    });
  }

  return placed;
}

export default function ResultsMap({ origin, products = [], selectedSlug, onSelect }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(null);
  const onSelectRef = useRef(onSelect);
  const [mapId, setMapId] = useState(0);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return undefined;

    if (node._leaflet_id) {
      node._leaflet_id = undefined;
    }

    let map;
    try {
      map = L.map(node, {
        center: SAO_PAULO,
        zoom: 13,
        scrollWheelZoom: false,
        attributionControl: false,
      });

      L.control.attribution({ prefix: false, position: "bottomright" }).addTo(map);

      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "© OpenStreetMap · © Esri",
          maxZoom: 19,
        }
      ).addTo(map);

      markersRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      setMapId((id) => id + 1);
    } catch {
      return undefined;
    }

    const onResize = () => {
      map.invalidateSize();
    };
    window.addEventListener("resize", onResize);
    requestAnimationFrame(() => map.invalidateSize());

    return () => {
      window.removeEventListener("resize", onResize);
      map?.remove();
      mapRef.current = null;
      markersRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const group = markersRef.current;
    if (!map || !group || mapId === 0) return;

    group.clearLayers();
    const bounds = [];

    if (origin?.lat != null && origin?.lng != null) {
      const originLatLng = [origin.lat, origin.lng];
      L.circleMarker(originLatLng, {
        radius: 10,
        color: "#fff",
        weight: 2,
        fillColor: "#f4b942",
        fillOpacity: 1,
      })
        .bindTooltip(origin.label || "Você está aqui", { direction: "top" })
        .addTo(group);
      bounds.push(originLatLng);
    }

    for (const pin of spreadOverlapping(products)) {
      const latLng = [pin.lat, pin.lng];
      const isSelected = selectedSlug === pin.product.slug;
      L.circleMarker(latLng, {
        radius: isSelected ? 11 : 7,
        color: "#fff",
        weight: 2,
        fillColor: isSelected ? "#0f5c3c" : "#137a50",
        fillOpacity: 1,
      })
        .bindTooltip(pin.product.title, { direction: "top" })
        .on("click", () => onSelectRef.current?.(pin.product.slug))
        .addTo(group);
      bounds.push(latLng);
    }

    if (bounds.length >= 2) {
      map.fitBounds(bounds, { padding: [28, 28], maxZoom: 15 });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 14);
    } else {
      map.setView(SAO_PAULO, 13);
    }

    requestAnimationFrame(() => map.invalidateSize());
  }, [mapId, origin, products, selectedSlug]);

  return <div ref={containerRef} className="results-map" role="img" aria-label="Mapa dos resultados" />;
}
