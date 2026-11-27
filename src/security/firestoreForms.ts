import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  auth,
  db,
  handleFirestoreError,
  isFirebaseAdminUser,
  OperationType,
} from './firebase';

export const PQRS_COLLECTION = 'pqrs_submissions';
export const EMPRESA_COLLECTION = 'empresa_submissions';

export type PqrsStatus = 'PENDIENTE' | 'HECHO';

export interface PqrsSubmissionRecord {
  id: string;
  radicado: string;
  pqrsType: string;
  area: string;
  fullName: string;
  documentNumber: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: PqrsStatus;
  completedBy: string;
  createdAt: string;
  updatedAt: string;
  createdAtMs: number;
}

export interface PqrsCreateInput {
  pqrsType: string;
  area: string;
  fullName: string;
  documentNumber?: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export interface EmpresaSubmissionRecord {
  id: string;
  companyName: string;
  nit: string;
  contactName: string;
  role: string;
  email: string;
  phone: string;
  requestType: string;
  details: string;
  createdAt: string;
  createdAtMs: number;
}

export interface EmpresaCreateInput {
  companyName: string;
  nit?: string;
  contactName: string;
  role?: string;
  email: string;
  phone: string;
  requestType: string;
  details?: string;
}

function clampSingleLine(value: unknown, maxLen: number): string {
  return String(value ?? '')
    .replace(/[\r\n\t\x00-\x1f\x7f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

function clampMultiline(value: unknown, maxLen: number): string {
  return String(value ?? '')
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '')
    .trim()
    .slice(0, maxLen);
}

function parseTimestamp(value: unknown): { iso: string; ms: number } {
  if (value instanceof Timestamp) {
    return { iso: value.toDate().toISOString(), ms: value.toMillis() };
  }
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    const d = (value as { toDate: () => Date }).toDate();
    return { iso: d.toISOString(), ms: d.getTime() };
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
      return { iso: value, ms: parsed };
    }
  }
  const now = Date.now();
  return { iso: new Date(now).toISOString(), ms: now };
}

function generatePqrsRadicado(): string {
  const year = new Date().getFullYear();
  const suffix = String(Math.floor(1000 + Math.random() * 9000));
  return `PQRS-${year}-${suffix}`;
}

function mapDocToPqrs(id: string, data: Record<string, unknown>): PqrsSubmissionRecord {
  const created = parseTimestamp(data.createdAt);
  const updated = parseTimestamp(data.updatedAt ?? data.createdAt);
  const rawStatus = String(data.status ?? 'PENDIENTE');
  const status: PqrsStatus = rawStatus === 'HECHO' ? 'HECHO' : 'PENDIENTE';

  return {
    id,
    radicado: String(data.radicado ?? ''),
    pqrsType: String(data.pqrsType ?? ''),
    area: String(data.area ?? ''),
    fullName: String(data.fullName ?? ''),
    documentNumber: String(data.documentNumber ?? ''),
    email: String(data.email ?? ''),
    phone: String(data.phone ?? ''),
    subject: String(data.subject ?? ''),
    message: String(data.message ?? ''),
    status,
    completedBy: String(data.completedBy ?? ''),
    createdAt: created.iso,
    updatedAt: updated.iso,
    createdAtMs: created.ms,
  };
}

function mapDocToEmpresa(id: string, data: Record<string, unknown>): EmpresaSubmissionRecord {
  const created = parseTimestamp(data.createdAt);
  return {
    id,
    companyName: String(data.companyName ?? ''),
    nit: String(data.nit ?? ''),
    contactName: String(data.contactName ?? ''),
    role: String(data.role ?? ''),
    email: String(data.email ?? ''),
    phone: String(data.phone ?? ''),
    requestType: String(data.requestType ?? ''),
    details: String(data.details ?? ''),
    createdAt: created.iso,
    createdAtMs: created.ms,
  };
}

/**
 * Public citizen PQRS submission saved directly to Firestore /pqrs_submissions/{recordId}.
 */
export async function createPqrsSubmissionInFirestore(
  input: PqrsCreateInput
): Promise<{ id: string; radicado: string }> {
  const radicado = generatePqrsRadicado();
  const payload = {
    radicado: clampSingleLine(radicado, 40),
    pqrsType: clampSingleLine(input.pqrsType, 80),
    area: clampSingleLine(input.area, 100),
    fullName: clampSingleLine(input.fullName, 140),
    documentNumber: clampSingleLine(input.documentNumber ?? '', 40),
    email: clampSingleLine(input.email, 160),
    phone: clampSingleLine(input.phone, 40),
    subject: clampSingleLine(input.subject, 200),
    message: clampMultiline(input.message, 2000),
    status: 'PENDIENTE' as PqrsStatus,
    completedBy: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    const docRef = doc(collection(db, PQRS_COLLECTION));
    await setDoc(docRef, payload);
    return { id: docRef.id, radicado: payload.radicado };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, PQRS_COLLECTION);
  }
}

