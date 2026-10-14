import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'

// Tira a fonte da landing (Syne latin) da cadeia doc -> CSS -> fonte: o preload
// começa junto com o CSS e usa o nome com hash gerado no build.
function preloadLandingFont(): Plugin {
  return {
    name: 'preload-landing-font',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const font = Object.keys(ctx.bundle ?? {}).find((file) => /syne-latin-.*\.woff2$/.test(file))
        if (!font) return html
        return html.replace(
          '</head>',
          `  <link rel="preload" as="font" type="font/woff2" crossorigin href="/${font}">\n</head>`,
        )
      },
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), preloadLandingFont()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
})
