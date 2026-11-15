import { cpSync, existsSync, renameSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Dev server: every page address (no file extension) gets the React app, so unknown ones like /f9 reach
 * the "off course" screen. Vite's own paths start with /@ or /__. The classic game is at /index.html.
 */
function devUiRoute() {
  return {
    name: 'dev-ui-route',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const raw = req.url || ''
        const q = raw.indexOf('?')
        const path = q === -1 ? raw : raw.slice(0, q)
        const search = q === -1 ? '' : raw.slice(q)
        const page = !path.startsWith('/@') && !path.startsWith('/__') && !path.slice(path.lastIndexOf('/')).includes('.')
        if (page) req.url = `/dev.html${search}`
        next()
      })
    },
  }
}

/**
 * Production build for Vercel. The React page becomes index.html. The engine scripts in js/ are classic
 * (non-module) scripts that Vite does not bundle, so they are copied as they are. The classic game stays
 * available at /classic as a backup.
 */
function sitePages() {
  let outDir = 'dist-ui'
  return {
    name: 'site-pages',
    apply: 'build',
    configResolved(config) { outDir = resolve(config.root, config.build.outDir) },
    closeBundle() {
      const out = (p) => resolve(outDir, p)
      if (existsSync(out('dev.html'))) renameSync(out('dev.html'), out('index.html'))
      cpSync('js', out('js'), { recursive: true })
      cpSync('index.html', out('classic.html'))
      cpSync('css', out('css'), { recursive: true })
      cpSync('assets', out('assets'), { recursive: true, force: false })
    },
  }
}

export default defineConfig({
  plugins: [devUiRoute(), react(), sitePages()],
  server: { port: 5173 },
  build: {
    outDir: 'dist-ui',
    emptyOutDir: true,
    rollupOptions: { input: 'dev.html' },
  },
})
