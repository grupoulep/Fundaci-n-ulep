import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReceiptText,
  FileCheck2,
  FileSpreadsheet,
  ClipboardList,
  MessageSquareWarning,
  Building2,
  LogOut,
  X,
  Plus,
  Trash2,
  Pencil,
  CheckCircle2,
  Clock,
  ExternalLink,
  Search,
  AlertCircle,
  Upload,
  Download,
} from 'lucide-react';
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth';
import {
  auth,
  googleProvider,
  isFirebaseAdminUser,
  PRIMARY_ADMIN_EMAIL,
} from '../security/firebase';
import {
  appendFirestoreAuditLog,
  fetchFirestoreAuditLogsOnce,
  subscribeFirestoreAuditLogs,
  type AuditNetworkContext,
  type FirestoreAuditAction,
  type FirestoreAuditLogRecord,
  type FirestoreAuditModule,
} from '../security/firestoreAudit';
import {
  createPazYSalvoInFirestore,
  deletePaymentInFirestore,
  deletePazYSalvoInFirestore,
  subscribeAdminPayments,
  subscribeAdminPazYSalvos,
  togglePaymentPaidInFirestore,
  updatePazYSalvoInFirestore,
  upsertPaymentInFirestore,
  type PaymentRecord,
  type PazYSalvoRecord,
} from '../security/firestoreTramites';
import {
  deleteEmpresaSubmissionInFirestore,
  deletePqrsSubmissionInFirestore,
  subscribeAdminEmpresaSubmissions,
  subscribeAdminPqrsSubmissions,
  updatePqrsStatusInFirestore,
  type EmpresaSubmissionRecord,
  type PqrsStatus,
  type PqrsSubmissionRecord,
} from '../security/firestoreForms';
import { sanitizeExternalUrl } from '../security/security';
import AuditLogsTableSection from './AuditLogsTableSection';
import AdminPqrsSection from './AdminPqrsSection';
import AdminEmpresaSection from './AdminEmpresaSection';

export type { PaymentRecord, PazYSalvoRecord };

interface AdminPortalOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged?: () => void;
}

type AdminSection =
  | 'pagos'
  | 'paz-y-salvo'
  | 'pqrs'
  | 'form-empresa'
  | 'plantillas'
  | 'auditoria';

const CEDULA_REGEX = /^[0-9]{5,15}$/;
const DATE_REGEX = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
const HTTPS_URL_REGEX = /^https:\/\/.+/;

