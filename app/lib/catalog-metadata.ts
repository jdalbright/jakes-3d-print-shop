import type { ProductColorway } from "./types";

const accentHexes: Record<string, string> = {
  clay: "#23627b",
  ocean: "#557d82",
  graphite: "#555b56",
  moss: "#8b9d78",
  rose: "#b96e70",
  yellow: "#d5aa2f",
};

const namedColorHexes: Record<string, string> = {
  terracotta: "#b76649",
  sage: "#879b76",
  sand: "#cdbb97",
  copper: "#a86642",
  ocean: "#3e7484",
  galaxy: "#524b73",
  graphite: "#4f5652",
  bone: "#d8d0bf",
  "safety orange": "#df642c",
  moss: "#748660",
  charcoal: "#414844",
  cream: "#ded6be",
  rose: "#b96e70",
  lavender: "#9b8bb2",
  cobalt: "#355d9d",
  mint: "#89b7a6",
  "signal yellow": "#d5aa2f",
};

const validHex = /^#[0-9a-f]{6}$/i;

export function parseColorwaysMetadata(value: string | undefined): ProductColorway[] {
  if (!value) return [];

  return value
    .split("|")
    .map((entry) => {
      const fields = entry.split(";").reduce<Record<string, string>>((result, field) => {
        const separator = field.indexOf("=");
        if (separator < 1) return result;
        const key = field.slice(0, separator).trim();
        const item = field.slice(separator + 1).trim();
        if (key && item) result[key] = item;
        return result;
      }, {});
      const label = fields.label;
      const baseColor = fields.base;
      const baseHex = fields.base_hex;
      const capColor = fields.cap;
      const capHex = fields.cap_hex;
      if (!label || !baseColor || !capColor || !baseHex || !capHex || !validHex.test(baseHex) || !validHex.test(capHex)) {
        return null;
      }
      return {
        label,
        baseColor,
        baseHex: baseHex.toLowerCase(),
        capColor,
        capHex: capHex.toLowerCase(),
      };
    })
    .filter((colorway): colorway is ProductColorway => colorway !== null);
}

export function splitMetadata(value: string | undefined, fallback: string[]) {
  if (!value) return fallback;
  const delimiter = value.includes("|") ? "|" : ",";
  const items = value.split(delimiter).map((item) => item.trim()).filter(Boolean);
  return items.length ? items : fallback;
}

export function textMetadata(value: string | undefined, fallback: string) {
  return value?.trim() || fallback;
}

export function buildColorHexes(colors: string[], value: string | undefined, accent: string) {
  const configured = splitMetadata(value, []);
  return colors.map((color, index) => {
    const candidate = configured[index];
    if (candidate && validHex.test(candidate)) return candidate.toLowerCase();
    return namedColorHexes[color.toLowerCase()] || accentHexes[accent] || "#7c827d";
  });
}

export function normalizeProductImages(images: string[], fallbackImage: string | null) {
  const normalized = Array.from(new Set(images.map((image) => image.trim()).filter(Boolean)));
  return normalized.length || !fallbackImage ? normalized : [fallbackImage];
}
