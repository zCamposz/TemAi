import { useEffect, useRef, useState } from "react";
import L from "leaflet";

const SAO_PAULO = [-23.55, -46.63];

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function popupHtml(point) {
  const extra = point.diferenciado
    ? `<br><span>Também recebe: ${escapeHtml(point.diferenciado)}</span>`
    : "";
  return `
    <strong>${escapeHtml(point.nome)}</strong><br>
    ${escapeHtml(point.endereco)}<br>
    <span>${escapeHtml(point.distrito)} · ${escapeHtml(point.subprefeitura)}</span><br>
    <span>${escapeHtml(point.horario)}</span><br>
    <span>Recebe: ${escapeHtml(point.recebe)}</span>
    ${extra}
  `;
}

export default function EcopontosMap({ points = [], selectedId, onSelect, origin = null }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const groupRef = useRef(null);
  const markersRef = useRef(new Map());
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
        zoom: 11,
        scrollWheelZoom: false,
        attributionControl: false,
      });

      L.control.attribution({ prefix: false, position: "bottomright" }).addTo(map);
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "© OpenStreetMap · © Esri · ecopontos: GeoSampa / AMLURB",
          maxZoom: 19,
        }
      ).addTo(map);

      groupRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      setMapId((id) => id + 1);
    } catch {
      return undefined;
    }

    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);
    requestAnimationFrame(() => map.invalidateSize());

    return () => {
      window.removeEventListener("resize", onResize);
      map?.remove();
      mapRef.current = null;
      groupRef.current = null;
      markersRef.current = new Map();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const group = groupRef.current;
    if (!map || !group || mapId === 0) return;

    group.clearLayers();
    markersRef.current = new Map();
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
        .bindTooltip(escapeHtml(origin.label || "Seu endereço"), { direction: "top" })
        .addTo(group);
      bounds.push(originLatLng);
    }

    for (const point of points) {
      if (point.lat == null || point.lng == null) continue;
      const latLng = [point.lat, point.lng];
      const marker = L.circleMarker(latLng, {
        radius: 7,
        color: "#fff",
        weight: 2,
        fillColor: "#137a50",
        fillOpacity: 1,
      })
        .bindPopup(popupHtml(point), { maxWidth: 280 })
        .on("click", () => onSelectRef.current?.(point.id));
      marker.addTo(group);
      markersRef.current.set(point.id, marker);
      bounds.push(latLng);
    }

    if (bounds.length >= 2) {
      map.fitBounds(bounds, { padding: [28, 28], maxZoom: 14 });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 15);
    } else {
      map.setView(SAO_PAULO, 11);
    }

    requestAnimationFrame(() => map.invalidateSize());
  }, [mapId, points, origin]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || mapId === 0) return;

    for (const [id, marker] of markersRef.current) {
      const selected = id === selectedId;
      marker.setStyle({
        radius: selected ? 11 : 7,
        fillColor: selected ? "#0f5c3c" : "#137a50",
      });
    }

    const marker = markersRef.current.get(selectedId);
    if (!marker) return;
    const latLng = marker.getLatLng();
    map.panTo(latLng);
    marker.openPopup();
  }, [mapId, points, selectedId]);

  return (
    <div
      ref={containerRef}
      className="results-map ecopontos-map"
      role="img"
      aria-label="Mapa dos ecopontos de São Paulo"
    />
  );
}
