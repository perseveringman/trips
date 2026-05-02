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

// ── 历史分期系统 ──

import type { Entity, TripEvent } from "./types";

export interface HistoricalPeriod {
  id: string;
  name: string;
  emoji: string;
  startYear: number; // 负数 = BC
  endYear: number;
}

export const PERIODS: HistoricalPeriod[] = [
  { id: "early",       name: "早王朝",     emoji: "🏺",  startYear: -3100, endYear: -2687 },
  { id: "old-kingdom", name: "古王国",     emoji: "🔺",  startYear: -2686, endYear: -2181 },
  { id: "fip",         name: "第一中间期", emoji: "⚡",  startYear: -2180, endYear: -2055 },
  { id: "middle",      name: "中王国",     emoji: "⚖️",  startYear: -2054, endYear: -1650 },
  { id: "sip",         name: "第二中间期", emoji: "🐴",  startYear: -1649, endYear: -1551 },
  { id: "new-kingdom", name: "新王国",     emoji: "👑",  startYear: -1550, endYear: -1070 },
  { id: "tip",         name: "第三中间期", emoji: "📜",  startYear: -1069, endYear: -664  },
  { id: "late",        name: "后王国期",   emoji: "🦅",  startYear: -663,  endYear: -332  },
  { id: "ptolemaic",   name: "托勒密",     emoji: "🏛️",  startYear: -331,  endYear: -31   },
  { id: "roman",       name: "罗马时期",   emoji: "⚔️",  startYear: -30,   endYear: 640   },
  { id: "islamic",     name: "伊斯兰",     emoji: "🕌",  startYear: 641,   endYear: 1797  },
  { id: "modern",      name: "近现代",     emoji: "🏗️",  startYear: 1798,  endYear: 2100  },
];

export const DYNASTY_TO_PERIOD: Record<string, string> = {
  "第一王朝": "early", "第二王朝": "early",
  "第三王朝": "old-kingdom", "第四王朝": "old-kingdom",
  "第五王朝": "old-kingdom", "第六王朝": "old-kingdom",
  "第七王朝": "fip", "第八王朝": "fip",
  "第九王朝": "fip", "第十王朝": "fip",
  "第十一王朝": "middle", "第十二王朝": "middle",
  "第十三王朝": "middle", "第十四王朝": "middle",
  "第十五王朝": "sip", "第十六王朝": "sip", "第十七王朝": "sip",
  "第十八王朝": "new-kingdom", "第十九王朝": "new-kingdom", "第二十王朝": "new-kingdom",
  "第二十一王朝": "tip", "第二十二王朝": "tip", "第二十三王朝": "tip",
  "第二十四王朝": "tip", "第二十五王朝": "tip",
  "第二十六王朝": "late", "第二十七王朝": "late",
  "第二十八王朝": "late", "第二十九王朝": "late", "第三十王朝": "late", "第三十一王朝": "late",
  "托勒密王朝": "ptolemaic",
};

export const TAG_TO_PERIOD: Record<string, string> = {
  "早王朝": "early",
  "古王国": "old-kingdom",
  "第一中间期": "fip",
  "中王国": "middle",
  "第二中间期": "sip",
  "新王国": "new-kingdom",
  "第三中间期": "tip",
  "后王国期": "late", "晚期王朝": "late",
  "托勒密": "ptolemaic", "托勒密时期": "ptolemaic",
  "罗马时期": "roman", "罗马": "roman",
  "伊斯兰": "islamic", "伊斯兰时期": "islamic",
  "近现代": "modern", "现代": "modern",
};

/** 将年份映射到分期 id */
export function yearToPeriod(y: number): string | null {
  for (const p of PERIODS) {
    if (y >= p.startYear && y <= p.endYear) return p.id;
  }
  return null;
}

/** 三级回退：dynasty → tags → 关联 event 最早年份 */
export function entityToPeriod(entity: Entity, events: TripEvent[]): string | null {
  // Level 1: dynasty 字段直接映射
  if (entity.dynasty && DYNASTY_TO_PERIOD[entity.dynasty]) {
    return DYNASTY_TO_PERIOD[entity.dynasty];
  }
  // Level 2: tags 关键词匹配
  for (const tag of entity.tags) {
    if (TAG_TO_PERIOD[tag]) return TAG_TO_PERIOD[tag];
  }
  // Level 3: 关联 event 的最早年份
  const years: number[] = [];
  for (const ev of events) {
    if (ev.year != null && (ev.places.includes(entity.id) || ev.actors.includes(entity.id))) {
      years.push(ev.year);
    }
  }
  if (years.length) return yearToPeriod(Math.min(...years));
  return null;
}

/** 事件按年份归期 */
export function eventToPeriod(ev: TripEvent): string | null {
  if (ev.year == null) return null;
  return yearToPeriod(ev.year);
}
