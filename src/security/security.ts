const ALLOWED_FORM_HOSTS = new Set(['formsubmit.co', 'www.formsubmit.co']);

/**
 * Forces HTTPS on all public (non-local) hosts while preserving path, query, and hash.
 */
export function enforceHttps(): void {
  if (typeof window === 'undefined') return;
  const { protocol, hostname, port, pathname, search, hash } = window.location;
  const isLocalHost =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname === '0.0.0.0' ||
    /^192\.168\./.test(hostname) ||
    /^10\./.test(hostname) ||
    hostname.endsWith('.local');

  if (protocol === 'http:' && !isLocalHost) {
    const portPart = port && port !== '80' && port !== '443' ? `:${port}` : '';
    window.location.replace(`https://${hostname}${portPart}${pathname}${search}${hash}`);
  }
}

/**
 * Validates and normalizes external URLs, enforcing HTTPS and blocking unsafe schemes.
 */
export function sanitizeExternalUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '#';

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:') {
      parsed.protocol = 'https:';
      return parsed.toString();
    }
    if (parsed.protocol === 'https:' || parsed.protocol === 'mailto:' || parsed.protocol === 'tel:') {
      return parsed.toString();
    }
    return '#';
  } catch {
    return '#';
  }
}

/**
 * Validates form submission endpoints against an HTTPS host allowlist.
 */
export function sanitizeFormAction(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '#';

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:') {
      parsed.protocol = 'https:';
    }
    if (parsed.protocol !== 'https:' || !ALLOWED_FORM_HOSTS.has(parsed.hostname.toLowerCase())) {
      return '#';
    }
    return parsed.toString();
  } catch {
    return '#';
  }
}

/**
 * Validates basic email address format before form submission.
 */
export function isValidEmail(email: string): boolean {
  const value = email.trim();
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

/**
 * Validates phone numbers containing at least 7 digits and safe characters only.
 */
export function isValidPhone(phone: string): boolean {
  const value = phone.trim();
  const digits = value.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15 && /^[+\d\s().-]+$/.test(value);
}
