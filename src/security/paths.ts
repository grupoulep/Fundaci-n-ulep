/**
 * Resolves internal links and static asset paths against Vite's configured base URL.
 * Blocks unsafe URL schemes and upgrades any accidental HTTP URL to HTTPS.
 */
export function withBase(path: string): string {
  if (!path || path === '#') return path;

  const trimmed = path.trim();
  if (/^(javascript:|vbscript:|data:)/i.test(trimmed)) {
    return '#';
  }
  if (/^http:\/\//i.test(trimmed)) {
    return trimmed.replace(/^http:\/\//i, 'https://');
  }
  if (/^(https:|mailto:|tel:|#)/i.test(trimmed)) {
    return trimmed;
  }

  const base = import.meta.env.BASE_URL || '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;

  if (trimmed === '/') return normalizedBase;
  const cleanPath = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
  return `${normalizedBase}${cleanPath}`;
}
