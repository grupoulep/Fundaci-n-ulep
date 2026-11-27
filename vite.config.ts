import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ command }) => {
  const base = command === 'build' ? './' : '/';

  return {
    base,
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'inject-production-security-headers',
        apply: 'build',
        transformIndexHtml(html: string) {
          const csp = [
            "default-src 'self'",
            "script-src 'self'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' https: data:",
            "font-src 'self' https: data:",
            "connect-src 'self' https://formsubmit.co",
            "form-action 'self' https://formsubmit.co",
            "base-uri 'self'",
            "object-src 'none'",
            'upgrade-insecure-requests',
          ].join('; ');
          const securityMeta = `    <meta http-equiv="Content-Security-Policy" content="${csp}" />`;
          return html.replace(
            '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
            `<meta name="viewport" content="width=device-width, initial-scale=1.0" />\n${securityMeta}`
          );
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      sourcemap: false,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          politicaPrivacidad: path.resolve(__dirname, 'politica-privacidad.html'),
          terminosDeUso: path.resolve(__dirname, 'terminos-de-uso.html'),
          estudiantes: path.resolve(__dirname, 'estudiantes.html'),
          campus: path.resolve(__dirname, 'campus.html'),
          cursos: path.resolve(__dirname, 'cursos.html'),
          empresa: path.resolve(__dirname, 'empresa.html'),
          tramites: path.resolve(__dirname, 'tramites.html'),
          pqrs: path.resolve(__dirname, 'pqrs.html'),
          preguntasFrecuentes: path.resolve(__dirname, 'preguntas-frecuentes.html'),
          transparencia: path.resolve(__dirname, 'transparencia.html'),
          donaciones: path.resolve(__dirname, 'donaciones.html'),
        },
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
