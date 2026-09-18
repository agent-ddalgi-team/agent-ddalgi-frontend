import { createServer } from 'vite'
const root = process.cwd()
const server = await createServer({ root, configFile: false, plugins: [(await import('@vitejs/plugin-react')).default()], server: { middlewareMode: true, hmr: false }, logLevel: 'error', appType: 'custom' })
try {
  await server.ssrLoadModule('/render_check.tsx')
} finally {
  await server.close()
}
