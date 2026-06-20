import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// TWA builds need relative base paths
const isDev = process.env.NODE_ENV !== 'production';

export default defineConfig({
  plugins: [react()],
  base: isDev ? '/' : './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: isDev,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ton: ['@tonconnect/ui-react'],
        },
      },
    },
  },
});
