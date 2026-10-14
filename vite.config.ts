import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'

// Tira a fonte da landing (Syne latin) da cadeia doc -> CSS -> fonte e evita a
// troca fallback -> Geist (font-display: swap desloca todo o UI): o preload
// começa junto com o CSS e usa os nomes com hash gerados no build.
function preloadFonts(): Plugin {
  return {
    name: 'preload-fonts',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const fonts = Object.keys(ctx.bundle ?? {}).filter((file) =>
          /syne-latin-.*\.woff2$|geist-latin-wght-normal-.*\.woff2$/.test(file),
        )
        if (!fonts.length) return html
        return html.replace(
          '</head>',
          fonts
            .map(
              (font) =>
                `  <link rel="preload" as="font" type="font/woff2" crossorigin href="/${font}">`,
            )
            .join('\n') + '\n</head>',
        )
      },
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), preloadFonts()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
})
