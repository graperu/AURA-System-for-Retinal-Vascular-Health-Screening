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
    envPrefix: ['VITE_', 'FIREBASE_', 'GOOGLE_', 'REACT_APP_'],
    define: {
      'process.env': JSON.stringify(mergedEnv),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
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
