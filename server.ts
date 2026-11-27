import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import express, { type Request, type Response } from 'express';
import { createServer as createViteServer } from 'vite';
import {
  claimAdminCredentialsOnce,
  createPazYSalvo,
  deletePaymentByCedula,
  deletePazYSalvoById,
  getPaymentByCedula,
  getPazYSalvoById,
  getStoredAdminCredentials,
  listAllPazYSalvos,
  listAuditLogs,
  listPayments,
  listPublishedPazYSalvos,
  recordAuditLog,
  togglePaymentPaid,
  updatePazYSalvo,
  upsertPayment,
} from './src/db/tramites.ts';
import { PRIMARY_ADMIN_EMAIL } from './src/db/users.ts';
import { adminAuth } from './src/lib/firebase-admin.ts';
import {
  createAdminGuard,
  extractBearerToken,
  requireAuth,
  type AuthRequest,
} from './src/middleware/auth.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000;

interface SessionRecord {
  expiresAt: number;
}

const activeSessions = new Map<string, SessionRecord>();
const SESSION_TTL_MS = 4 * 60 * 60 * 1000;

// Per-IP brute-force protection for login attempts
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_LOGIN_ATTEMPTS = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

const CEDULA_REGEX = /^[0-9]{5,15}$/;
const DATE_REGEX = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
const TIMEZONE_REGEX = /^[A-Za-z0-9_/+.-]{1,64}$/;
const LOCALE_REGEX = /^[A-Za-z0-9_-]{2,20}$/;
const SCREEN_REGEX = /^[0-9]{2,5}x[0-9]{2,5}$/;
const GEO_COORD_REGEX = /^-?[0-9]{1,2}\.[0-9]{1,5},\s*-?[0-9]{1,3}\.[0-9]{1,5}$/;
const MAX_BULK_ROWS = 500;

const TIMEZONE_LOCATION_MAP: Record<string, string> = {
  'America/Bogota': 'Colombia (Bogotá / Hora local)',
  'America/Lima': 'Perú (Lima / Hora local)',
  'America/Guayaquil': 'Ecuador (Guayaquil / Hora local)',
  'America/Caracas': 'Venezuela (Caracas / Hora local)',
  'America/Panama': 'Panamá (Hora local)',
  'America/Mexico_City': 'México (Ciudad de México / Hora local)',
  'America/Santiago': 'Chile (Santiago / Hora local)',
  'America/Argentina/Buenos_Aires': 'Argentina (Buenos Aires / Hora local)',
  'America/New_York': 'Estados Unidos (Este / Hora local)',
  'America/Los_Angeles': 'Estados Unidos (Pacífico / Hora local)',
  'Europe/Madrid': 'España (Madrid / Hora local)',
};

function sanitizeHeaderValue(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[\r\n\t\x00-\x1f\x7f]/g, ' ').trim().slice(0, maxLen);
}

function extractClientIp(req: Request): string {
  const xff = req.headers['x-forwarded-for'];
  const cfIp = req.headers['cf-connecting-ip'];
  const realIp = req.headers['x-real-ip'];

  let raw = '';
  if (typeof xff === 'string' && xff.trim()) {
    raw = xff.split(',')[0].trim();
  } else if (Array.isArray(xff) && xff.length > 0) {
    raw = xff[0].split(',')[0].trim();
  } else if (typeof cfIp === 'string' && cfIp.trim()) {
    raw = cfIp.trim();
  } else if (typeof realIp === 'string' && realIp.trim()) {
    raw = realIp.trim();
  } else {
    raw = req.socket?.remoteAddress || req.ip || '';
  }

  const normalized = raw.replace(/^::ffff:/i, '').trim();
  return sanitizeHeaderValue(normalized || 'No disponible', 80);
}

function parseDeviceInfo(userAgent: string): string {
  const ua = userAgent || '';
  let browser = 'Navegador desconocido';
  if (/Edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/OPR\/|Opera/i.test(ua)) browser = 'Opera';
  else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) browser = 'Google Chrome';
  else if (/Firefox\//i.test(ua)) browser = 'Mozilla Firefox';
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = 'Safari';

  let os = 'Sistema desconocido';
  if (/Windows NT 10\.0/i.test(ua)) os = 'Windows 10/11';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Mac OS X|Macintosh/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  let formFactor = 'Escritorio';
  if (/iPad|Tablet/i.test(ua)) formFactor = 'Tablet';
  else if (/Mobile|Android|iPhone/i.test(ua)) formFactor = 'Móvil';

  return `${browser} · ${os} (${formFactor})`;
}

function deriveLocationFromTimezone(tz: string): string {
  if (!tz) return '';
  if (TIMEZONE_LOCATION_MAP[tz]) return TIMEZONE_LOCATION_MAP[tz];
  const parts = tz.split('/');
  if (parts.length >= 2) {
    const city = parts[parts.length - 1].replace(/_/g, ' ');
    const region = parts[0].replace(/_/g, ' ');
    return `${city}, ${region} (zona horaria)`;
  }
  return tz;
}

