export const hslToHSLA = (hsl: string, alpha: number): string =>
  hsl.replace("hsl(", "hsla(").replace(")", `, ${alpha})`);

export const setHSLlightness = (hsl: string, newLightness: number): string => {
  const parts = hsl.split(",");
  parts[2] = ` ${Math.max(0, Math.min(100, newLightness)).toFixed(1)}%)`;
  return parts.join(",");
};
