/**
 * Forces HTTPS on all non-local environments while preserving pathname, query params, and hash.
 */
export function enforceHttps(): void {
  if (typeof window === 'undefined') return;
  const { protocol, hostname, pathname, search, hash } = window.location;
  const isLocalHost =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname === '0.0.0.0' ||
    /^192\.168\./.test(hostname) ||
    /^10\./.test(hostname) ||
    hostname.endsWith('.local');

  if (protocol === 'http:' && !isLocalHost) {
    window.location.replace(`https://${hostname}${pathname}${search}${hash}`);
  }
}
