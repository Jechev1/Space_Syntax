import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** React routes. index.html on disk stays the classic game for the Python server. */
const REACT_PAGES = new Set(['/', '/intro', '/f0', '/f1a', '/f1b', '/f1done', '/f2', '/dev/ui', '/dev/ui/'])

function devUiRoute() {
  return {
    name: 'dev-ui-route',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const raw = req.url || ''
        const q = raw.indexOf('?')
        const path = q === -1 ? raw : raw.slice(0, q)
        const search = q === -1 ? '' : raw.slice(q)
        if (REACT_PAGES.has(path)) req.url = `/dev.html${search}`
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [devUiRoute(), react()],
  server: { port: 5173 },
  build: {
    outDir: 'dist-ui',
    emptyOutDir: true,
    rollupOptions: { input: 'dev.html' },
  },
})
