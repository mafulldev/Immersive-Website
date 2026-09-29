import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Subcaminho de publicação (GitHub Pages usa /<repo>/). Padrão '/' para Netlify, Vercel e dev.
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three') || id.includes('node_modules/@react-three') || id.includes('node_modules/postprocessing')) {
            return 'world-vendor';
          }
          if (id.includes('node_modules/gsap') || id.includes('node_modules/@gsap')) return 'gsap';
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) return 'react';
          return undefined;
        },
      },
    },
  },
});