/**
 * Admin-only real-time listener for all PQRS submissions in Firestore.
 */
export function subscribeAdminPqrsSubmissions(
  onData: (records: PqrsSubmissionRecord[]) => void,
  onError?: (friendlyMessage: string) => void
): Unsubscribe {
  if (!isFirebaseAdminUser(auth.currentUser)) {
    onData([]);
    return () => undefined;
  }

  return onSnapshot(
    collection(db, PQRS_COLLECTION),
    (snapshot) => {
      const items = snapshot.docs.map((snap) =>
        mapDocToPqrs(snap.id, snap.data() as Record<string, unknown>)
      );
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, PQRS_COLLECTION);
      } catch (structuredErr) {
        if (onError) {
          onError(
            structuredErr instanceof Error
              ? structuredErr.message
              : 'No se pudieron leer las solicitudes PQRS desde Firestore.'
          );
        }
      }
    }
  );
}

/**
 * Admin-only status transition for a PQRS submission ('PENDIENTE' <-> 'HECHO').
 */
export async function updatePqrsStatusInFirestore(
  id: string,
  status: PqrsStatus
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!isFirebaseAdminUser(currentUser) || !currentUser) {
    throw new Error('Debes conectar tu cuenta Google administradora para actualizar PQRS.');
  }

  const completedBy =
    status === 'HECHO' ? clampSingleLine(currentUser.email || currentUser.uid, 160) : '';

  try {
    await updateDoc(doc(db, PQRS_COLLECTION, id), {
      status,
      completedBy,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${PQRS_COLLECTION}/${id}`);
  }
}

/**
 * Admin-only delete for a PQRS submission.
 */
export async function deletePqrsSubmissionInFirestore(id: string): Promise<void> {
  if (!isFirebaseAdminUser(auth.currentUser)) {
    throw new Error('Debes conectar tu cuenta Google administradora para eliminar PQRS.');
  }

  try {
    await deleteDoc(doc(db, PQRS_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${PQRS_COLLECTION}/${id}`);
  }
}

/**
 * Public company form submission saved directly to Firestore /empresa_submissions/{recordId}.
 */
export async function createEmpresaSubmissionInFirestore(
  input: EmpresaCreateInput
): Promise<{ id: string }> {
  const payload = {
    companyName: clampSingleLine(input.companyName, 160),
    nit: clampSingleLine(input.nit ?? '', 40),
    contactName: clampSingleLine(input.contactName, 140),
    role: clampSingleLine(input.role ?? '', 120),
    email: clampSingleLine(input.email, 160),
    phone: clampSingleLine(input.phone, 40),
    requestType: clampSingleLine(input.requestType, 140),
    details: clampMultiline(input.details ?? '', 2000),
    createdAt: serverTimestamp(),
  };

  try {
    const docRef = doc(collection(db, EMPRESA_COLLECTION));
    await setDoc(docRef, payload);
    return { id: docRef.id };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, EMPRESA_COLLECTION);
  }
}

/**
 * Admin-only real-time listener for all company form submissions ordered newest first.
 */
export function subscribeAdminEmpresaSubmissions(
  onData: (records: EmpresaSubmissionRecord[]) => void,
  onError?: (friendlyMessage: string) => void
): Unsubscribe {
  if (!isFirebaseAdminUser(auth.currentUser)) {
    onData([]);
    return () => undefined;
  }

  return onSnapshot(
    collection(db, EMPRESA_COLLECTION),
    (snapshot) => {
      const items = snapshot.docs
        .map((snap) => mapDocToEmpresa(snap.id, snap.data() as Record<string, unknown>))
        .sort((a, b) => b.createdAtMs - a.createdAtMs);
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, EMPRESA_COLLECTION);
      } catch (structuredErr) {
        if (onError) {
          onError(
            structuredErr instanceof Error
              ? structuredErr.message
              : 'No se pudieron leer los formularios de empresas desde Firestore.'
          );
        }
      }
    }
  );
}

/**
 * Admin-only delete for a company form submission.
 */
export async function deleteEmpresaSubmissionInFirestore(id: string): Promise<void> {
  if (!isFirebaseAdminUser(auth.currentUser)) {
    throw new Error(
      'Debes conectar tu cuenta Google administradora para eliminar formularios de empresas.'
    );
  }

  try {
    await deleteDoc(doc(db, EMPRESA_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${EMPRESA_COLLECTION}/${id}`);
  }
}
