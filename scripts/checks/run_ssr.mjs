import { createServer } from 'vite'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('../../', import.meta.url))
const server = await createServer({
  root,
  configFile: false,
  plugins: [(await import('@vitejs/plugin-react')).default()],
  ssr: { external: ['react', 'react-dom', 'react-dom/server'] },
  server: { middlewareMode: true, hmr: false },
  logLevel: 'error',
  appType: 'custom',
})
try {
  await server.ssrLoadModule('/scripts/checks/render_check.tsx')
} finally {
  await server.close()
}
