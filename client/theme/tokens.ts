/**
 * Single source of truth for semantic theme tokens (CSS variables).
 *
 * Architecture:
 * - Brand palette hex scales → tailwind.config.js (indigoscale, redscale, …)
 * - Semantic tokens (--primary, --destructive, …) → this file
 * - Runtime injection → components/GluestackUIProvider.tsx (NativeWind vars())
 * - Tailwind class resolution → tailwind.config.js fallbacks (must match values here)
 * - App button API → components/button.tsx (action prop; overrides generated hovers)
 *
 * Do NOT add duplicate CSS files or post-build patches on generated ui/ components.
 */

export type ThemeMode = "light" | "dark";

export type ThemeTokens = Record<`--${string}`, string>;

export const lightTheme: ThemeTokens = {
  /* Semantic tokens (shadcn / gluestack components) */
  "--primary": "103 130 203",
  "--primary-foreground": "250 250 250",
  "--secondary": "133 42 213",
  "--secondary-foreground": "250 250 250",
  "--destructive": "213 69 42",
  "--background": "255 255 255",
  "--foreground": "23 23 23",
  "--card": "255 255 255",
  "--popover": "255 255 255",
  "--popover-foreground": "10 10 10",
  "--border": "229 229 229",
  "--input": "229 229 229",
  "--muted": "245 245 245",
  "--muted-foreground": "115 115 115",
  "--accent": "245 245 245",
  "--accent-foreground": "23 23 23",
  "--ring": "103 130 203",

  /* Gluestack utility scales used by generated components / app classes */
  "--color-background-0": "255 255 255",
  "--color-background-50": "251 251 251",
  "--color-background-100": "245 245 245",
  "--color-background-200": "240 240 240",
  "--color-background-300": "229 229 229",
  "--color-background-400": "212 212 212",
  "--color-background-500": "163 163 163",
  "--color-background-600": "115 115 115",
  "--color-background-700": "82 82 82",
  "--color-background-800": "38 38 38",
  "--color-background-900": "23 23 23",
  "--color-background-950": "10 10 10",
  "--color-background-error": "252 213 204",
  "--color-background-warning": "250 245 201",
  "--color-background-success": "219 250 211",
  "--color-background-info": "208 227 248",
  "--color-background-muted": "245 245 245",
  "--color-typography-0": "255 255 255",
  "--color-typography-50": "251 251 251",
  "--color-typography-100": "245 245 245",
  "--color-typography-200": "229 229 229",
  "--color-typography-300": "212 212 212",
  "--color-typography-400": "163 163 163",
  "--color-typography-500": "115 115 115",
  "--color-typography-600": "82 82 82",
  "--color-typography-700": "64 64 64",
  "--color-typography-800": "38 38 38",
  "--color-typography-900": "23 23 23",
  "--color-typography-950": "10 10 10",
};

export const darkTheme: ThemeTokens = {
  "--primary": "103 130 203",
  "--primary-foreground": "10 10 10",
  "--secondary": "133 42 213",
  "--secondary-foreground": "10 10 10",
  "--destructive": "213 69 42",
  "--background": "10 10 10",
  "--foreground": "250 250 250",
  "--card": "38 38 38",
  "--popover": "38 38 38",
  "--popover-foreground": "250 250 250",
  "--border": "82 82 82",
  "--input": "82 82 82",
  "--muted": "64 64 64",
  "--muted-foreground": "161 161 161",
  "--accent": "64 64 64",
  "--accent-foreground": "250 250 250",
  "--ring": "103 130 203",

  "--color-background-0": "10 10 10",
  "--color-background-50": "23 23 23",
  "--color-background-100": "38 38 38",
  "--color-background-200": "64 64 64",
  "--color-background-300": "82 82 82",
  "--color-background-400": "115 115 115",
  "--color-background-500": "163 163 163",
  "--color-background-600": "212 212 212",
  "--color-background-700": "229 229 229",
  "--color-background-800": "240 240 240",
  "--color-background-900": "245 245 245",
  "--color-background-950": "251 251 251",
  "--color-background-error": "80 26 16",
  "--color-background-warning": "80 74 16",
  "--color-background-success": "36 80 16",
  "--color-background-info": "10 50 86",
  "--color-background-muted": "64 64 64",
  "--color-typography-0": "10 10 10",
  "--color-typography-50": "23 23 23",
  "--color-typography-100": "38 38 38",
  "--color-typography-200": "64 64 64",
  "--color-typography-300": "82 82 82",
  "--color-typography-400": "115 115 115",
  "--color-typography-500": "163 163 163",
  "--color-typography-600": "212 212 212",
  "--color-typography-700": "229 229 229",
  "--color-typography-800": "240 240 240",
  "--color-typography-900": "245 245 245",
  "--color-typography-950": "251 251 251",
};

export const themeTokens: Record<ThemeMode, ThemeTokens> = {
  light: lightTheme,
  dark: darkTheme,
};
