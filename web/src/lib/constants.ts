// Types considered "location-like" — entities of these types always have
// their own point on the map. Kept in sync with scripts/ingest.py.
export const PLACE_TYPES = new Set([
  "place", "city", "town", "village", "region", "district", "site",
  "ruin", "temple", "church", "mosque", "shrine", "palace", "museum",
  "gallery", "landmark", "monument", "tomb", "natural_feature",
  "mountain", "river", "lake", "sea", "desert", "island", "park",
  "market", "neighborhood", "station", "port",
]);

export function isPlaceType(t: string | null | undefined): boolean {
  if (!t) return false;
  const low = t.toLowerCase();
  return PLACE_TYPES.has(low) || low.endsWith("_site") || low.endsWith("_place");
}

// Deterministic HSL colour per type so unknown types still render consistently.
export function colorForType(type: string | null | undefined): string {
  const t = type || "concept";
  let h = 0;
  for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) % 360;
  return `hsl(${h}, 55%, 55%)`;
}

// ── 实体类型图标体系 ──
// 每种类型对应一个 emoji 和主色，用于图谱节点和地图标记。
export const TYPE_ICONS: Record<string, { emoji: string; color: string }> = {
  pharaoh:         { emoji: "👑", color: "#d4a017" },
  person:          { emoji: "👤", color: "#6a7b8b" },
  temple:          { emoji: "🏛️", color: "#8b5e3c" },
  church:          { emoji: "⛪", color: "#5b7db1" },
  mosque:          { emoji: "🕌", color: "#2e8b57" },
  city:            { emoji: "🏙️", color: "#4a7c8c" },
  town:            { emoji: "🏘️", color: "#5a8a7c" },
  site:            { emoji: "📍", color: "#c6652a" },
  landmark:        { emoji: "🗿", color: "#8b6914" },
  museum:          { emoji: "🎭", color: "#7b5ea7" },
  monument:        { emoji: "🏛️", color: "#8b5e3c" },
  tomb:            { emoji: "⚱️", color: "#6b4c3b" },
  natural_feature: { emoji: "🌊", color: "#2e86ab" },
  river:           { emoji: "🌊", color: "#2e86ab" },
  mountain:        { emoji: "⛰️", color: "#5d7b3a" },
  desert:          { emoji: "🏜️", color: "#c4a35a" },
  island:          { emoji: "🏝️", color: "#2a9d8f" },
  concept:         { emoji: "💡", color: "#b8860b" },
  palace:          { emoji: "🏰", color: "#7b5ea7" },
};

export function iconForType(type: string | null | undefined): { emoji: string; color: string } {
  return TYPE_ICONS[type || ""] || { emoji: "📌", color: "#8a8a80" };
}

// Generate an SVG data URL with emoji centered on a coloured circle.
// Used as Cytoscape background-image and Leaflet divIcon.
export function emojiSvgUrl(emoji: string, color: string, size = 32): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 1}" fill="${color}" opacity="0.18"/>
    <text x="50%" y="54%" dominant-baseline="central" text-anchor="middle" font-size="${size * 0.55}">${emoji}</text>
  </svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

export const MOBILE_BREAKPOINT = 768;
