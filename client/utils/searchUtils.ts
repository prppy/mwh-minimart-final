// Utility helpers for search UI.
// Some legacy screens import these from "@/utils/searchUtils".

/**
 * Returns an array of text parts split by the search query.
 *
 * Example:
 * - text:  "Hello World"
 * - query: "wo"
 * => [{ text: "Hello ", highlight: false }, { text: "Wo", highlight: true }, { text: "rld", highlight: false }]
 */
export function splitByQuery(
  text: string,
  query: string
): { text: string; highlight: boolean }[] {
  if (!query) return [{ text, highlight: false }];

  const safe = escapeRegExp(query);
  const re = new RegExp(`(${safe})`, "ig");

  return text
    .split(re)
    .filter((part) => part.length > 0)
    .map((part) => ({
      text: part,
      highlight: part.toLowerCase() === query.toLowerCase(),
    }));
}

/**
 * Convenience for building highlighted text parts suitable for rendering (e.g. mapping to <Text /> children).
 */
export function renderHighlightedText(text: string, query: string) {
  return splitByQuery(text, query);
}

function escapeRegExp(value: string) {
  // $& means the whole matched string
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
