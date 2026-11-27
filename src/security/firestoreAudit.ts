import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  auth,
  db,
  handleFirestoreError,
  isFirebaseAdminUser,
  OperationType,
} from './firebase';

export const AUDIT_LOGS_COLLECTION = 'audit_logs';

export type FirestoreAuditAction =
  | 'CREAR'
  | 'EDITAR'
  | 'CAMBIAR_ESTADO'
  | 'ELIMINAR'
  | 'CARGA_MASIVA'
  | 'EXPORTAR'
  | 'INICIO_SESION'
  | 'CIERRE_SESION';

export type FirestoreAuditModule =
  | 'PAGOS'
  | 'PAZ_Y_SALVO'
  | 'PQRS'
  | 'FORM_EMPRESA'
  | 'AUDITORIA'
  | 'ACCESO';

const ALLOWED_ACTIONS = new Set<FirestoreAuditAction>([
  'CREAR',
  'EDITAR',
  'CAMBIAR_ESTADO',
  'ELIMINAR',
  'CARGA_MASIVA',
  'EXPORTAR',
  'INICIO_SESION',
  'CIERRE_SESION',
]);

const ALLOWED_MODULES = new Set<FirestoreAuditModule>([
  'PAGOS',
  'PAZ_Y_SALVO',
  'PQRS',
  'FORM_EMPRESA',
  'AUDITORIA',
  'ACCESO',
]);

export interface FirestoreAuditLogRecord {
  id: string;
  action: FirestoreAuditAction | string;
  module: FirestoreAuditModule | string;
  targetKey: string;
  actor: string;
  actorUid: string;
  summary: string;
  details: string;
  ipAddress: string;
  location: string;
  deviceInfo: string;
  timezone: string;
  locale: string;
  screenInfo: string;
  requestMethod: string;
  createdAt: string;
}

export interface AuditNetworkContext {
  ipAddress: string;
  location: string;
  deviceInfo: string;
  timezone: string;
  locale: string;
  screenInfo: string;
  requestMethod?: string;
}

export interface FirestoreAuditLogCreateInput {
  action: FirestoreAuditAction;
  module: FirestoreAuditModule;
  targetKey?: string;
  summary: string;
  details?: string;
  requestMethod?: string;
  context?: Partial<AuditNetworkContext>;
}

function clampString(value: unknown, maxLen: number, fallback = ''): string {
  const cleaned = String(value ?? '')
    .replace(/[\r\n\t\x00-\x1f\x7f]/g, ' ')
    .trim();
  const resolved = cleaned || fallback;
  return resolved.slice(0, maxLen);
}

function mapTimestampToIso(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof value === 'string' && value.trim()) {
    return value;
  }
  return new Date().toISOString();
}

function mapDocToAuditRecord(id: string, data: Record<string, unknown>): FirestoreAuditLogRecord {
  return {
    id,
    action: String(data.action ?? ''),
    module: String(data.module ?? ''),
    targetKey: String(data.targetKey ?? ''),
    actor: String(data.actor ?? 'Administrador'),
    actorUid: String(data.actorUid ?? ''),
    summary: String(data.summary ?? ''),
    details: String(data.details ?? ''),
    ipAddress: String(data.ipAddress ?? 'No disponible'),
    location: String(data.location ?? 'No determinada'),
    deviceInfo: String(data.deviceInfo ?? ''),
    timezone: String(data.timezone ?? ''),
    locale: String(data.locale ?? ''),
    screenInfo: String(data.screenInfo ?? ''),
    requestMethod: String(data.requestMethod ?? ''),
    createdAt: mapTimestampToIso(data.createdAt),
  };
}

/**
 * Appends an immutable audit log entry directly to Firestore /audit_logs/{logId}.
 * Enforces every schema constraint from firebase-blueprint.json before writing.
 */
export async function appendFirestoreAuditLog(
  input: FirestoreAuditLogCreateInput
): Promise<boolean> {
  const currentUser = auth.currentUser;
  if (!isFirebaseAdminUser(currentUser) || !currentUser) {
    return false;
  }

  const action: FirestoreAuditAction = ALLOWED_ACTIONS.has(input.action)
    ? input.action
    : 'EDITAR';
  const moduleName: FirestoreAuditModule = ALLOWED_MODULES.has(input.module)
    ? input.module
    : 'AUDITORIA';

  const fallbackTz = (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'No disponible';
    } catch {
      return 'No disponible';
    }
  })();

  const fallbackLocale =
    typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'es-CO';
  const fallbackScreen =
    typeof window !== 'undefined' && window.screen
      ? `${window.screen.width}x${window.screen.height}`
      : 'No disponible';

  const payload = {
    action,
    module: moduleName,
    targetKey: clampString(input.targetKey, 120, ''),
    actor: clampString(currentUser.email, 160, 'Administrador'),
    actorUid: clampString(currentUser.uid, 128, currentUser.uid),
    summary: clampString(input.summary, 240, 'Acción administrativa registrada'),
    details: clampString(input.details, 600, ''),
    ipAddress: clampString(input.context?.ipAddress, 80, 'No disponible'),
    location: clampString(input.context?.location, 180, 'No determinada'),
    deviceInfo: clampString(input.context?.deviceInfo, 160, ''),
    timezone: clampString(input.context?.timezone, 64, fallbackTz),
    locale: clampString(input.context?.locale, 20, fallbackLocale),
    screenInfo: clampString(input.context?.screenInfo, 30, fallbackScreen),
    requestMethod: clampString(
      input.requestMethod || input.context?.requestMethod,
      120,
      'PANEL_ADMIN'
    ),
    createdAt: serverTimestamp(),
  };

  try {
    const docRef = doc(collection(db, AUDIT_LOGS_COLLECTION));
    await setDoc(docRef, payload);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, AUDIT_LOGS_COLLECTION);
  }
}

/**
 * Subscribes in real time to Firestore /audit_logs ordered by createdAt descending.
 * Requires an authenticated verified Firebase admin user.
 */
export function subscribeFirestoreAuditLogs(
  onData: (records: FirestoreAuditLogRecord[]) => void,
  onError?: (friendlyMessage: string) => void
): Unsubscribe {
  if (!isFirebaseAdminUser(auth.currentUser)) {
    onData([]);
    return () => undefined;
  }

  const q = query(
    collection(db, AUDIT_LOGS_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(300)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) =>
        mapDocToAuditRecord(docSnap.id, docSnap.data() as Record<string, unknown>)
      );
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, AUDIT_LOGS_COLLECTION);
      } catch (structuredErr) {
        if (onError) {
          onError(
            structuredErr instanceof Error
              ? structuredErr.message
              : 'No se pudieron leer los registros de auditoría en Firestore.'
          );
        }
      }
    }
  );
}

/**
 * One-shot refresh from Firestore /audit_logs for manual "Actualizar" triggers.
 */
export async function fetchFirestoreAuditLogsOnce(): Promise<FirestoreAuditLogRecord[]> {
  if (!isFirebaseAdminUser(auth.currentUser)) {
    return [];
  }
  const q = query(
    collection(db, AUDIT_LOGS_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(300)
  );
  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) =>
      mapDocToAuditRecord(docSnap.id, docSnap.data() as Record<string, unknown>)
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, AUDIT_LOGS_COLLECTION);
  }
}
