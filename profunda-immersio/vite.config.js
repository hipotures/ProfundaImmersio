import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    include: ['aframe', 'js-yaml'], // Also include js-yaml just in case
  },
  // ssr: {
  //   noExternal: ['aframe'] // If we were doing SSR, force bundling
  // }
});
