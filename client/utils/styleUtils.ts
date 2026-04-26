// Compatibility utilities for legacy screens.

/**
 * Convert an HSL triple (0-360 / 0-100 / 0-100) to an hsla() css string.
 */
export function hslToHSLA(
  h: number,
  s: number,
  l: number,
  a: number = 1
): string {
  const hh = clamp(h, 0, 360);
  const ss = clamp(s, 0, 100);
  const ll = clamp(l, 0, 100);
  const aa = clamp(a, 0, 1);

  return `hsla(${hh}, ${ss}%, ${ll}%, ${aa})`;
}

/**
 * Given an existing HSL triple, return a new triple with the lightness changed.
 */
export function setHSLlightness(
  h: number,
  s: number,
  _l: number,
  newLightness: number
): { h: number; s: number; l: number } {
  return {
    h: clamp(h, 0, 360),
    s: clamp(s, 0, 100),
    l: clamp(newLightness, 0, 100),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
