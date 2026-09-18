import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    server: {
      // contracts/contract.md 7절: 프론트/백엔드는 같은 origin이어야 한다.
      // 개발 서버에서는 /api 요청을 백엔드(VITE_API_URL)로 프록시해 같은 origin처럼 동작시킨다.
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
      },
    },
  }
})