function extractAuditContext(req: Request) {
  const ipAddress = extractClientIp(req);
  const userAgent = sanitizeHeaderValue(req.headers['user-agent'], 300);
  const deviceInfo = parseDeviceInfo(userAgent);

  const rawTz = sanitizeHeaderValue(req.headers['x-audit-timezone'], 64);
  const timezone = TIMEZONE_REGEX.test(rawTz) ? rawTz : '';

  const rawLocaleHeader = sanitizeHeaderValue(req.headers['x-audit-locale'], 20);
  const acceptLang = sanitizeHeaderValue(req.headers['accept-language'], 60)
    .split(',')[0]
    ?.split(';')[0]
    ?.trim();
  const localeCandidate = rawLocaleHeader || acceptLang || '';
  const locale = LOCALE_REGEX.test(localeCandidate) ? localeCandidate : '';

  const rawScreen = sanitizeHeaderValue(req.headers['x-audit-screen'], 30);
  const screenInfo = SCREEN_REGEX.test(rawScreen) ? rawScreen : '';

  const rawGeo = sanitizeHeaderValue(req.headers['x-audit-geo'], 60);
  const validGeo = GEO_COORD_REGEX.test(rawGeo) ? rawGeo : '';

  // Read trusted proxy geolocation headers when provided by Cloud Run / Google Frontend / Cloudflare
  const city =
    sanitizeHeaderValue(req.headers['x-appengine-city'], 60) ||
    sanitizeHeaderValue(req.headers['cf-ipcity'], 60) ||
    sanitizeHeaderValue(req.headers['x-vercel-ip-city'], 60);
  const region =
    sanitizeHeaderValue(req.headers['x-appengine-region'], 60) ||
    sanitizeHeaderValue(req.headers['cf-region'], 60) ||
    sanitizeHeaderValue(req.headers['x-vercel-ip-country-region'], 60);
  const country =
    sanitizeHeaderValue(req.headers['x-appengine-country'], 40) ||
    sanitizeHeaderValue(req.headers['cf-ipcountry'], 40) ||
    sanitizeHeaderValue(req.headers['x-vercel-ip-country'], 40);

  const proxyParts = [city, region, country].filter(
    (part) => part && part.toLowerCase() !== 'zz' && part.toLowerCase() !== 'unknown'
  );
  const proxyLocation = proxyParts.join(', ');

  let location = '';
  if (proxyLocation && validGeo) {
    location = `${proxyLocation} · GPS (${validGeo})`;
  } else if (validGeo) {
    const tzHint = deriveLocationFromTimezone(timezone);
    location = tzHint ? `GPS (${validGeo}) · ${tzHint}` : `GPS (${validGeo})`;
  } else if (proxyLocation) {
    location = proxyLocation;
  } else {
    location = deriveLocationFromTimezone(timezone) || 'No determinada';
  }

  const requestMethod = sanitizeHeaderValue(`${req.method} ${req.path}`, 120);

  return {
    ipAddress,
    location,
    deviceInfo,
    userAgent,
    timezone: timezone || 'No disponible',
    locale: locale || 'No disponible',
    screenInfo: screenInfo || 'No disponible',
    requestMethod,
  };
}

function scryptDigest(value: string, salt: string): Buffer {
  return crypto.scryptSync(value, salt, 32);
}

function sha256Digest(value: string): Buffer {
  return crypto.createHash('sha256').update(value, 'utf8').digest();
}

function safeEqualStrings(a: string, b: string): boolean {
  return crypto.timingSafeEqual(sha256Digest(a), sha256Digest(b));
}

function hasEnvCredentials(): boolean {
  return Boolean(process.env.ADMIN_USERNAME?.trim() && process.env.ADMIN_PASSWORD?.trim());
}

async function isAdminConfigured(): Promise<boolean> {
  if (hasEnvCredentials()) return true;
  const stored = await getStoredAdminCredentials();
  return stored !== null;
}

async function verifyCredentials(username: string, password: string): Promise<boolean> {
  if (hasEnvCredentials()) {
    const envUser = process.env.ADMIN_USERNAME!.trim();
    const envPass = process.env.ADMIN_PASSWORD!.trim();
    const userOk = safeEqualStrings(username, envUser);
    const passOk = safeEqualStrings(password, envPass);
    return userOk && passOk;
  }

  const stored = await getStoredAdminCredentials();
  if (!stored) return false;

  const userBuf = scryptDigest(username, stored.salt);
  const passBuf = scryptDigest(password, stored.salt);
  const expectedUser = Buffer.from(stored.usernameHash, 'hex');
  const expectedPass = Buffer.from(stored.passwordHash, 'hex');

  if (userBuf.length !== expectedUser.length || passBuf.length !== expectedPass.length) {
    return false;
  }

  const userOk = crypto.timingSafeEqual(userBuf, expectedUser);
  const passOk = crypto.timingSafeEqual(passBuf, expectedPass);
  return userOk && passOk;
}

