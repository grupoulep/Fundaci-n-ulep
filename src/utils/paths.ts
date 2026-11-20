/**
 * Resolves internal links and static asset paths against Vite's configured base URL.
 * Works seamlessly both at root ("/") and under a GitHub Pages subpath ("/<repo>/").
 */
export function withBase(path: string): string {
  if (!path || path === '#') return path;
  if (/^(https?:|mailto:|tel:|data:|#)/i.test(path)) return path;

  const base = import.meta.env.BASE_URL || '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;

  if (path === '/') return normalizedBase;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${normalizedBase}${cleanPath}`;
}
