import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['test.reviewchess.in'],
  },
  preview: {
    allowedHosts: ['reviewchess.in', 'code.reviewchess.in', 'api.reviewchess.in'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom')) return 'react';
          if (id.includes('node_modules/react')) return 'react';
          if (id.includes('node_modules/lucide-react')) return 'icons';
          if (id.includes('node_modules/chess.js')) return 'chess';
          if (id.includes('node_modules/react-chessboard')) return 'chess';
          if (id.includes('node_modules')) return 'vendor';
        },
      },
    },
  },
})
