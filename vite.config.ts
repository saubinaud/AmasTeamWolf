import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    proxy: {
      '/api/n8n': {
        target: 'https://pallium-n8n.s6hx3x.easypanel.host',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/n8n/, ''),
        secure: false,
      },
    },
  },
})
