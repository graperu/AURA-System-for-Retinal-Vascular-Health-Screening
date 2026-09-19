import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, path.resolve(__dirname, '..'), ['VITE_', 'FIREBASE_', 'GOOGLE_', 'REACT_APP_']);
  const localEnv = loadEnv(mode, __dirname, ['VITE_', 'FIREBASE_', 'GOOGLE_', 'REACT_APP_']);
  const mergedEnv = { ...rootEnv, ...localEnv };

  return {
    plugins: [react()],
    envDir: path.resolve(__dirname, '..'),
    envPrefix: ['VITE_', 'FIREBASE_', 'GOOGLE_', 'REACT_APP_'],
    define: {
      'process.env': JSON.stringify(mergedEnv),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      target: 'esnext',
      minify: 'esbuild',
      cssCodeSplit: true,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('firebase')) {
                return 'vendor-firebase';
              }
              if (id.includes('@supabase')) {
                return 'vendor-supabase';
              }
              if (id.includes('framer-motion')) {
                return 'vendor-motion';
              }
            }
          },
        },
      },
    },
    server: {
      port: 3000,
      open: true,
      proxy: {
        '/api': {
          target: 'http://localhost:8081',
          changeOrigin: true,
          secure: false,
        },
        '/ws-aura-raw': {
          target: 'http://localhost:8081',
          ws: true,
          changeOrigin: true,
        },
        '/ws-aura': {
          target: 'http://localhost:8081',
          ws: true,
          changeOrigin: true,
        },
      },
    },
  };
});
