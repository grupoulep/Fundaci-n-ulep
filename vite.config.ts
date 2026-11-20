import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const rawBase = process.env.VITE_BASE_PATH || '/';
  const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

  return {
    base,
    plugins: [
      react(),
      tailwindcss(),
      // Enforces HTTPS and upgrades insecure requests across all production HTML pages.
      {
        name: 'enforce-https-production',
        apply: 'build',
        transformIndexHtml() {
          return [
            {
              tag: 'meta',
              attrs: {
                'http-equiv': 'Content-Security-Policy',
                content: 'upgrade-insecure-requests',
              },
              injectTo: 'head-prepend',
            },
            {
              tag: 'meta',
              attrs: {
                name: 'referrer',
                content: 'strict-origin-when-cross-origin',
              },
              injectTo: 'head-prepend',
            },
            {
              tag: 'script',
              children:
                "(function(){var h=window.location.hostname;var l=h==='localhost'||h==='127.0.0.1'||h==='[::1]'||h==='0.0.0.0'||/^192\\.168\\./.test(h)||/^10\\./.test(h)||h.endsWith('.local');if(window.location.protocol==='http:'&&!l){window.location.replace('https://'+h+window.location.pathname+window.location.search+window.location.hash);}})();",
              injectTo: 'head-prepend',
            },
          ];
        },
      },
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." (e.g. generate_image output) still resolve
      // in production builds. Do not remove.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const srcAssets = path.resolve(__dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          politicaPrivacidad: path.resolve(__dirname, 'politica-privacidad.html'),
          terminosDeUso: path.resolve(__dirname, 'terminos-de-uso.html'),
          estudiantes: path.resolve(__dirname, 'estudiantes.html'),
          empresa: path.resolve(__dirname, 'empresa.html'),
          tramites: path.resolve(__dirname, 'tramites.html'),
          pqrs: path.resolve(__dirname, 'pqrs.html'),
          donaciones: path.resolve(__dirname, 'donaciones.html'),
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
