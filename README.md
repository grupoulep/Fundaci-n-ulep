# Sitio Web Institucional – Fundación ULEP

Portal web oficial de **Fundación ULEP** desarrollado con React, TypeScript, Vite y Tailwind CSS, listo para desplegarse automáticamente en **GitHub Pages** mediante GitHub Actions.

## Despliegue automático en GitHub Pages

El proyecto incluye el flujo de integración continua en `.github/workflows/deploy.yml`, configurado para compilar todas las páginas del sitio y detectar automáticamente si se publica en un subdirectorio (`https://<usuario>.github.io/<repositorio>/`) o en un dominio personalizado (`https://fundacionulep.fun`).

### Pasos para activar el despliegue

1. Sube este proyecto a un repositorio en GitHub (en la rama `main` o `master`).
2. En tu repositorio de GitHub, ve a **Settings → Pages**.
3. En **Build and deployment → Source**, selecciona **GitHub Actions**.
4. Cada vez que hagas `push` a `main` o `master` (o ejecutes el flujo manualmente desde la pestaña **Actions**), el sitio se compilará y publicará automáticamente.

### Dominio personalizado (opcional)

Si deseas conectarlo a `fundacionulep.fun`:

1. En **Settings → Pages → Custom domain**, escribe `fundacionulep.fun` y guarda.
2. Configura los registros DNS (`A` o `CNAME`) en tu proveedor de dominio apuntando a GitHub Pages y habilita **Enforce HTTPS**.

## Desarrollo local

```bash
npm install
npm run dev
```

## Compilación de producción

```bash
npm run build
```
