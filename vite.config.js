import { defineConfig } from 'vite'

export default defineConfig({
  base: '/Portfolio/',
  server: {
    port: 3000,
    open: true,
  },
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      input: ['index.html', 'nearby.html'],
      output: {
        manualChunks: {
          three: ['three'],
          gsap: ['gsap'],
        },
      },
    },
  },
})