function formatSpanishDate(dateStr: string): string {
  if (!DATE_REGEX.test(dateStr)) return dateStr;
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDateTime(isoStr: string): string {
  const date = new Date(isoStr);
  if (Number.isNaN(date.getTime())) return isoStr;
  return date.toLocaleString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function normalizeHeaderKey(raw: string): string {
  return raw
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * RFC-4180 aware CSV parser supporting both comma (,) and semicolon (;) delimiters
 * so spreadsheets exported from Spanish/Colombian Excel parse reliably.
 */
function parseCsvRows(text: string): Record<string, string>[] {
  const clean = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const firstLine = clean.split('\n').find((line) => line.trim().length > 0) ?? '';
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const delimiter = semicolonCount > commaCount ? ';' : ',';

  const matrix: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < clean.length; i += 1) {
    const ch = clean[i];
    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field.trim());
      field = '';
    } else if (ch === '\n') {
      row.push(field.trim());
      if (row.some((cell) => cell.length > 0)) {
        matrix.push(row);
      }
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  row.push(field.trim());
  if (row.some((cell) => cell.length > 0)) {
    matrix.push(row);
  }

  if (matrix.length < 2) return [];
  const headers = matrix[0].map(normalizeHeaderKey);
  const records: Record<string, string>[] = [];

  for (let r = 1; r < matrix.length; r += 1) {
    const cells = matrix[r];
    const obj: Record<string, string> = {};
    headers.forEach((header, idx) => {
      if (header) {
        obj[header] = (cells[idx] ?? '').trim();
      }
    });
    records.push(obj);
  }
  return records;
}

function getTodayDateStamp(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function downloadCsvTemplate(filename: string, headers: string[], rows: string[][]) {
  const escapeCell = (rawVal: string) => {
    const val = String(rawVal ?? '');
    // Neutralize leading spreadsheet formula characters (=, +, -, @, tab, CR)
    const safeVal = /^[=+\-@\t\r]/.test(val) ? `'${val}` : val;
    if (/[",\r\n;]/.test(safeVal)) {
      return `"${safeVal.replace(/"/g, '""')}"`;
    }
    return safeVal;
  };
  const lines = [headers.join(','), ...rows.map((r) => r.map(escapeCell).join(','))];
  const csvContent = `\uFEFF${lines.join('\r\n')}\r\n`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function getActionMeta(action: string): { label: string; colorClass: string } {
  switch (action) {
    case 'CREAR':
      return { label: 'Registro', colorClass: 'text-emerald-700' };
    case 'EDITAR':
      return { label: 'Edición', colorClass: 'text-blue-700' };
    case 'CAMBIAR_ESTADO':
      return { label: 'Cambio de estado', colorClass: 'text-amber-700' };
    case 'ELIMINAR':
      return { label: 'Eliminación', colorClass: 'text-red-700' };
    case 'CARGA_MASIVA':
      return { label: 'Carga masiva', colorClass: 'text-indigo-700' };
    case 'EXPORTAR':
      return { label: 'Exportación CSV', colorClass: 'text-teal-700' };
    case 'INICIO_SESION':
      return { label: 'Inicio de sesión', colorClass: 'text-sky-700' };
    case 'CIERRE_SESION':
      return { label: 'Cierre de sesión', colorClass: 'text-slate-600' };
    default:
      return { label: action, colorClass: 'text-slate-700' };
  }
}

function getModuleLabel(moduleName: string): string {
  switch (moduleName) {
    case 'PAGOS':
      return 'Pagos';
    case 'PAZ_Y_SALVO':
      return 'Paz y Salvo';
    case 'PQRS':
      return 'PQRS';
    case 'FORM_EMPRESA':
      return 'Form Empresa';
    case 'ACCESO':
      return 'Acceso';
    case 'AUDITORIA':
      return 'Auditoría';
    default:
      return moduleName;
  }
}

function getFirebaseErrorCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
    return error.code;
  }
  return '';
}

function formatGoogleAuthError(error: unknown): string {
  const code = getFirebaseErrorCode(error);
  const currentHost =
    typeof window !== 'undefined' && window.location?.hostname
      ? window.location.hostname
      : 'este dominio';

  switch (code) {
    case 'auth/unauthorized-domain':
      return `El dominio "${currentHost}" aún no está autorizado en Firebase Authentication. Agrégalo en Firebase Console → Authentication → Settings → Dominios autorizados.`;
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Se cerró la ventana de Google antes de completar el acceso.';
    case 'auth/popup-blocked':
      return 'El navegador bloqueó la ventana emergente de Google. Permite ventanas emergentes e intenta nuevamente.';
    case 'auth/network-request-failed':
      return 'No hubo respuesta de Google. Verifica tu conexión a internet e intenta nuevamente.';
    default:
      return code
        ? `No se pudo completar el inicio de sesión con Google (${code}).`
        : 'No se pudo completar el inicio de sesión con Google.';
  }
}

async function fetchJsonIfAvailable<T>(
  url: string,
  init?: RequestInit
): Promise<T | null> {
  try {
    const res = await fetch(url, init);
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('application/json')) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export default function AdminPortalOverlay({
  isOpen,
  onClose,
  onDataChanged,
}: AdminPortalOverlayProps) {
  // Server-verified Bearer token held strictly in React memory (never persisted in localStorage)
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authConfigured, setAuthConfigured] = useState<boolean | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Optional precise browser GPS coordinates for audit metadata
  const [geoCoords, setGeoCoords] = useState<string>('');
  const [geoStatus, setGeoStatus] = useState<'idle' | 'requesting' | 'active' | 'denied'>('idle');

  // Active left-sidebar tab
  const [activeSection, setActiveSection] = useState<AdminSection>('pagos');

  // Pagos state
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [paymentSearch, setPaymentSearch] = useState('');
  const [editingPaymentCedula, setEditingPaymentCedula] = useState<string | null>(null);
  const [pCedula, setPCedula] = useState('');
  const [pReference, setPReference] = useState('');
  const [pAmount, setPAmount] = useState('');
  const [pConcept, setPConcept] = useState('');
  const [pIsPaid, setPIsPaid] = useState(false);
  const [pNoDueDate, setPNoDueDate] = useState(false);
  const [pDueDate, setPDueDate] = useState('');
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentImporting, setPaymentImporting] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );
  const paymentFileInputRef = useRef<HTMLInputElement | null>(null);

  // Paz y Salvo state
  const [pazYSalvos, setPazYSalvos] = useState<PazYSalvoRecord[]>([]);
  const [loadingPaz, setLoadingPaz] = useState(false);
  const [editingPazId, setEditingPazId] = useState<string | null>(null);
  const [psRegNumber, setPsRegNumber] = useState('');
  const [psName, setPsName] = useState('');
  const [psDescription, setPsDescription] = useState('');
  const [psDownloadUrl, setPsDownloadUrl] = useState('');
  const [pazSaving, setPazSaving] = useState(false);
  const [pazImporting, setPazImporting] = useState(false);
  const [pazNotice, setPazNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const pazFileInputRef = useRef<HTMLInputElement | null>(null);

  // Firebase Auth state for direct Firestore audit_logs access
  const [firebaseUser, setFirebaseUser] = useState<User | null>(() => auth.currentUser);
  const [firebaseAuthReady, setFirebaseAuthReady] = useState(false);
  const [connectingFirestoreGoogle, setConnectingFirestoreGoogle] = useState(false);

  // Auditoría (Firestore) state
  const [auditLogs, setAuditLogs] = useState<FirestoreAuditLogRecord[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditError, setAuditError] = useState('');

  // PQRS (Firestore) state
  const [pqrsSubmissions, setPqrsSubmissions] = useState<PqrsSubmissionRecord[]>([]);
  const [loadingPqrs, setLoadingPqrs] = useState(false);
  const [pqrsError, setPqrsError] = useState('');
  const [updatingPqrsId, setUpdatingPqrsId] = useState<string | null>(null);

  // Form Empresa (Firestore) state
  const [empresaSubmissions, setEmpresaSubmissions] = useState<EmpresaSubmissionRecord[]>([]);
  const [loadingEmpresa, setLoadingEmpresa] = useState(false);
  const [empresaError, setEmpresaError] = useState('');
  const [deletingEmpresaId, setDeletingEmpresaId] = useState<string | null>(null);

  const isFirebaseAdmin = isFirebaseAdminUser(firebaseUser);

  // Build standardized audit metadata headers for every admin request
  const buildAuditHeaders = useCallback(
    (token?: string | null, includeJson = false): Record<string, string> => {
      const headers: Record<string, string> = {};
      if (includeJson) {
        headers['Content-Type'] = 'application/json';
      }
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz) headers['X-Audit-Timezone'] = tz;
      } catch {
        // Ignore if Intl API is unavailable
      }
      if (typeof navigator !== 'undefined' && navigator.language) {
        headers['X-Audit-Locale'] = navigator.language;
      }
      if (typeof window !== 'undefined' && window.screen) {
        headers['X-Audit-Screen'] = `${window.screen.width}x${window.screen.height}`;
      }
      if (geoCoords) {
        headers['X-Audit-Geo'] = geoCoords;
      }
      return headers;
    },
    [geoCoords]
  );

  const requestExactLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoStatus('denied');
      return;
    }
    setGeoStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(4);
        const lng = pos.coords.longitude.toFixed(4);
        setGeoCoords(`${lat}, ${lng}`);
        setGeoStatus('active');
      },
      () => {
        setGeoStatus('denied');
      },
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 300000 }
    );
  }, []);

  // Silently read GPS coordinates if permission was already granted by the browser
  useEffect(() => {
    if (!isOpen || geoCoords) return;
    if (typeof navigator === 'undefined' || !navigator.permissions || !navigator.geolocation) {
      return;
    }
    navigator.permissions
      .query({ name: 'geolocation' as PermissionName })
      .then((status) => {
        if (status.state === 'granted') {
          requestExactLocation();
        }
      })
      .catch(() => {
        // Permissions API not supported for geolocation in some browsers
      });
  }, [isOpen, geoCoords, requestExactLocation]);

  // Track Firebase Auth readiness, handle redirect returns, and auto-restore verified admin session
  useEffect(() => {
    let active = true;

    void getRedirectResult(auth)
      .then(async (result) => {
        if (!active || !result?.user) return;
        if (!isFirebaseAdminUser(result.user)) {
          await signOut(auth);
          setAuthError(
            `Debes iniciar sesión con la cuenta administradora autorizada (${PRIMARY_ADMIN_EMAIL}).`
          );
          return;
        }
        const idToken = await result.user.getIdToken();
        if (active) {
          setAuthToken(idToken);
          setAuthError('');
        }
      })
      .catch((err) => {
        if (active) {
          setAuthError(formatGoogleAuthError(err));
        }
      });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setFirebaseAuthReady(true);
      if (isFirebaseAdminUser(user) && user) {
        void user
          .getIdToken()
          .then((idToken) => {
            if (active) {
              setAuthToken((prev) => prev || idToken);
            }
          })
          .catch(() => {
            // Keep manual login option available if token refresh fails
          });
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const fetchServerAuditContext = useCallback(
    async (token: string): Promise<Partial<AuditNetworkContext>> => {
      const data = await fetchJsonIfAvailable<Partial<AuditNetworkContext>>(
        '/api/admin/audit-context',
        { headers: buildAuditHeaders(token) }
      );
      return data ?? {};
    },
    [buildAuditHeaders]
  );

  const recordFirestoreAuditEvent = useCallback(
    async (
      token: string | null,
      event: {
        action: FirestoreAuditAction;
        module: FirestoreAuditModule;
        targetKey?: string;
        summary: string;
        details?: string;
        requestMethod?: string;
        context?: Partial<AuditNetworkContext>;
      }
    ) => {
      if (!isFirebaseAdminUser(auth.currentUser)) return;
      try {
        const resolvedContext =
          event.context ?? (token ? await fetchServerAuditContext(token) : {});
        await appendFirestoreAuditLog({
          action: event.action,
          module: event.module,
          targetKey: event.targetKey,
          summary: event.summary,
          details: event.details,
          requestMethod: event.requestMethod,
          context: resolvedContext,
        });
      } catch (err) {
        console.error('No se pudo registrar el evento de auditoría en Firestore:', err);
      }
    },
    [fetchServerAuditContext]
  );

  const refreshFirestoreAuditLogs = useCallback(async () => {
    if (!isFirebaseAdminUser(auth.currentUser)) return;
    setLoadingAudit(true);
    setAuditError('');
    try {
      const items = await fetchFirestoreAuditLogsOnce();
      setAuditLogs(items);
    } catch {
      setAuditError('No se pudieron actualizar los registros de auditoría desde Firestore.');
    } finally {
      setLoadingAudit(false);
    }
  }, []);

  // Check optional backend admin status when overlay opens (non-blocking on static domains)
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    const checkStatus = async () => {
      const data = await fetchJsonIfAvailable<{ configured: boolean; authenticated: boolean }>(
        '/api/admin/status',
        { headers: buildAuditHeaders(authToken) }
      );
      if (!active || !data) return;
      setAuthConfigured(data.configured);
      if (authToken && !data.authenticated && !isFirebaseAdminUser(auth.currentUser)) {
        setAuthToken(null);
      }
    };
    void checkStatus();
    return () => {
      active = false;
    };
  }, [isOpen, authToken, buildAuditHeaders]);

  // Real-time Firestore listeners for all admin collections
  useEffect(() => {
    if (!isOpen || !authToken || !firebaseAuthReady || !isFirebaseAdmin) {
      if (!isFirebaseAdmin) {
        setPayments([]);
        setPazYSalvos([]);
        setAuditLogs([]);
        setPqrsSubmissions([]);
        setEmpresaSubmissions([]);
      }
      return;
    }

    setLoadingPayments(true);
    setLoadingPaz(true);
    setLoadingAudit(true);
    setLoadingPqrs(true);
    setLoadingEmpresa(true);
    setAuditError('');
    setPqrsError('');
    setEmpresaError('');

    const unsubPayments = subscribeAdminPayments(
      (items) => {
        setPayments(items);
        setLoadingPayments(false);
      },
      (errMessage) => {
        setPaymentNotice({ type: 'err', text: errMessage });
        setLoadingPayments(false);
      }
    );

    const unsubPaz = subscribeAdminPazYSalvos(
      (items) => {
        setPazYSalvos(items);
        setLoadingPaz(false);
      },
      (errMessage) => {
        setPazNotice({ type: 'err', text: errMessage });
        setLoadingPaz(false);
      }
    );

    const unsubAudit = subscribeFirestoreAuditLogs(
      (items) => {
        setAuditLogs(items);
        setLoadingAudit(false);
      },
      () => {
        setAuditError(
          'No se pudo leer el historial de auditoría en Firestore. Verifica que tu cuenta Google administradora esté activa.'
        );
        setLoadingAudit(false);
      }
    );

    const unsubPqrs = subscribeAdminPqrsSubmissions(
      (items) => {
        setPqrsSubmissions(items);
        setLoadingPqrs(false);
      },
      (errMessage) => {
        setPqrsError(errMessage);
        setLoadingPqrs(false);
      }
    );

    const unsubEmpresa = subscribeAdminEmpresaSubmissions(
      (items) => {
        setEmpresaSubmissions(items);
        setLoadingEmpresa(false);
      },
      (errMessage) => {
        setEmpresaError(errMessage);
        setLoadingEmpresa(false);
      }
    );

    return () => {
      unsubPayments();
      unsubPaz();
      unsubAudit();
      unsubPqrs();
      unsubEmpresa();
    };
  }, [isOpen, authToken, firebaseAuthReady, isFirebaseAdmin]);

  // Lock page scroll while full-screen overlay is open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const filteredPayments = useMemo(() => {
    const q = paymentSearch.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter(
      (item) =>
        item.cedula.toLowerCase().includes(q) ||
        item.reference.toLowerCase().includes(q) ||
        item.concept.toLowerCase().includes(q)
    );
  }, [payments, paymentSearch]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError('');
    const trimmedUser = username.trim();
    const trimmedPass = password.trim();
    if (!trimmedUser || !trimmedPass) {
      setAuthError('Ingresa usuario y contraseña.');
      return;
    }

    setAuthLoading(true);
    try {
      const endpoint = authConfigured === false ? '/api/admin/setup' : '/api/admin/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: buildAuditHeaders(null, true),
        body: JSON.stringify({ username: trimmedUser, password: trimmedPass }),
      });
      const data = (await res.json()) as { ok?: boolean; token?: string; error?: string };
      if (!res.ok || !data.token) {
        setAuthError(data.error || 'Credenciales incorrectas.');
        return;
      }
      setAuthConfigured(true);
      setAuthToken(data.token);
      setUsername('');
      setPassword('');
    } catch {
      setAuthError('Error de conexión al verificar credenciales.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError('');
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (!isFirebaseAdminUser(result.user)) {
        await signOut(auth);
        setAuthError(
          `Debes iniciar sesión con la cuenta administradora autorizada (${PRIMARY_ADMIN_EMAIL}).`
        );
        return;
      }

      const idToken = await result.user.getIdToken();
      setAuthToken(idToken);

      // Optional backend enrichment (works seamlessly even on static hosts like fundacionulep.fun)
      const serverData = await fetchJsonIfAvailable<{
        isAdmin?: boolean;
        auditContext?: Partial<AuditNetworkContext>;
      }>('/api/auth/me?auditLogin=1', {
        headers: buildAuditHeaders(idToken),
      });

      void recordFirestoreAuditEvent(idToken, {
        action: 'INICIO_SESION',
        module: 'ACCESO',
        targetKey: result.user.email || 'Panel administrativo',
        summary: 'Inició sesión en el panel administrativo con Google autorizado',
        details: `Autenticación verificada con Firebase Auth (${window.location.hostname})`,
        requestMethod: 'FIREBASE_GOOGLE_AUTH',
        context: serverData?.auditContext,
      });
    } catch (err) {
      const code = getFirebaseErrorCode(err);
      if (
        code === 'auth/popup-blocked' ||
        code === 'auth/operation-not-supported-in-this-environment'
      ) {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectErr) {
          setAuthError(formatGoogleAuthError(redirectErr));
          return;
        }
      }
      setAuthError(formatGoogleAuthError(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleConnectFirestoreGoogle = async () => {
    setAuditError('');
    setConnectingFirestoreGoogle(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (!isFirebaseAdminUser(result.user)) {
        await signOut(auth);
        setAuditError(
          `Debes conectar la cuenta administradora autorizada (${PRIMARY_ADMIN_EMAIL}).`
        );
        return;
      }

      const idToken = await result.user.getIdToken();
      const serverData = await fetchJsonIfAvailable<{
        isAdmin?: boolean;
        auditContext?: Partial<AuditNetworkContext>;
      }>('/api/auth/me?auditLogin=1', {
        headers: buildAuditHeaders(idToken),
      });

      void recordFirestoreAuditEvent(idToken, {
        action: 'INICIO_SESION',
        module: 'ACCESO',
        targetKey: result.user.email || 'Auditoría Firestore',
        summary: 'Conectó cuenta Google autorizada para consultar Firestore',
        details: `Acceso verificado con Firebase Auth (${window.location.hostname})`,
        requestMethod: 'FIREBASE_GOOGLE_AUTH',
        context: serverData?.auditContext,
      });
    } catch (err) {
      const code = getFirebaseErrorCode(err);
      if (
        code === 'auth/popup-blocked' ||
        code === 'auth/operation-not-supported-in-this-environment'
      ) {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectErr) {
          setAuditError(formatGoogleAuthError(redirectErr));
          return;
        }
      }
      setAuditError(formatGoogleAuthError(err));
    } finally {
      setConnectingFirestoreGoogle(false);
    }
  };

  const handleLogout = async () => {
    if (authToken) {
      if (isFirebaseAdminUser(auth.currentUser)) {
        await recordFirestoreAuditEvent(authToken, {
          action: 'CIERRE_SESION',
          module: 'ACCESO',
          targetKey: 'Panel administrativo',
          summary: 'Cerró sesión en el panel administrativo',
          details: 'Sesión finalizada manualmente',
          requestMethod: 'POST /api/admin/logout',
        });
      }
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: buildAuditHeaders(authToken),
        });
      } catch {
        // Ignore network errors on logout
      }
    }
    try {
      await signOut(auth);
    } catch {
      // Ignore Firebase sign-out error if signed in with credentials only
    }
    setAuthToken(null);
    setPayments([]);
    setPazYSalvos([]);
    setAuditLogs([]);
    setPqrsSubmissions([]);
    setEmpresaSubmissions([]);
    onClose();
  };

  const resetPaymentForm = () => {
    setEditingPaymentCedula(null);
    setPCedula('');
    setPReference('');
    setPAmount('');
    setPConcept('');
    setPIsPaid(false);
    setPNoDueDate(false);
    setPDueDate('');
  };

  const handleSavePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPaymentNotice(null);
    if (!authToken) return;
    if (!isFirebaseAdmin) {
      setPaymentNotice({
        type: 'err',
        text: 'Conecta primero tu cuenta Google autorizada para guardar registros en Firestore.',
      });
      return;
    }

    const cleanCedula = pCedula.replace(/\D/g, '');
    const cleanRef = pReference.trim().slice(0, 60);
    const cleanAmount = pAmount.trim().slice(0, 40);
    const cleanConcept = pConcept.trim().slice(0, 160);
    const hasDueDate = !pNoDueDate;
    const cleanDueDate = hasDueDate ? pDueDate.trim() : '';

    if (!CEDULA_REGEX.test(cleanCedula)) {
      setPaymentNotice({
        type: 'err',
        text: 'Ingresa un número de cédula válido (solo dígitos, entre 5 y 15 números).',
      });
      return;
    }

    if (!cleanRef) {
      setPaymentNotice({ type: 'err', text: 'Ingresa el número de referencia del pago.' });
      return;
    }

    if (hasDueDate && !DATE_REGEX.test(cleanDueDate)) {
      setPaymentNotice({
        type: 'err',
        text: 'Selecciona una fecha límite válida o marca la opción "Sin fecha límite".',
      });
      return;
    }

    setPaymentSaving(true);
    try {
      const { payment: saved, wasUpdate } = await upsertPaymentInFirestore({
        cedula: cleanCedula,
        reference: cleanRef,
        amount: cleanAmount,
        concept: cleanConcept,
        isPaid: pIsPaid,
        hasDueDate,
        dueDate: cleanDueDate,
      });

      setPaymentNotice({
        type: 'ok',
        text: wasUpdate
          ? `Registro de pago actualizado en Firestore para la cédula ${cleanCedula}.`
          : `Pago registrado en Firestore para la cédula ${cleanCedula}.`,
      });
      resetPaymentForm();
      onDataChanged?.();
      void recordFirestoreAuditEvent(authToken, {
        action: wasUpdate ? 'EDITAR' : 'CREAR',
        module: 'PAGOS',
        targetKey: cleanCedula,
        summary: wasUpdate
          ? `Editó el registro de pago de la cédula ${cleanCedula}`
          : `Registró un pago para la cédula ${cleanCedula}`,
        details: `Ref: ${saved.reference} · Estado: ${
          saved.isPaid ? 'Pagado' : 'Pendiente por pagar'
        }${saved.amount ? ` · Valor: ${saved.amount}` : ''}`,
        requestMethod: 'FIRESTORE payment_queries',
      });
    } catch (error) {
      setPaymentNotice({
        type: 'err',
        text:
          error instanceof Error
            ? error.message
            : 'No se pudo guardar el registro de pago en Firestore.',
      });
    } finally {
      setPaymentSaving(false);
    }
  };

  const handleBulkPaymentsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !authToken) return;
    if (!isFirebaseAdmin) {
      setPaymentNotice({
        type: 'err',
        text: 'Conecta primero tu cuenta Google autorizada para cargar usuarios en Firestore.',
      });
      return;
    }

    setPaymentNotice(null);
    setPaymentImporting(true);
    try {
      const content = await file.text();
      const parsed = parseCsvRows(content);
      if (parsed.length === 0) {
        setPaymentNotice({
          type: 'err',
          text: 'El archivo CSV está vacío o no tiene el formato de la plantilla de Pagos.',
        });
        return;
      }

      if (parsed.length > 500) {
        setPaymentNotice({
          type: 'err',
          text: 'Solo se permiten hasta 500 registros por archivo.',
        });
        return;
      }

      let createdCount = 0;
      let updatedCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < parsed.length; i += 1) {
        const row = parsed[i];
        const rowNum = i + 2;
        const cleanCedula = (row.cedula || row.documento || row.numero_cedula || '').replace(
          /\D/g,
          ''
        );
        const cleanRef = (row.referencia || row.reference || row.ref || '').trim().slice(0, 60);
        const cleanAmount = (row.valor || row.monto || row.amount || '').trim().slice(0, 40);
        const cleanConcept = (row.concepto || row.concept || row.descripcion || '')
          .trim()
          .slice(0, 160);
        const paidRaw = (row.pagado || row.estado || row.is_paid || 'NO')
          .trim()
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        const isPaid =
          paidRaw === 'si' ||
          paidRaw === 'pagado' ||
          paidRaw === 'true' ||
          paidRaw === '1' ||
          paidRaw === 'yes';

        const rawDue = (row.fecha_limite || row.fecha || row.due_date || '').trim();
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
          errors.push(`Fila ${rowNum} (C.C. ${cleanCedula}): fecha límite debe ser AAAA-MM-DD.`);
          continue;
        }

        const { wasUpdate } = await upsertPaymentInFirestore({
          cedula: cleanCedula,
          reference: cleanRef,
          amount: cleanAmount,
          concept: cleanConcept,
          isPaid,
          hasDueDate: !noDate,
          dueDate: noDate ? '' : rawDue,
        });
        if (wasUpdate) {
          updatedCount += 1;
        } else {
          createdCount += 1;
        }
      }

      const totalOk = createdCount + updatedCount;
      const skipped = errors.length;
      const errSnippet = errors.length > 0 ? ` (${errors[0]})` : '';
      setPaymentNotice({
        type: totalOk > 0 ? 'ok' : 'err',
        text:
          totalOk > 0
            ? `Carga en Firestore completada: ${createdCount} nuevo(s), ${updatedCount} actualizado(s)${
                skipped > 0 ? `, ${skipped} omitido(s)${errSnippet}` : ''
              }.`
            : `No se cargó ningún registro. ${skipped} fila(s) omitida(s)${errSnippet}.`,
      });
      onDataChanged?.();
      if (totalOk > 0) {
        void recordFirestoreAuditEvent(authToken, {
          action: 'CARGA_MASIVA',
          module: 'PAGOS',
          targetKey: `${totalOk} usuario(s)`,
          summary: `Cargó masivamente ${totalOk} registro(s) en Pagos`,
          details: `Nuevos: ${createdCount} · Actualizados: ${updatedCount} · Omitidos: ${skipped}`,
          requestMethod: 'FIRESTORE payment_queries/bulk',
        });
      }
    } catch {
      setPaymentNotice({
        type: 'err',
        text: 'Error al leer o subir el archivo CSV a Firestore.',
      });
    } finally {
      setPaymentImporting(false);
    }
  };

  const handleEditPayment = (item: PaymentRecord) => {
    setEditingPaymentCedula(item.cedula);
    setPCedula(item.cedula);
    setPReference(item.reference);
    setPAmount(item.amount);
    setPConcept(item.concept);
    setPIsPaid(item.isPaid);
    setPNoDueDate(!item.hasDueDate);
    setPDueDate(item.hasDueDate ? item.dueDate : '');
    setPaymentNotice(null);
  };

  const handleTogglePaymentStatus = async (item: PaymentRecord) => {
    if (!authToken || !isFirebaseAdmin) return;
    const nextIsPaid = !item.isPaid;
    try {
      await togglePaymentPaidInFirestore(item.cedula, nextIsPaid);
      onDataChanged?.();
      void recordFirestoreAuditEvent(authToken, {
        action: 'CAMBIAR_ESTADO',
        module: 'PAGOS',
        targetKey: item.cedula,
        summary: `Cambió el estado de pago de la cédula ${item.cedula}`,
        details: `${item.isPaid ? 'Pagado' : 'Pendiente por pagar'} → ${
          nextIsPaid ? 'Pagado' : 'Pendiente por pagar'
        } · Ref: ${item.reference}`,
        requestMethod: `FIRESTORE payment_queries/${item.cedula}`,
      });
    } catch {
      setPaymentNotice({
        type: 'err',
        text: 'No se pudo actualizar el estado del pago en Firestore.',
      });
    }
  };

  const handleDeletePayment = async (cedula: string) => {
    if (!authToken || !isFirebaseAdmin) return;
    try {
      await deletePaymentInFirestore(cedula);
      if (editingPaymentCedula === cedula) {
        resetPaymentForm();
      }
      onDataChanged?.();
      void recordFirestoreAuditEvent(authToken, {
        action: 'ELIMINAR',
        module: 'PAGOS',
        targetKey: cedula,
        summary: `Eliminó el registro de pago de la cédula ${cedula}`,
        details: `Registro eliminado de Firestore`,
        requestMethod: `FIRESTORE payment_queries/${cedula}`,
      });
    } catch {
      setPaymentNotice({
        type: 'err',
        text: 'No se pudo eliminar el registro de pago en Firestore.',
      });
    }
  };

  const resetPazForm = () => {
    setEditingPazId(null);
    setPsRegNumber('');
    setPsName('');
    setPsDescription('');
    setPsDownloadUrl('');
  };

  const handleSavePazYSalvo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPazNotice(null);
    if (!authToken) return;
    if (!isFirebaseAdmin) {
      setPazNotice({
        type: 'err',
        text: 'Conecta primero tu cuenta Google autorizada para guardar Paz y Salvos en Firestore.',
      });
      return;
    }

    const cleanReg = psRegNumber.trim().slice(0, 60);
    const cleanName = psName.trim().slice(0, 140);
    const cleanDesc = psDescription.trim().slice(0, 500);
    const cleanUrl = psDownloadUrl.trim().slice(0, 500);

    if (!cleanReg) {
      setPazNotice({ type: 'err', text: 'Ingresa el número de registro del Paz y Salvo.' });
      return;
    }

    if (!cleanName) {
      setPazNotice({ type: 'err', text: 'Ingresa el nombre del Paz y Salvo.' });
      return;
    }

    if (!HTTPS_URL_REGEX.test(cleanUrl) || sanitizeExternalUrl(cleanUrl) === '#') {
      setPazNotice({
        type: 'err',
        text: 'Ingresa un link de descarga válido que inicie con https://',
      });
      return;
    }

    setPazSaving(true);
    try {
      const isEditing = editingPazId !== null;
      const saved = isEditing
        ? await updatePazYSalvoInFirestore(editingPazId, {
            registrationNumber: cleanReg,
            name: cleanName,
            description: cleanDesc,
            downloadUrl: cleanUrl,
          })
        : await createPazYSalvoInFirestore({
            registrationNumber: cleanReg,
            name: cleanName,
            description: cleanDesc,
            downloadUrl: cleanUrl,
          });

      setPazNotice({
        type: 'ok',
        text: isEditing
          ? `Paz y Salvo "${cleanName}" actualizado en Firestore.`
          : `Paz y Salvo "${cleanName}" agregado a Firestore.`,
      });
      resetPazForm();
      onDataChanged?.();
      void recordFirestoreAuditEvent(authToken, {
        action: isEditing ? 'EDITAR' : 'CREAR',
        module: 'PAZ_Y_SALVO',
        targetKey: saved.registrationNumber,
        summary: isEditing
          ? `Editó el Paz y Salvo "${saved.name}"`
          : `Registró el Paz y Salvo "${saved.name}"`,
        details: `Registro N.º ${saved.registrationNumber} · Link: ${saved.downloadUrl}`,
        requestMethod: `FIRESTORE paz_y_salvos/${saved.id}`,
      });
    } catch (error) {
      setPazNotice({
        type: 'err',
        text:
          error instanceof Error
            ? error.message
            : 'No se pudo guardar el registro de Paz y Salvo en Firestore.',
      });
    } finally {
      setPazSaving(false);
    }
  };

  const handleBulkPazUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !authToken) return;
    if (!isFirebaseAdmin) {
      setPazNotice({
        type: 'err',
        text: 'Conecta primero tu cuenta Google autorizada para cargar Paz y Salvos en Firestore.',
      });
      return;
    }

    setPazNotice(null);
    setPazImporting(true);
    try {
      const content = await file.text();
      const parsed = parseCsvRows(content);
      if (parsed.length === 0) {
        setPazNotice({
          type: 'err',
          text: 'El archivo CSV está vacío o no tiene el formato de la plantilla de Paz y Salvo.',
        });
        return;
      }
      if (parsed.length > 500) {
        setPazNotice({
          type: 'err',
          text: 'Solo se permiten hasta 500 registros por archivo.',
        });
        return;
      }

      let created = 0;
      const errors: string[] = [];

      for (let i = 0; i < parsed.length; i += 1) {
        const row = parsed[i];
        const rowNum = i + 2;
        const registrationNumber = (
          row.numero_registro ||
          row.registro ||
          row.registration_number ||
          ''
        )
          .trim()
          .slice(0, 60);
        const name = (row.nombre || row.name || '').trim().slice(0, 140);
        const description = (row.descripcion || row.description || '').trim().slice(0, 500);
        const downloadUrl = (row.link_descarga || row.link || row.url || row.download_url || '')
          .trim()
          .slice(0, 500);

        if (!registrationNumber) {
          errors.push(`Fila ${rowNum}: falta el número de registro.`);
          continue;
        }
        if (!name) {
          errors.push(`Fila ${rowNum} (${registrationNumber}): falta el nombre.`);
          continue;
        }
        if (!HTTPS_URL_REGEX.test(downloadUrl) || sanitizeExternalUrl(downloadUrl) === '#') {
          errors.push(
            `Fila ${rowNum} (${registrationNumber}): link de descarga inválido (debe iniciar con https://).`
          );
          continue;
        }

        await createPazYSalvoInFirestore({
          registrationNumber,
          name,
          description,
          downloadUrl,
        });
        created += 1;
      }

      const skipped = errors.length;
      const errSnippet = errors.length > 0 ? ` (${errors[0]})` : '';
      setPazNotice({
        type: created > 0 ? 'ok' : 'err',
        text:
          created > 0
            ? `Carga en Firestore completada: ${created} Paz y Salvo(s) agregado(s)${
                skipped > 0 ? `, ${skipped} omitido(s)${errSnippet}` : ''
              }.`
            : `No se cargó ningún registro. ${skipped} fila(s) omitida(s)${errSnippet}.`,
      });
      onDataChanged?.();
      if (created > 0) {
        void recordFirestoreAuditEvent(authToken, {
          action: 'CARGA_MASIVA',
          module: 'PAZ_Y_SALVO',
          targetKey: `${created} registro(s)`,
          summary: `Cargó masivamente ${created} registro(s) de Paz y Salvo`,
          details: `Agregados: ${created} · Omitidos: ${skipped}`,
          requestMethod: 'FIRESTORE paz_y_salvos/bulk',
        });
      }
    } catch {
      setPazNotice({
        type: 'err',
        text: 'Error al leer o subir el archivo CSV a Firestore.',
      });
    } finally {
      setPazImporting(false);
    }
  };

  const handleEditPaz = (item: PazYSalvoRecord) => {
    setEditingPazId(item.id);
    setPsRegNumber(item.registrationNumber);
    setPsName(item.name);
    setPsDescription(item.description);
    setPsDownloadUrl(item.downloadUrl);
    setPazNotice(null);
  };

  const handleDeletePaz = async (id: string) => {
    if (!authToken || !isFirebaseAdmin) return;
    try {
      const deletedItem = pazYSalvos.find((row) => row.id === id);
      await deletePazYSalvoInFirestore(id);
      if (editingPazId === id) {
        resetPazForm();
      }
      onDataChanged?.();
      void recordFirestoreAuditEvent(authToken, {
        action: 'ELIMINAR',
        module: 'PAZ_Y_SALVO',
        targetKey: deletedItem?.registrationNumber || id,
        summary: deletedItem
          ? `Eliminó el Paz y Salvo "${deletedItem.name}"`
          : `Eliminó un registro de Paz y Salvo`,
        details: deletedItem ? `Registro N.º ${deletedItem.registrationNumber}` : '',
        requestMethod: `FIRESTORE paz_y_salvos/${id}`,
      });
    } catch {
      setPazNotice({
        type: 'err',
        text: 'No se pudo eliminar el Paz y Salvo en Firestore.',
      });
    }
  };

  const handleDownloadPaymentsTemplate = () => {
    downloadCsvTemplate(
      'plantilla_pagos_ulep.csv',
      ['cedula', 'referencia', 'valor', 'concepto', 'pagado', 'fecha_limite'],
      [
        ['1061700001', 'REF-2026-001', '$150.000', 'Cuota de formación', 'NO', '2026-12-15'],
        ['1061700002', 'REF-2026-002', '$200.000', 'Matrícula diplomado', 'SI', ''],
      ]
    );
  };

  const handleDownloadPazTemplate = () => {
    downloadCsvTemplate(
      'plantilla_paz_y_salvo_ulep.csv',
      ['numero_registro', 'nombre', 'descripcion', 'link_descarga'],
      [
        [
          'PS-2026-001',
          'Paz y Salvo Académico',
          'Certificado de paz y salvo académico correspondiente al periodo actual.',
          'https://drive.google.com/file/d/ejemplo-academico/view',
        ],
        [
          'PS-2026-002',
          'Paz y Salvo Administrativo',
          'Documento oficial de paz y salvo financiero y administrativo.',
          'https://drive.google.com/file/d/ejemplo-administrativo/view',
        ],
      ]
    );
  };

  const logReportExport = (
    moduleName: 'PAGOS' | 'PAZ_Y_SALVO' | 'PQRS' | 'FORM_EMPRESA' | 'AUDITORIA',
    count: number
  ) => {
    if (!authToken) return;
    const moduleLabel = getModuleLabel(moduleName);
    if (moduleName === 'PAGOS' || moduleName === 'PAZ_Y_SALVO' || moduleName === 'AUDITORIA') {
      void fetch('/api/admin/audit-logs/export', {
        method: 'POST',
        headers: buildAuditHeaders(authToken, true),
        body: JSON.stringify({ module: moduleName, recordCount: count }),
      }).catch(() => {
        // Non-blocking audit record
      });
    }
    void recordFirestoreAuditEvent(authToken, {
      action: 'EXPORTAR',
      module: moduleName,
      targetKey: `Reporte CSV (${count} reg.)`,
      summary: `Exportó reporte CSV de ${moduleLabel}`,
      details: `Total de registros exportados: ${count}`,
      requestMethod: `EXPORT_CSV_${moduleName}`,
    });
  };

  const handleExportPaymentsCsv = () => {
    if (filteredPayments.length === 0) return;
    downloadCsvTemplate(
      `reporte_pagos_ulep_${getTodayDateStamp()}.csv`,
      [
        'cedula',
        'referencia',
        'valor',
        'concepto',
        'estado',
        'fecha_limite',
        'actualizado_por',
        'ultima_actualizacion',
      ],
      filteredPayments.map((item) => [
        item.cedula,
        item.reference,
        item.amount,
        item.concept,
        item.isPaid ? 'Pagado' : 'Pendiente por pagar',
        item.hasDueDate && item.dueDate ? item.dueDate : 'Sin fecha límite',
        item.updatedBy,
        item.updatedAt ? formatDateTime(item.updatedAt) : '',
      ])
    );
    logReportExport('PAGOS', filteredPayments.length);
  };

  const handleExportPazCsv = () => {
    if (pazYSalvos.length === 0) return;
    downloadCsvTemplate(
      `reporte_paz_y_salvo_ulep_${getTodayDateStamp()}.csv`,
      [
        'numero_registro',
        'nombre',
        'descripcion',
        'link_descarga',
        'publicado',
        'creado_por',
        'fecha_creacion',
      ],
      pazYSalvos.map((item) => [
        item.registrationNumber,
        item.name,
        item.description,
        item.downloadUrl,
        item.isPublished ? 'SI' : 'NO',
        item.createdBy,
        item.createdAt ? formatDateTime(item.createdAt) : '',
      ])
    );
    logReportExport('PAZ_Y_SALVO', pazYSalvos.length);
  };

  const handleExportAuditCsv = (rowsToExport: FirestoreAuditLogRecord[]) => {
    if (rowsToExport.length === 0) return;
    downloadCsvTemplate(
      `reporte_auditoria_ulep_${getTodayDateStamp()}.csv`,
      [
        'id',
        'fecha_hora',
        'accion',
        'modulo',
        'objetivo',
        'resumen',
        'detalles',
        'usuario',
        'direccion_ip',
        'ubicacion_aproximada',
        'equipo',
        'zona_horaria',
        'idioma',
        'pantalla',
        'ruta',
      ],
      rowsToExport.map((entry) => [
        entry.id,
        formatDateTime(entry.createdAt),
        getActionMeta(entry.action).label,
        getModuleLabel(entry.module),
        entry.targetKey,
        entry.summary,
        entry.details,
        entry.actor,
        entry.ipAddress,
        entry.location,
        entry.deviceInfo,
        entry.timezone,
        entry.locale,
        entry.screenInfo,
        entry.requestMethod,
      ])
    );
    logReportExport('AUDITORIA', rowsToExport.length);
  };

  const handleTogglePqrsStatus = async (record: PqrsSubmissionRecord, nextStatus: PqrsStatus) => {
    if (!authToken || !isFirebaseAdmin) return;
    setPqrsError('');
    setUpdatingPqrsId(record.id);
    try {
      await updatePqrsStatusInFirestore(record.id, nextStatus);
      void recordFirestoreAuditEvent(authToken, {
        action: 'CAMBIAR_ESTADO',
        module: 'PQRS',
        targetKey: record.radicado || record.id,
        summary:
          nextStatus === 'HECHO'
            ? `Marcó como hecha la solicitud PQRS ${record.radicado}`
            : `Reabrió la solicitud PQRS ${record.radicado}`,
        details: `${record.fullName} · ${record.pqrsType} · Estado: ${record.status} → ${nextStatus}`,
        requestMethod: `FIRESTORE pqrs_submissions/${record.id}`,
      });
    } catch (err) {
      setPqrsError(
        err instanceof Error ? err.message : 'No se pudo actualizar el estado de la PQRS.'
      );
    } finally {
      setUpdatingPqrsId(null);
    }
  };

  const handleDeletePqrs = async (record: PqrsSubmissionRecord) => {
    if (!authToken || !isFirebaseAdmin) return;
    setPqrsError('');
    setUpdatingPqrsId(record.id);
    try {
      await deletePqrsSubmissionInFirestore(record.id);
      void recordFirestoreAuditEvent(authToken, {
        action: 'ELIMINAR',
        module: 'PQRS',
        targetKey: record.radicado || record.id,
        summary: `Eliminó la solicitud PQRS ${record.radicado}`,
        details: `Solicitante: ${record.fullName} · ${record.subject}`,
        requestMethod: `FIRESTORE pqrs_submissions/${record.id}`,
      });
    } catch (err) {
      setPqrsError(err instanceof Error ? err.message : 'No se pudo eliminar la solicitud PQRS.');
    } finally {
      setUpdatingPqrsId(null);
    }
  };

  const handleExportPqrsCsv = (rowsToExport: PqrsSubmissionRecord[]) => {
    if (rowsToExport.length === 0) return;
    downloadCsvTemplate(
      `reporte_pqrs_ulep_${getTodayDateStamp()}.csv`,
      [
        'radicado',
        'estado',
        'tipo',
        'area',
        'nombre_completo',
        'documento',
        'correo',
        'telefono',
        'asunto',
        'descripcion',
        'fecha_radicacion',
        'atendido_por',
      ],
      rowsToExport.map((item) => [
        item.radicado,
        item.status === 'HECHO' ? 'Hecho' : 'Pendiente',
        item.pqrsType,
        item.area,
        item.fullName,
        item.documentNumber,
        item.email,
        item.phone,
        item.subject,
        item.message,
        formatDateTime(item.createdAt),
        item.completedBy,
      ])
    );
    logReportExport('PQRS', rowsToExport.length);
  };

  const handleDeleteEmpresa = async (record: EmpresaSubmissionRecord) => {
    if (!authToken || !isFirebaseAdmin) return;
    setEmpresaError('');
    setDeletingEmpresaId(record.id);
    try {
      await deleteEmpresaSubmissionInFirestore(record.id);
      void recordFirestoreAuditEvent(authToken, {
        action: 'ELIMINAR',
        module: 'FORM_EMPRESA',
        targetKey: record.companyName || record.id,
        summary: `Eliminó el formulario empresarial de ${record.companyName}`,
        details: `Contacto: ${record.contactName} · ${record.requestType}`,
        requestMethod: `FIRESTORE empresa_submissions/${record.id}`,
      });
    } catch (err) {
      setEmpresaError(
        err instanceof Error ? err.message : 'No se pudo eliminar el formulario de empresa.'
      );
    } finally {
      setDeletingEmpresaId(null);
    }
  };

  const handleExportEmpresaCsv = (rowsToExport: EmpresaSubmissionRecord[]) => {
    if (rowsToExport.length === 0) return;
    downloadCsvTemplate(
      `reporte_form_empresa_ulep_${getTodayDateStamp()}.csv`,
      [
        'fecha_hora_envio',
        'empresa',
        'nit',
        'contacto',
        'cargo',
        'correo',
        'telefono',
        'tipo_convenio',
        'detalles',
      ],
      rowsToExport.map((item) => [
        formatDateTime(item.createdAt),
        item.companyName,
        item.nit,
        item.contactName,
        item.role,
        item.email,
        item.phone,
        item.requestType,
        item.details,
      ])
    );
    logReportExport('FORM_EMPRESA', rowsToExport.length);
  };

  // Full-screen Login View
  if (!authToken) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Acceso administrativo"
        className="fixed inset-0 z-50 bg-white flex flex-col"
      >
        <div className="flex items-center justify-end p-5">
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-blue-950 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Cerrar</span>
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 pb-16">
          <div className="w-full max-w-sm">
            <h2 className="text-2xl font-extrabold text-blue-950 tracking-tight text-center">
              {authConfigured === false ? 'Activar acceso administrativo' : 'Ingreso administrativo'}
            </h2>
            <p className="text-sm text-slate-600 text-center mt-2">
              {authConfigured === false
                ? 'Define el usuario y contraseña administrativa por primera vez para ingresar.'
                : 'Ingresa tu usuario y contraseña para administrar Pagos y Paz y Salvo.'}
            </p>

            <form onSubmit={handleLoginSubmit} className="mt-7 space-y-4" noValidate>
              {authError && (
                <div
                  role="alert"
                  className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="admin-username"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Usuario
                </label>
                <input
                  id="admin-username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ingresa tu usuario"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="admin-password"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Contraseña
                </label>
                <input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 px-4 rounded-lg bg-blue-950 hover:bg-blue-800 disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                {authLoading
                  ? 'Verificando...'
                  : authConfigured === false
                  ? 'Guardar credenciales e ingresar'
                  : 'Ingresar'}
              </button>
            </form>

            <div className="mt-5 pt-5 border-t border-slate-200">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full py-2.5 px-4 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-60 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                {googleLoading ? 'Verificando cuenta Google...' : 'Ingresar con Google autorizado'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Full-Screen Admin Panel with Left Sidebar
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Panel administrativo de Trámites"
      className="fixed inset-0 z-50 bg-white flex flex-col md:flex-row overflow-hidden"
    >
      {/* Left Sidebar Navigation */}
      <aside className="w-full md:w-64 shrink-0 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col justify-between">
        <div>
          <div className="px-5 py-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-600">Fundación ULEP</p>
              <h2 className="text-base font-extrabold text-blue-950 tracking-tight">
                Administración
              </h2>
            </div>
            <div className="flex items-center gap-1 md:hidden">
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Cerrar sesión"
                className="p-2 rounded-lg text-red-700 hover:bg-red-50 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar panel"
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <nav
            aria-label="Opciones administrativas"
            className="p-3 grid grid-cols-2 md:flex md:flex-col gap-1.5"
          >
            <button
              type="button"
              onClick={() => setActiveSection('pagos')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeSection === 'pagos'
                  ? 'bg-blue-950 text-white'
                  : 'text-slate-700 hover:bg-slate-200/70 hover:text-blue-950'
              }`}
            >
              <ReceiptText className="w-4 h-4 shrink-0" />
              <span>Pagos</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('paz-y-salvo')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeSection === 'paz-y-salvo'
                  ? 'bg-blue-950 text-white'
                  : 'text-slate-700 hover:bg-slate-200/70 hover:text-blue-950'
              }`}
            >
              <FileCheck2 className="w-4 h-4 shrink-0" />
              <span>Paz y Salvo</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('pqrs')}
              className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeSection === 'pqrs'
                  ? 'bg-blue-950 text-white'
                  : 'text-slate-700 hover:bg-slate-200/70 hover:text-blue-950'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <MessageSquareWarning className="w-4 h-4 shrink-0" />
                <span>PQRS</span>
              </span>
              {pqrsSubmissions.filter((item) => item.status === 'PENDIENTE').length > 0 && (
                <span
                  className={`text-[11px] font-bold tabular-nums px-1.5 py-0.5 rounded ${
                    activeSection === 'pqrs'
                      ? 'bg-white/20 text-white'
                      : 'bg-blue-100 text-blue-900'
                  }`}
                >
                  {pqrsSubmissions.filter((item) => item.status === 'PENDIENTE').length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('form-empresa')}
              className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeSection === 'form-empresa'
                  ? 'bg-blue-950 text-white'
                  : 'text-slate-700 hover:bg-slate-200/70 hover:text-blue-950'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 shrink-0" />
                <span>Form Empresa</span>
              </span>
              {empresaSubmissions.length > 0 && (
                <span
                  className={`text-[11px] font-bold tabular-nums px-1.5 py-0.5 rounded ${
                    activeSection === 'form-empresa'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 text-slate-800'
                  }`}
                >
                  {empresaSubmissions.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('plantillas')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeSection === 'plantillas'
                  ? 'bg-blue-950 text-white'
                  : 'text-slate-700 hover:bg-slate-200/70 hover:text-blue-950'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
              <span>Plantillas</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('auditoria')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeSection === 'auditoria'
                  ? 'bg-blue-950 text-white'
                  : 'text-slate-700 hover:bg-slate-200/70 hover:text-blue-950'
              }`}
            >
              <ClipboardList className="w-4 h-4 shrink-0" />
              <span>Auditoría</span>
            </button>
          </nav>
        </div>

        <div className="hidden md:flex flex-col gap-2 p-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Volver a Trámites</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-red-700 hover:bg-red-50 text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Right Main Admin Workspace */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div
          className={`${
            activeSection === 'auditoria' ||
            activeSection === 'pqrs' ||
            activeSection === 'form-empresa'
              ? 'max-w-5xl'
              : 'max-w-4xl'
          } mx-auto px-5 sm:px-8 py-6 sm:py-8 space-y-6`}
        >
          {!isFirebaseAdmin &&
            (activeSection === 'pagos' ||
              activeSection === 'paz-y-salvo' ||
              activeSection === 'pqrs' ||
              activeSection === 'form-empresa') && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-700 leading-relaxed">
                  <p className="font-bold text-blue-950">
                    Conecta tu cuenta administradora para operar en Firestore
                  </p>
                  <p className="mt-0.5">
                    Inicia sesión con la cuenta Google autorizada ({PRIMARY_ADMIN_EMAIL}) para ver,
                    registrar y actualizar datos en tiempo real.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={connectingFirestoreGoogle}
                  onClick={handleConnectFirestoreGoogle}
                  className="px-4 py-2 rounded-lg bg-blue-950 hover:bg-blue-800 disabled:opacity-60 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  {connectingFirestoreGoogle ? 'Conectando...' : 'Conectar con Google'}
                </button>
              </div>
              {auditError && (
                <p role="alert" className="text-xs font-medium text-red-700 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{auditError}</span>
                </p>
              )}
            </div>
          )}

          {/* PAGOS SECTION */}
          {activeSection === 'pagos' && (
            <div className="space-y-8">
              {/* Banner to register payments for citizen lookup */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
                <div className="mb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-blue-950">
                      {editingPaymentCedula
                        ? `Editar pago · Cédula ${editingPaymentCedula}`
                        : 'Registrar pago para consulta'}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1">
                      Registra la cédula, referencia, valor, estado y fecha límite para que las
                      personas puedan consultar su estado de pago.
                    </p>
                  </div>

                  <div className="shrink-0">
                    <input
                      ref={paymentFileInputRef}
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleBulkPaymentsUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={paymentImporting}
                      onClick={() => paymentFileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-200 bg-white hover:bg-blue-50 disabled:opacity-60 text-blue-950 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Upload className="w-4 h-4 text-blue-700" />
                      <span>{paymentImporting ? 'Cargando...' : 'Cargar usuarios'}</span>
                    </button>
                  </div>
                </div>

                {paymentNotice && (
                  <div
                    role="status"
                    className={`mb-4 p-3 rounded-lg border text-xs font-medium ${
                      paymentNotice.type === 'ok'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}
                  >
                    {paymentNotice.text}
                  </div>
                )}

                <form onSubmit={handleSavePayment} className="space-y-4" noValidate>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="pago-cedula"
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Número de cédula *
                      </label>
                      <input
                        id="pago-cedula"
                        type="text"
                        inputMode="numeric"
                        disabled={Boolean(editingPaymentCedula)}
                        value={pCedula}
                        onChange={(e) => setPCedula(e.target.value.replace(/\D/g, '').slice(0, 15))}
                        placeholder="Ej. 1061700001"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-sm text-slate-900 tabular-nums disabled:bg-slate-100 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="pago-referencia"
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Referencia de pago *
                      </label>
                      <input
                        id="pago-referencia"
                        type="text"
                        maxLength={60}
                        value={pReference}
                        onChange={(e) => setPReference(e.target.value)}
                        placeholder="Ej. REF-2026-001"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="pago-valor"
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Valor a pagar
                      </label>
                      <input
                        id="pago-valor"
                        type="text"
                        maxLength={40}
                        value={pAmount}
                        onChange={(e) => setPAmount(e.target.value)}
                        placeholder="Ej. $150.000"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-sm text-slate-900 tabular-nums focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="pago-concepto"
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Concepto
                      </label>
                      <input
                        id="pago-concepto"
                        type="text"
                        maxLength={160}
                        value={pConcept}
                        onChange={(e) => setPConcept(e.target.value)}
                        placeholder="Ej. Cuota de formación / Matrícula"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Estado del pago *
                      </span>
                      <div className="flex items-center gap-1 p-1 bg-white border border-slate-300 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setPIsPaid(false)}
                          className={`flex-1 py-2 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                            !pIsPaid
                              ? 'bg-amber-600 text-white'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Pendiente por pagar
                        </button>
                        <button
                          type="button"
                          onClick={() => setPIsPaid(true)}
                          className={`flex-1 py-2 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                            pIsPaid
                              ? 'bg-emerald-700 text-white'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Pagado
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label
                          htmlFor="pago-fecha"
                          className="text-xs font-semibold text-slate-700"
                        >
                          Fecha límite de pago
                        </label>
                        <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={pNoDueDate}
                            onChange={(e) => {
                              setPNoDueDate(e.target.checked);
                              if (e.target.checked) setPDueDate('');
                            }}
                            className="w-3.5 h-3.5 rounded border-slate-300 text-blue-700 focus:ring-blue-500"
                          />
                          <span>Sin fecha límite</span>
                        </label>
                      </div>
                      <input
                        id="pago-fecha"
                        type="date"
                        disabled={pNoDueDate}
                        value={pDueDate}
                        onChange={(e) => setPDueDate(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-sm text-slate-900 disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={paymentSaving}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-950 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-semibold transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>
                        {paymentSaving
                          ? 'Guardando...'
                          : editingPaymentCedula
                          ? 'Guardar cambios'
                          : 'Registrar pago'}
                      </span>
                    </button>

                    {editingPaymentCedula && (
                      <button
                        type="button"
                        onClick={resetPaymentForm}
                        className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-sm font-semibold transition-colors cursor-pointer"
                      >
                        Cancelar edición
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Registered Payments List */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h4 className="text-base font-bold text-blue-950">
                    Pagos registrados ({payments.length})
                  </h4>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={paymentSearch}
                        onChange={(e) => setPaymentSearch(e.target.value)}
                        placeholder="Buscar por cédula o referencia..."
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-700"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={filteredPayments.length === 0}
                      onClick={handleExportPaymentsCsv}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-700" />
                      <span>Exportar CSV</span>
                    </button>
                  </div>
                </div>

                {loadingPayments ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 py-10 px-4 text-center text-sm text-slate-500">
                    Cargando registros...
                  </div>
                ) : filteredPayments.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 py-10 px-4 text-center text-sm text-slate-500">
                    Aún no hay pagos registrados.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredPayments.map((item) => (
                      <div
                        key={item.cedula}
                        className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                            <span className="font-bold text-blue-950 tabular-nums">
                              Cédula: {item.cedula}
                            </span>
                            <span className="text-slate-300" aria-hidden="true">
                              ·
                            </span>
                            <span className="font-semibold text-slate-700 tabular-nums">
                              Ref: {item.reference}
                            </span>
                            {item.amount && (
                              <>
                                <span className="text-slate-300" aria-hidden="true">
                                  ·
                                </span>
                                <span className="font-bold text-blue-700 tabular-nums">
                                  {item.amount}
                                </span>
                              </>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600">
                            <span
                              className={`inline-flex items-center gap-1 font-semibold ${
                                item.isPaid ? 'text-emerald-700' : 'text-amber-700'
                              }`}
                            >
                              {item.isPaid ? (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              ) : (
                                <Clock className="w-3.5 h-3.5" />
                              )}
                              {item.isPaid ? 'Pagado' : 'Pendiente por pagar'}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>
                              {item.hasDueDate && item.dueDate
                                ? `Fecha límite: ${formatSpanishDate(item.dueDate)}`
                                : 'Sin fecha límite'}
                            </span>
                            {item.concept && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>{item.concept}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleTogglePaymentStatus(item)}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                          >
                            {item.isPaid ? 'Marcar pendiente' : 'Marcar pagado'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditPayment(item)}
                            aria-label={`Editar pago de cédula ${item.cedula}`}
                            className="p-2 rounded-lg border border-slate-200 hover:bg-blue-50 text-blue-700 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePayment(item.cedula)}
                            aria-label={`Eliminar pago de cédula ${item.cedula}`}
                            className="p-2 rounded-lg border border-slate-200 hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PAZ Y SALVO SECTION */}
          {activeSection === 'paz-y-salvo' && (
            <div className="space-y-8">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
                <div className="mb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-blue-950">
                      {editingPazId !== null
                        ? 'Editar Paz y Salvo'
                        : 'Agregar botón de Paz y Salvo'}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1">
                      Registra uno o varios Paz y Salvo con número de registro, nombre, pequeña
                      descripción desplegable y enlace seguro de descarga.
                    </p>
                  </div>

                  <div className="shrink-0">
                    <input
                      ref={pazFileInputRef}
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleBulkPazUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={pazImporting}
                      onClick={() => pazFileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-200 bg-white hover:bg-blue-50 disabled:opacity-60 text-blue-950 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Upload className="w-4 h-4 text-blue-700" />
                      <span>{pazImporting ? 'Cargando...' : 'Cargar usuarios'}</span>
                    </button>
                  </div>
                </div>

                {pazNotice && (
                  <div
                    role="status"
                    className={`mb-4 p-3 rounded-lg border text-xs font-medium ${
                      pazNotice.type === 'ok'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}
                  >
                    {pazNotice.text}
                  </div>
                )}

                <form onSubmit={handleSavePazYSalvo} className="space-y-4" noValidate>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="ps-registro"
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Número de registro *
                      </label>
                      <input
                        id="ps-registro"
                        type="text"
                        maxLength={60}
                        value={psRegNumber}
                        onChange={(e) => setPsRegNumber(e.target.value)}
                        placeholder="Ej. PS-2026-001"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="ps-nombre"
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Nombre del Paz y Salvo *
                      </label>
                      <input
                        id="ps-nombre"
                        type="text"
                        maxLength={140}
                        value={psName}
                        onChange={(e) => setPsName(e.target.value)}
                        placeholder="Ej. Paz y Salvo Académico / Administrativo"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="ps-link"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Link de descarga (https://) *
                    </label>
                    <input
                      id="ps-link"
                      type="url"
                      maxLength={500}
                      value={psDownloadUrl}
                      onChange={(e) => setPsDownloadUrl(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="ps-descripcion"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Pequeña descripción desplegable
                    </label>
                    <textarea
                      id="ps-descripcion"
                      rows={3}
                      maxLength={500}
                      value={psDescription}
                      onChange={(e) => setPsDescription(e.target.value)}
                      placeholder="Escribe una breve descripción o instrucciones que se mostrarán al desplegar este Paz y Salvo..."
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100 resize-y"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="submit"
                      disabled={pazSaving}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-950 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-semibold transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>
                        {pazSaving
                          ? 'Guardando...'
                          : editingPazId !== null
                          ? 'Guardar cambios'
                          : 'Agregar Paz y Salvo'}
                      </span>
                    </button>

                    {editingPazId !== null && (
                      <button
                        type="button"
                        onClick={resetPazForm}
                        className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-sm font-semibold transition-colors cursor-pointer"
                      >
                        Cancelar edición
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Registered Paz y Salvo List */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h4 className="text-base font-bold text-blue-950">
                    Paz y Salvos publicados ({pazYSalvos.length})
                  </h4>
                  <button
                    type="button"
                    disabled={pazYSalvos.length === 0}
                    onClick={handleExportPazCsv}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-700" />
                    <span>Exportar CSV</span>
                  </button>
                </div>

                {loadingPaz ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 py-10 px-4 text-center text-sm text-slate-500">
                    Cargando registros...
                  </div>
                ) : pazYSalvos.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 py-10 px-4 text-center text-sm text-slate-500">
                    Aún no has agregado ningún botón de Paz y Salvo.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pazYSalvos.map((item) => {
                      const safeHref = sanitizeExternalUrl(item.downloadUrl);
                      return (
                        <div
                          key={item.id}
                          className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span className="text-xs font-semibold text-blue-700 tabular-nums">
                                Reg. {item.registrationNumber}
                              </span>
                              <span className="text-slate-300" aria-hidden="true">
                                ·
                              </span>
                              <span className="text-sm font-bold text-blue-950">{item.name}</span>
                            </div>
                            {item.description && (
                              <p className="text-xs text-slate-600 leading-relaxed">
                                {item.description}
                              </p>
                            )}
                            {safeHref !== '#' && (
                              <a
                                href={safeHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline break-all pt-0.5"
                              >
                                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                <span>{item.downloadUrl}</span>
                              </a>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleEditPaz(item)}
                              aria-label={`Editar ${item.name}`}
                              className="p-2 rounded-lg border border-slate-200 hover:bg-blue-50 text-blue-700 transition-colors cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePaz(item.id)}
                              aria-label={`Eliminar ${item.name}`}
                              className="p-2 rounded-lg border border-slate-200 hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PLANTILLAS SECTION */}
          {activeSection === 'plantillas' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-blue-950">
                  Plantillas para carga masiva
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Descarga el formato oficial en CSV (compatible con Excel), diligencia los datos y
                  cárgalo desde el botón <strong>Cargar usuarios</strong> en la sección
                  correspondiente.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Plantilla Pagos */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6 flex flex-col justify-between gap-5">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                        <ReceiptText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-blue-950">Plantilla de Pagos</h4>
                        <p className="text-xs text-slate-500">plantilla_pagos_ulep.csv</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      Permite registrar o actualizar múltiples cédulas al tiempo con su referencia,
                      valor, concepto, estado y fecha límite.
                    </p>

                    <div className="rounded-xl bg-white border border-slate-200 p-3.5 text-xs space-y-1.5 text-slate-700">
                      <p className="font-semibold text-blue-950">Columnas requeridas:</p>
                      <p>
                        <strong>cedula</strong>: solo dígitos (5 a 15 números)
                      </p>
                      <p>
                        <strong>referencia</strong>: código de referencia del pago
                      </p>
                      <p>
                        <strong>valor</strong> y <strong>concepto</strong>: opcionales
                      </p>
                      <p>
                        <strong>pagado</strong>: escribe <code>SI</code> o <code>NO</code>
                      </p>
                      <p>
                        <strong>fecha_limite</strong>: formato <code>AAAA-MM-DD</code> o vacío si no
                        tiene fecha
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadPaymentsTemplate}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-950 hover:bg-blue-800 text-white text-sm font-semibold transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar plantilla de Pagos</span>
                  </button>
                </div>

                {/* Plantilla Paz y Salvo */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6 flex flex-col justify-between gap-5">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                        <FileCheck2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-blue-950">
                          Plantilla de Paz y Salvo
                        </h4>
                        <p className="text-xs text-slate-500">plantilla_paz_y_salvo_ulep.csv</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      Permite cargar varios botones de Paz y Salvo al listado público con su número
                      de registro, nombre, descripción desplegable y enlace de descarga.
                    </p>

                    <div className="rounded-xl bg-white border border-slate-200 p-3.5 text-xs space-y-1.5 text-slate-700">
                      <p className="font-semibold text-blue-950">Columnas requeridas:</p>
                      <p>
                        <strong>numero_registro</strong>: código identificador del certificado
                      </p>
                      <p>
                        <strong>nombre</strong>: título visible del Paz y Salvo
                      </p>
                      <p>
                        <strong>descripcion</strong>: texto breve desplegable (opcional)
                      </p>
                      <p>
                        <strong>link_descarga</strong>: enlace seguro que inicie con{' '}
                        <code>https://</code>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadPazTemplate}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-950 hover:bg-blue-800 text-white text-sm font-semibold transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar plantilla de Paz y Salvo</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PQRS SECTION */}
          {activeSection === 'pqrs' && (
            <AdminPqrsSection
              items={pqrsSubmissions}
              loading={loadingPqrs}
              error={pqrsError}
              isFirebaseAdmin={isFirebaseAdmin}
              updatingId={updatingPqrsId}
              onToggleStatus={(record, nextStatus) => void handleTogglePqrsStatus(record, nextStatus)}
              onDelete={(record) => void handleDeletePqrs(record)}
              onExportCsv={handleExportPqrsCsv}
              formatDateTime={formatDateTime}
            />
          )}

          {/* FORM EMPRESA SECTION */}
          {activeSection === 'form-empresa' && (
            <AdminEmpresaSection
              items={empresaSubmissions}
              loading={loadingEmpresa}
              error={empresaError}
              isFirebaseAdmin={isFirebaseAdmin}
              deletingId={deletingEmpresaId}
              onDelete={(record) => void handleDeleteEmpresa(record)}
              onExportCsv={handleExportEmpresaCsv}
              formatDateTime={formatDateTime}
            />
          )}

          {/* AUDITORIA SECTION (FIRESTORE TABLE VIEW) */}
          {activeSection === 'auditoria' && (
            <AuditLogsTableSection
              logs={auditLogs}
              loading={loadingAudit}
              error={auditError}
              isFirebaseAdmin={isFirebaseAdmin}
              connectingGoogle={connectingFirestoreGoogle}
              geoStatus={geoStatus}
              onConnectGoogle={handleConnectFirestoreGoogle}
              onRequestGps={requestExactLocation}
              onRefresh={() => void refreshFirestoreAuditLogs()}
              onExportCsv={handleExportAuditCsv}
              formatDateTime={formatDateTime}
              getActionMeta={getActionMeta}
              getModuleLabel={getModuleLabel}
            />
          )}
        </div>
      </div>
    </div>
  );
}
