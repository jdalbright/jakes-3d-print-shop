export type ConfirmedBambuPlaMatteColor = {
  readonly name: string;
  readonly code: string;
  readonly hex: string;
};

export const confirmedBambuPlaMatteColorGroups = [
  {
    name: "Neutrals",
    colors: [
      { name: "Ivory White", code: "11100", hex: "#ffffff" },
      { name: "Ash Gray", code: "11102", hex: "#9b9ea0" },
      { name: "Charcoal", code: "11101", hex: "#000000" },
    ],
  },
  {
    name: "Warm tones",
    colors: [
      { name: "Lemon Yellow", code: "11400", hex: "#f7d959" },
      { name: "Mandarin Orange", code: "11300", hex: "#f99963" },
      { name: "Terracotta", code: "11203", hex: "#b15533" },
    ],
  },
  {
    name: "Soft tones",
    colors: [
      { name: "Sakura Pink", code: "11201", hex: "#e8afcf" },
      { name: "Lilac Purple", code: "11700", hex: "#ae96d4" },
      { name: "Desert Tan", code: "11401", hex: "#e8dbb7" },
    ],
  },
  {
    name: "Greens",
    colors: [
      { name: "Apple Green", code: "11502", hex: "#c2e189" },
      { name: "Grass Green", code: "11500", hex: "#61c680" },
      { name: "Dark Green", code: "11501", hex: "#68724d" },
    ],
  },
  {
    name: "Blues",
    colors: [
      { name: "Sky Blue", code: "11603", hex: "#56b7e6" },
      { name: "Marine Blue", code: "11600", hex: "#0078bf" },
      { name: "Dark Blue", code: "11602", hex: "#042f56" },
    ],
  },
  {
    name: "Browns",
    colors: [
      { name: "Latte Brown", code: "11800", hex: "#d3b7a7" },
      { name: "Caramel", code: "11803", hex: "#ae835b" },
      { name: "Dark Brown", code: "11801", hex: "#7d6556" },
    ],
  },
] as const;

export const confirmedBambuPlaMatteColors = confirmedBambuPlaMatteColorGroups.flatMap<ConfirmedBambuPlaMatteColor>(
  (group) => group.colors,
);
