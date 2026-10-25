import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  base: '/',
  build: {
    target: 'es2020',
    cssMinify: true,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          motion: ['motion'],
          ui: ['sonner', 'lucide-react'],
        },
      },
    },
  },
  server: {
    proxy: {
      // API local; API_PROXY permite apuntar a otro puerto (p. ej. 4010). Nunca a producción.
      '/api': {
        target: process.env.API_PROXY || 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
