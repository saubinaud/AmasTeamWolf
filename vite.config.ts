import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import cssLegado from './config/css-legado'

export default defineConfig({
  plugins: [tailwindcss(), react(), cssLegado()],
  base: '/',
  build: {
    // JS: sintaxis que entienden iOS 14 y Chrome 80 (Android viejo). El CSS para
    // navegadores viejos lo resuelve config/css-legado.ts.
    target: ['es2020', 'safari14', 'chrome80', 'firefox78', 'edge88'],
    // La hoja moderna queda igual que antes; la de navegadores viejos es aparte.
    cssTarget: 'es2020',
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
