import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

// Web-only root HTML. Loads Lexend (a typeface designed for easy reading)
// and makes it the font for every page.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700;800;900&display=swap"
        />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: globalStyle }} />
        <script dangerouslySetInnerHTML={{ __html: screenScale }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

// The pages are sized in fixed pixels, which look small and spread out on large
// monitors. Scale the whole page up with the screen width (like the browser's
// Ctrl +): 100% up to 1500px wide, up to 150% on very wide screens.
const screenScale = `
(function () {
  function scale() {
    var zoom = Math.min(1.5, Math.max(1, window.innerWidth / 1500));
    document.documentElement.style.zoom = String(zoom);
  }
  scale();
  window.addEventListener("resize", scale);
})();
`;

// React Native Web gives every Text a system font class, so override it here
const globalStyle = `
body { background-color: #f2f4f9; }
body, body *:not(svg):not(path) { font-family: "Lexend", system-ui, -apple-system, "Segoe UI", sans-serif !important; }
`;