function createSessionToken(): string {
  const now = Date.now();
  for (const [token, record] of activeSessions.entries()) {
    if (record.expiresAt <= now) {
      activeSessions.delete(token);
    }
  }
  const token = crypto.randomBytes(32).toString('hex');
  activeSessions.set(token, { expiresAt: now + SESSION_TTL_MS });
  return token;
}

function isValidSessionToken(token: string): boolean {
  const record = activeSessions.get(token);
  if (!record) return false;
  if (record.expiresAt <= Date.now()) {
    activeSessions.delete(token);
    return false;
  }
  return true;
}

async function isAuthenticatedAdminRequest(req: Request): Promise<boolean> {
  const token = extractBearerToken(req);
  if (!token) return false;
  if (isValidSessionToken(token)) return true;

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const email = decoded.email?.trim().toLowerCase() ?? '';
    return decoded.email_verified === true && email === PRIMARY_ADMIN_EMAIL;
  } catch {
    return false;
  }
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || entry.resetAt <= now) {
    loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_LOGIN_ATTEMPTS) {
    return false;
  }
  entry.count += 1;
  return true;
}

function validateHttpsUrl(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (trimmed.length < 8 || trimmed.length > 500) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function parsePaidFlag(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return (
    normalized === 'si' ||
    normalized === 'pagado' ||
    normalized === 'true' ||
    normalized === '1' ||
    normalized === 'yes'
  );
}

function formatActorLabel(req: AuthRequest): string {
  if (req.user?.email) return req.user.email;
  return req.adminActor || 'Administrador';
}

function serializePayment(row: {
  cedula: string;
  reference: string;
  amount: string;
  concept: string;
  isPaid: boolean;
  hasDueDate: boolean;
  dueDate: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    cedula: row.cedula,
    reference: row.reference,
    amount: row.amount,
    concept: row.concept,
    isPaid: row.isPaid,
    hasDueDate: row.hasDueDate,
    dueDate: row.dueDate,
    updatedBy: row.updatedBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function serializePazYSalvo(row: {
  id: number;
  registrationNumber: string;
  name: string;
  description: string;
  downloadUrl: string;
  isPublished: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    registrationNumber: row.registrationNumber,
    name: row.name,
    description: row.description,
    downloadUrl: row.downloadUrl,
    isPublished: row.isPublished,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function serializeAuditLog(row: {
  id: number;
  action: string;
  module: string;
  targetKey: string;
  actor: string;
  summary: string;
  details: string;
  ipAddress: string;
  location: string;
  deviceInfo: string;
  userAgent: string;
  timezone: string;
  locale: string;
  screenInfo: string;
  requestMethod: string;
  createdAt: Date;
}) {
  return {
    id: row.id,
    action: row.action,
    module: row.module,
    targetKey: row.targetKey,
    actor: row.actor,
    summary: row.summary,
    details: row.details,
    ipAddress: row.ipAddress,
    location: row.location,
    deviceInfo: row.deviceInfo,
    userAgent: row.userAgent,
    timezone: row.timezone,
    locale: row.locale,
    screenInfo: row.screenInfo,
    requestMethod: row.requestMethod,
    createdAt: row.createdAt.toISOString(),
  };
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', true);
  app.use(express.json({ limit: '512kb' }));

  const requireAdmin = createAdminGuard(isValidSessionToken);

  // Firebase Auth user verification & Cloud SQL user sync
  app.get('/api/auth/me', requireAuth, async (req: AuthRequest, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    const email = req.user?.email?.trim().toLowerCase() ?? '';
    const isAdmin = req.user?.email_verified === true && email === PRIMARY_ADMIN_EMAIL;

    const auditContext = isAdmin ? extractAuditContext(req) : undefined;

    if (isAdmin && req.query.auditLogin === '1' && auditContext) {
      await recordAuditLog({
        action: 'INICIO_SESION',
        module: 'ACCESO',
        targetKey: email,
        actor: email,
        summary: 'Inició sesión en el panel administrativo mediante Google autorizado',
        details: 'Autenticación verificada con Firebase Auth',
        ...auditContext,
      });
    }

    res.json({
      uid: req.user?.uid,
      email,
      isAdmin,
      ...(auditContext ? { auditContext } : {}),
    });
  });

  // ADMIN: Return real server-detected IP, approximate location, and device metadata for Firestore audit entries
  app.get('/api/admin/audit-context', requireAdmin, (req: AuthRequest, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      actor: formatActorLabel(req),
      ...extractAuditContext(req),
    });
  });

  // Admin auth status
  app.get('/api/admin/status', async (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    try {
      const configured = await isAdminConfigured();
      const authenticated = await isAuthenticatedAdminRequest(req);
      res.json({ configured, authenticated });
    } catch (error) {
      console.error('Admin status check failed:', error);
      res.status(500).json({ error: 'No se pudo verificar el estado de acceso.' });
    }
  });

  // One-time atomic first-run admin credential claim when env vars are unset
  app.post('/api/admin/setup', async (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    try {
      if (await isAdminConfigured()) {
        res.status(409).json({ error: 'El acceso administrativo ya se encuentra configurado.' });
        return;
      }

      const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
      const password = typeof req.body?.password === 'string' ? req.body.password.trim() : '';

      if (
        username.length < 4 ||
        username.length > 80 ||
        password.length < 6 ||
        password.length > 128
      ) {
        res.status(400).json({
          error: 'Ingresa un usuario (mín. 4 caracteres) y una contraseña válida (mín. 6 caracteres).',
        });
        return;
      }

      const salt = crypto.randomBytes(16).toString('hex');
      const usernameHash = scryptDigest(username, salt).toString('hex');
      const passwordHash = scryptDigest(password, salt).toString('hex');
      const claimed = await claimAdminCredentialsOnce(salt, usernameHash, passwordHash);

      if (!claimed) {
        res.status(409).json({ error: 'El acceso administrativo ya fue configurado.' });
        return;
      }

      const token = createSessionToken();
      await recordAuditLog({
        action: 'INICIO_SESION',
        module: 'ACCESO',
        targetKey: 'Configuración inicial',
        actor: 'admin-panel',
        summary: 'Activó credenciales administrativas e inició sesión',
        details: 'Primer ingreso al panel administrativo',
        ...extractAuditContext(req),
      });

      res.status(201).json({ ok: true, token });
    } catch (error) {
      console.error('Admin setup failed:', error);
      res.status(500).json({ error: 'No se pudo completar la configuración inicial.' });
    }
  });

  // Admin login
  app.post('/api/admin/login', async (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    const clientIp = extractClientIp(req);
    if (!checkRateLimit(clientIp)) {
      res.status(429).json({
        error: 'Demasiados intentos fallidos. Espera unos minutos antes de volver a intentarlo.',
      });
      return;
    }

    try {
      if (!(await isAdminConfigured())) {
        res.status(400).json({ error: 'Primero configura las credenciales administrativas.' });
        return;
      }

      const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
      const password = typeof req.body?.password === 'string' ? req.body.password.trim() : '';

      if (!username || !password || username.length > 128 || password.length > 128) {
        res.status(400).json({ error: 'Usuario y contraseña requeridos.' });
        return;
      }

      const ok = await verifyCredentials(username, password);
      if (!ok) {
        res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
        return;
      }

      loginAttempts.delete(clientIp);
      const token = createSessionToken();

      await recordAuditLog({
        action: 'INICIO_SESION',
        module: 'ACCESO',
        targetKey: 'Panel administrativo',
        actor: 'admin-panel',
        summary: 'Inició sesión en el panel administrativo',
        details: 'Acceso verificado con credenciales administrativas',
        ...extractAuditContext(req),
      });

      res.json({ ok: true, token });
    } catch (error) {
      console.error('Admin login failed:', error);
      res.status(500).json({ error: 'No se pudo verificar el acceso en este momento.' });
    }
  });

  // Admin logout
  app.post('/api/admin/logout', async (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    const token = extractBearerToken(req);
    const wasValid = token ? isValidSessionToken(token) : false;
    if (token) {
      activeSessions.delete(token);
    }

    if (wasValid) {
      await recordAuditLog({
        action: 'CIERRE_SESION',
        module: 'ACCESO',
        targetKey: 'Panel administrativo',
        actor: 'admin-panel',
        summary: 'Cerró sesión en el panel administrativo',
        details: 'Sesión finalizada manualmente',
        ...extractAuditContext(req),
      });
    }

    res.json({ ok: true });
  });

  // PUBLIC: Exact-cedula payment lookup (no public list endpoint to prevent enumeration)
  app.get('/api/public/payments/:cedula', async (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    const rawCedula = String(req.params.cedula ?? '').replace(/\D/g, '');
    if (!CEDULA_REGEX.test(rawCedula)) {
      res.status(400).json({
        error: 'Ingresa un número de cédula válido (solo dígitos, entre 5 y 15 números).',
      });
      return;
    }

    try {
      const record = await getPaymentByCedula(rawCedula);
      if (!record) {
        res.status(404).json({ found: false, payment: null });
        return;
      }
      res.json({ found: true, payment: serializePayment(record) });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'No se pudo consultar el estado de pago.';
      res.status(500).json({ error: message });
    }
  });

  // PUBLIC: Published Paz y Salvo catalog
  app.get('/api/public/paz-y-salvos', async (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    try {
      const rows = await listPublishedPazYSalvos();
      res.json({ items: rows.map(serializePazYSalvo) });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'No se pudo cargar el listado de Paz y Salvo.';
      res.status(500).json({ error: message });
    }
  });

  // ADMIN: List audit logs
  app.get('/api/admin/audit-logs', requireAdmin, async (_req: AuthRequest, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    try {
      const rows = await listAuditLogs(200);
      res.json({ items: rows.map(serializeAuditLog) });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'No se pudo cargar el historial de auditoría.';
      res.status(500).json({ error: message });
    }
  });

  // ADMIN: Record CSV report export in audit trail
  app.post('/api/admin/audit-logs/export', requireAdmin, async (req: AuthRequest, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    const rawModule = String(req.body?.module ?? '').trim().toUpperCase();
    const allowedModules = new Set(['PAGOS', 'PAZ_Y_SALVO', 'AUDITORIA']);
    if (!allowedModules.has(rawModule)) {
      res.status(400).json({ error: 'Módulo de exportación inválido.' });
      return;
    }

    const recordCount = Number.parseInt(String(req.body?.recordCount ?? '0'), 10);
    const safeCount = Number.isInteger(recordCount) && recordCount >= 0 ? recordCount : 0;
    const moduleTyped = rawModule as 'PAGOS' | 'PAZ_Y_SALVO' | 'AUDITORIA';
    const moduleLabel =
      moduleTyped === 'PAGOS'
        ? 'Pagos'
        : moduleTyped === 'PAZ_Y_SALVO'
        ? 'Paz y Salvo'
        : 'Auditoría';

    try {
      const actor = formatActorLabel(req);
      await recordAuditLog({
        action: 'EXPORTAR',
        module: moduleTyped,
        targetKey: `Reporte CSV (${safeCount} reg.)`,
        actor,
        summary: `Exportó reporte CSV de ${moduleLabel}`,
        details: `Total de registros exportados: ${safeCount}`,
        ...extractAuditContext(req),
      });
      res.status(201).json({ ok: true });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'No se pudo registrar la exportación.';
      res.status(500).json({ error: message });
    }
  });

  // ADMIN: List all registered payments
  app.get('/api/admin/payments', requireAdmin, async (_req: AuthRequest, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    try {
      const rows = await listPayments();
      res.json({ items: rows.map(serializePayment) });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'No se pudieron cargar los pagos registrados.';
      res.status(500).json({ error: message });
    }
  });

  // ADMIN: Create or update payment record by cedula
  app.post('/api/admin/payments', requireAdmin, async (req: AuthRequest, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    const cleanCedula = String(req.body?.cedula ?? '').replace(/\D/g, '');
    const cleanRef =
      typeof req.body?.reference === 'string' ? req.body.reference.trim().slice(0, 60) : '';
    const cleanAmount =
      typeof req.body?.amount === 'string' ? req.body.amount.trim().slice(0, 40) : '';
    const cleanConcept =
      typeof req.body?.concept === 'string' ? req.body.concept.trim().slice(0, 160) : '';
    const isPaid = Boolean(req.body?.isPaid);
    const hasDueDate = Boolean(req.body?.hasDueDate);
    const cleanDueDate =
      hasDueDate && typeof req.body?.dueDate === 'string' ? req.body.dueDate.trim() : '';

    if (!CEDULA_REGEX.test(cleanCedula)) {
      res.status(400).json({
        error: 'Ingresa un número de cédula válido (solo dígitos, entre 5 y 15 números).',
      });
      return;
    }

    if (!cleanRef) {
      res.status(400).json({ error: 'Ingresa el número de referencia del pago.' });
      return;
    }

    if (hasDueDate && !DATE_REGEX.test(cleanDueDate)) {
      res.status(400).json({
        error: 'Selecciona una fecha límite válida o marca la opción "Sin fecha límite".',
      });
      return;
    }

    try {
      const actor = formatActorLabel(req);
      const auditCtx = extractAuditContext(req);
      const existing = await getPaymentByCedula(cleanCedula);
      const saved = await upsertPayment({
        cedula: cleanCedula,
        reference: cleanRef,
        amount: cleanAmount,
        concept: cleanConcept,
        isPaid,
        hasDueDate,
        dueDate: hasDueDate ? cleanDueDate : '',
        updatedBy: actor,
      });

      if (existing) {
        const changes: string[] = [];
        if (existing.reference !== saved.reference) {
          changes.push(`Ref: ${existing.reference} → ${saved.reference}`);
        }
        if (existing.amount !== saved.amount) {
          changes.push(`Valor: ${existing.amount || 'Sin valor'} → ${saved.amount || 'Sin valor'}`);
        }
        if (existing.concept !== saved.concept) {
          changes.push(
            `Concepto: ${existing.concept || 'Sin concepto'} → ${saved.concept || 'Sin concepto'}`
          );
        }
        if (existing.isPaid !== saved.isPaid) {
          changes.push(
            `Estado: ${existing.isPaid ? 'Pagado' : 'Pendiente'} → ${
              saved.isPaid ? 'Pagado' : 'Pendiente'
            }`
          );
        }
        const prevDue = existing.hasDueDate ? existing.dueDate : 'Sin fecha límite';
        const nextDue = saved.hasDueDate ? saved.dueDate : 'Sin fecha límite';
        if (prevDue !== nextDue) {
          changes.push(`Fecha límite: ${prevDue} → ${nextDue}`);
        }

        await recordAuditLog({
          action: 'EDITAR',
          module: 'PAGOS',
          targetKey: cleanCedula,
          actor,
          summary: `Editó el registro de pago de la cédula ${cleanCedula}`,
          details:
            changes.length > 0
              ? changes.join(' · ')
              : `Guardó sin cambios visibles (Ref: ${saved.reference})`,
          ...auditCtx,
        });
      } else {
        await recordAuditLog({
          action: 'CREAR',
          module: 'PAGOS',
          targetKey: cleanCedula,
          actor,
          summary: `Registró un pago para la cédula ${cleanCedula}`,
          details: `Ref: ${saved.reference} · Estado: ${
            saved.isPaid ? 'Pagado' : 'Pendiente por pagar'
          }${saved.amount ? ` · Valor: ${saved.amount}` : ''} · ${
            saved.hasDueDate ? `Fecha límite: ${saved.dueDate}` : 'Sin fecha límite'
          }`,
          ...auditCtx,
        });
      }

      res.status(200).json({ payment: serializePayment(saved) });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'No se pudo guardar el registro de pago.';
      res.status(500).json({ error: message });
    }
  });

  // ADMIN: Bulk import payments from template rows
  app.post('/api/admin/payments/bulk', requireAdmin, async (req: AuthRequest, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : null;
    if (!rows || rows.length === 0) {
      res.status(400).json({ error: 'El archivo no contiene filas válidas para cargar.' });
      return;
    }
    if (rows.length > MAX_BULK_ROWS) {
      res.status(400).json({
        error: `Solo se permiten hasta ${MAX_BULK_ROWS} registros por archivo.`,
      });
      return;
    }

    const actor = formatActorLabel(req);
    const auditCtx = extractAuditContext(req);
    let createdCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    try {
      for (let i = 0; i < rows.length; i += 1) {
        const raw = rows[i] as Record<string, unknown>;
        const rowNum = i + 2;
        const cleanCedula = String(raw?.cedula ?? '').replace(/\D/g, '');
        const cleanRef = String(raw?.reference ?? '').trim().slice(0, 60);
        const cleanAmount = String(raw?.amount ?? '').trim().slice(0, 40);
        const cleanConcept = String(raw?.concept ?? '').trim().slice(0, 160);
        const isPaid = parsePaidFlag(raw?.isPaid);
        const rawDue = String(raw?.dueDate ?? '').trim();
        const normalizedDue = rawDue.toLowerCase();
        const noDate =
          !rawDue ||
          normalizedDue === 'sin fecha' ||
          normalizedDue === 'sin fecha limite' ||
          normalizedDue === 'sin fecha límite' ||
          normalizedDue === 'n/a' ||
          normalizedDue === '-';

        if (!CEDULA_REGEX.test(cleanCedula)) {
          errors.push(`Fila ${rowNum}: cédula inválida.`);
          continue;
        }
        if (!cleanRef) {
          errors.push(`Fila ${rowNum} (C.C. ${cleanCedula}): falta la referencia.`);
          continue;
        }
        if (!noDate && !DATE_REGEX.test(rawDue)) {
          errors.push(
            `Fila ${rowNum} (C.C. ${cleanCedula}): fecha límite debe usar formato AAAA-MM-DD o dejarse vacía.`
          );
          continue;
        }

        const existed = await getPaymentByCedula(cleanCedula);
        await upsertPayment({
          cedula: cleanCedula,
          reference: cleanRef,
          amount: cleanAmount,
          concept: cleanConcept,
          isPaid,
          hasDueDate: !noDate,
          dueDate: noDate ? '' : rawDue,
          updatedBy: actor,
        });

        if (existed) {
          updatedCount += 1;
        } else {
          createdCount += 1;
        }
      }

      const processed = createdCount + updatedCount;
      if (processed > 0) {
        await recordAuditLog({
          action: 'CARGA_MASIVA',
          module: 'PAGOS',
          targetKey: `${processed} usuario(s)`,
          actor,
          summary: `Cargó masivamente ${processed} registro(s) en Pagos`,
          details: `Nuevos: ${createdCount} · Actualizados: ${updatedCount} · Omitidos: ${errors.length}`,
          ...auditCtx,
        });
      }

      const allPayments = await listPayments();
      res.json({
        createdCount,
        updatedCount,
        skippedCount: errors.length,
        errors: errors.slice(0, 10),
        items: allPayments.map(serializePayment),
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'No se pudo completar la carga masiva de pagos.';
      res.status(500).json({ error: message });
    }
  });

  // ADMIN: Toggle payment paid status
  app.patch(
    '/api/admin/payments/:cedula/toggle',
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
      res.setHeader('Cache-Control', 'no-store');
      const cleanCedula = String(req.params.cedula ?? '').replace(/\D/g, '');
      if (!CEDULA_REGEX.test(cleanCedula)) {
        res.status(400).json({ error: 'Cédula inválida.' });
        return;
      }

      try {
        const actor = formatActorLabel(req);
        const result = await togglePaymentPaid(cleanCedula, actor);
        if (!result) {
          res.status(404).json({ error: 'Registro de pago no encontrado.' });
          return;
        }

        await recordAuditLog({
          action: 'CAMBIAR_ESTADO',
          module: 'PAGOS',
          targetKey: cleanCedula,
          actor,
          summary: `Cambió el estado de pago de la cédula ${cleanCedula}`,
          details: `${result.previous.isPaid ? 'Pagado' : 'Pendiente por pagar'} → ${
            result.updated.isPaid ? 'Pagado' : 'Pendiente por pagar'
          } · Ref: ${result.updated.reference}`,
          ...extractAuditContext(req),
        });

        res.json({ payment: serializePayment(result.updated) });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'No se pudo actualizar el estado del pago.';
        res.status(500).json({ error: message });
      }
    }
  );

  // ADMIN: Delete payment record
  app.delete('/api/admin/payments/:cedula', requireAdmin, async (req: AuthRequest, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    const cleanCedula = String(req.params.cedula ?? '').replace(/\D/g, '');
    if (!CEDULA_REGEX.test(cleanCedula)) {
      res.status(400).json({ error: 'Cédula inválida.' });
      return;
    }

    try {
      const actor = formatActorLabel(req);
      const deleted = await deletePaymentByCedula(cleanCedula);
      if (deleted) {
        await recordAuditLog({
          action: 'ELIMINAR',
          module: 'PAGOS',
          targetKey: cleanCedula,
          actor,
          summary: `Eliminó el registro de pago de la cédula ${cleanCedula}`,
          details: `Ref: ${deleted.reference} · Estado anterior: ${
            deleted.isPaid ? 'Pagado' : 'Pendiente por pagar'
          }${deleted.amount ? ` · Valor: ${deleted.amount}` : ''}`,
          ...extractAuditContext(req),
        });
      }
      res.json({ ok: true });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'No se pudo eliminar el registro de pago.';
      res.status(500).json({ error: message });
    }
  });

  // ADMIN: List all Paz y Salvo entries
  app.get('/api/admin/paz-y-salvos', requireAdmin, async (_req: AuthRequest, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    try {
      const rows = await listAllPazYSalvos();
      res.json({ items: rows.map(serializePazYSalvo) });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudieron cargar los registros de Paz y Salvo.';
      res.status(500).json({ error: message });
    }
  });

  // ADMIN: Create Paz y Salvo entry
  app.post('/api/admin/paz-y-salvos', requireAdmin, async (req: AuthRequest, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    const registrationNumber =
      typeof req.body?.registrationNumber === 'string'
        ? req.body.registrationNumber.trim().slice(0, 60)
        : '';
    const name = typeof req.body?.name === 'string' ? req.body.name.trim().slice(0, 140) : '';
    const description =
      typeof req.body?.description === 'string' ? req.body.description.trim().slice(0, 500) : '';
    const rawUrl = typeof req.body?.downloadUrl === 'string' ? req.body.downloadUrl : '';
    const validUrl = validateHttpsUrl(rawUrl);

    if (!registrationNumber) {
      res.status(400).json({ error: 'Ingresa el número de registro del Paz y Salvo.' });
      return;
    }
    if (!name) {
      res.status(400).json({ error: 'Ingresa el nombre del Paz y Salvo.' });
      return;
    }
    if (!validUrl) {
      res.status(400).json({ error: 'Ingresa un link de descarga válido que inicie con https://' });
      return;
    }

    try {
      const actor = formatActorLabel(req);
      const created = await createPazYSalvo({
        registrationNumber,
        name,
        description,
        downloadUrl: validUrl,
        isPublished: true,
        createdBy: actor,
      });

      await recordAuditLog({
        action: 'CREAR',
        module: 'PAZ_Y_SALVO',
        targetKey: created.registrationNumber,
        actor,
        summary: `Registró el Paz y Salvo "${created.name}"`,
        details: `Registro N.º ${created.registrationNumber} · Link: ${created.downloadUrl}`,
        ...extractAuditContext(req),
      });

      res.status(201).json({ item: serializePazYSalvo(created) });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'No se pudo registrar el Paz y Salvo.';
      res.status(500).json({ error: message });
    }
  });

  // ADMIN: Bulk import Paz y Salvo entries from template rows
  app.post(
    '/api/admin/paz-y-salvos/bulk',
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
      res.setHeader('Cache-Control', 'no-store');
      const rows = Array.isArray(req.body?.rows) ? req.body.rows : null;
      if (!rows || rows.length === 0) {
        res.status(400).json({ error: 'El archivo no contiene filas válidas para cargar.' });
        return;
      }
      if (rows.length > MAX_BULK_ROWS) {
        res.status(400).json({
          error: `Solo se permiten hasta ${MAX_BULK_ROWS} registros por archivo.`,
        });
        return;
      }

      const actor = formatActorLabel(req);
      const auditCtx = extractAuditContext(req);
      let createdCount = 0;
      const errors: string[] = [];

      try {
        for (let i = 0; i < rows.length; i += 1) {
          const raw = rows[i] as Record<string, unknown>;
          const rowNum = i + 2;
          const registrationNumber = String(raw?.registrationNumber ?? '')
            .trim()
            .slice(0, 60);
          const name = String(raw?.name ?? '')
            .trim()
            .slice(0, 140);
          const description = String(raw?.description ?? '')
            .trim()
            .slice(0, 500);
          const validUrl = validateHttpsUrl(String(raw?.downloadUrl ?? ''));

          if (!registrationNumber) {
            errors.push(`Fila ${rowNum}: falta el número de registro.`);
            continue;
          }
          if (!name) {
            errors.push(`Fila ${rowNum} (${registrationNumber}): falta el nombre.`);
            continue;
          }
          if (!validUrl) {
            errors.push(
              `Fila ${rowNum} (${registrationNumber}): link de descarga inválido (debe iniciar con https://).`
            );
            continue;
          }

          await createPazYSalvo({
            registrationNumber,
            name,
            description,
            downloadUrl: validUrl,
            isPublished: true,
            createdBy: actor,
          });
          createdCount += 1;
        }

        if (createdCount > 0) {
          await recordAuditLog({
            action: 'CARGA_MASIVA',
            module: 'PAZ_Y_SALVO',
            targetKey: `${createdCount} registro(s)`,
            actor,
            summary: `Cargó masivamente ${createdCount} registro(s) de Paz y Salvo`,
            details: `Agregados: ${createdCount} · Omitidos: ${errors.length}`,
            ...auditCtx,
          });
        }

        const allItems = await listAllPazYSalvos();
        res.json({
          createdCount,
          skippedCount: errors.length,
          errors: errors.slice(0, 10),
          items: allItems.map(serializePazYSalvo),
        });
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : 'No se pudo completar la carga masiva de Paz y Salvo.';
        res.status(500).json({ error: message });
      }
    }
  );

  // ADMIN: Update Paz y Salvo entry
  app.put('/api/admin/paz-y-salvos/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    const numericId = Number.parseInt(String(req.params.id ?? ''), 10);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      res.status(400).json({ error: 'Identificador inválido.' });
      return;
    }

    const registrationNumber =
      typeof req.body?.registrationNumber === 'string'
        ? req.body.registrationNumber.trim().slice(0, 60)
        : '';
    const name = typeof req.body?.name === 'string' ? req.body.name.trim().slice(0, 140) : '';
    const description =
      typeof req.body?.description === 'string' ? req.body.description.trim().slice(0, 500) : '';
    const rawUrl = typeof req.body?.downloadUrl === 'string' ? req.body.downloadUrl : '';
    const validUrl = validateHttpsUrl(rawUrl);

    if (!registrationNumber || !name || !validUrl) {
      res.status(400).json({
        error: 'Verifica el número de registro, el nombre y el enlace seguro (https://).',
      });
      return;
    }

    try {
      const actor = formatActorLabel(req);
      const previous = await getPazYSalvoById(numericId);
      if (!previous) {
        res.status(404).json({ error: 'Registro de Paz y Salvo no encontrado.' });
        return;
      }

      const updated = await updatePazYSalvo(numericId, {
        registrationNumber,
        name,
        description,
        downloadUrl: validUrl,
        isPublished: true,
      });
      if (!updated) {
        res.status(404).json({ error: 'Registro de Paz y Salvo no encontrado.' });
        return;
      }

      const changes: string[] = [];
      if (previous.registrationNumber !== updated.registrationNumber) {
        changes.push(`Registro: ${previous.registrationNumber} → ${updated.registrationNumber}`);
      }
      if (previous.name !== updated.name) {
        changes.push(`Nombre: ${previous.name} → ${updated.name}`);
      }
      if (previous.description !== updated.description) {
        changes.push('Descripción actualizada');
      }
      if (previous.downloadUrl !== updated.downloadUrl) {
        changes.push('Enlace de descarga actualizado');
      }

      await recordAuditLog({
        action: 'EDITAR',
        module: 'PAZ_Y_SALVO',
        targetKey: updated.registrationNumber,
        actor,
        summary: `Editó el Paz y Salvo "${updated.name}"`,
        details: changes.length > 0 ? changes.join(' · ') : 'Guardó cambios sin modificaciones',
        ...extractAuditContext(req),
      });

      res.json({ item: serializePazYSalvo(updated) });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'No se pudo actualizar el Paz y Salvo.';
      res.status(500).json({ error: message });
    }
  });

  // ADMIN: Delete Paz y Salvo entry
  app.delete(
    '/api/admin/paz-y-salvos/:id',
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
      res.setHeader('Cache-Control', 'no-store');
      const numericId = Number.parseInt(String(req.params.id ?? ''), 10);
      if (!Number.isInteger(numericId) || numericId <= 0) {
        res.status(400).json({ error: 'Identificador inválido.' });
        return;
      }

      try {
        const actor = formatActorLabel(req);
        const deleted = await deletePazYSalvoById(numericId);
        if (deleted) {
          await recordAuditLog({
            action: 'ELIMINAR',
            module: 'PAZ_Y_SALVO',
            targetKey: deleted.registrationNumber,
            actor,
            summary: `Eliminó el Paz y Salvo "${deleted.name}"`,
            details: `Registro N.º ${deleted.registrationNumber}`,
            ...extractAuditContext(req),
          });
        }
        res.json({ ok: true });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'No se pudo eliminar el Paz y Salvo.';
        res.status(500).json({ error: message });
      }
    }
  );

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'mpa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

void startServer();
