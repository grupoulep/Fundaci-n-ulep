import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  auth,
  db,
  handleFirestoreError,
  isFirebaseAdminUser,
  OperationType,
} from './firebase';

export const PAYMENTS_COLLECTION = 'payment_queries';
export const PAZ_Y_SALVOS_COLLECTION = 'paz_y_salvos';

export const CEDULA_REGEX = /^[0-9]{5,15}$/;
export const DATE_REGEX = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
export const HTTPS_URL_REGEX = /^https:\/\/.+/;

export interface PaymentRecord {
  cedula: string;
  reference: string;
  amount: string;
  concept: string;
  isPaid: boolean;
  hasDueDate: boolean;
  dueDate: string;
  updatedBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PazYSalvoRecord {
  id: string;
  registrationNumber: string;
  name: string;
  description: string;
  downloadUrl: string;
  isPublished: boolean;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

function mapTimestampToIso(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof value === 'string' && value.trim()) {
    return value;
  }
  return new Date().toISOString();
}

function mapDocToPayment(cedulaId: string, data: Record<string, unknown>): PaymentRecord {
  return {
    cedula: String(data.cedula ?? cedulaId),
    reference: String(data.reference ?? ''),
    amount: String(data.amount ?? ''),
    concept: String(data.concept ?? ''),
    isPaid: Boolean(data.isPaid),
    hasDueDate: Boolean(data.hasDueDate),
    dueDate: String(data.dueDate ?? ''),
    updatedBy: String(data.updatedBy ?? ''),
    createdAt: mapTimestampToIso(data.createdAt),
    updatedAt: mapTimestampToIso(data.updatedAt),
  };
}

function mapDocToPazYSalvo(id: string, data: Record<string, unknown>): PazYSalvoRecord {
  return {
    id,
    registrationNumber: String(data.registrationNumber ?? ''),
    name: String(data.name ?? ''),
    description: String(data.description ?? ''),
    downloadUrl: String(data.downloadUrl ?? ''),
    isPublished: Boolean(data.isPublished),
    createdBy: String(data.createdBy ?? ''),
    createdAt: mapTimestampToIso(data.createdAt),
    updatedAt: mapTimestampToIso(data.updatedAt),
  };
}

function requireVerifiedAdminUid(): string {
  const user = auth.currentUser;
  if (!user || !isFirebaseAdminUser(user)) {
    throw new Error('Debes conectar la cuenta administradora de Google para operar en Firestore.');
  }
  return user.uid.slice(0, 128);
}

/**
 * PUBLIC: Exact-cedula payment lookup directly from Firestore /payment_queries/{cedula}.
 */
export async function getPublicPaymentByCedulaFromFirestore(
  rawCedula: string
): Promise<PaymentRecord | null> {
  const cleanCedula = rawCedula.replace(/\D/g, '');
  if (!CEDULA_REGEX.test(cleanCedula)) {
    throw new Error('Ingresa un número de cédula válido (solo dígitos, entre 5 y 15 números).');
  }
  const path = `${PAYMENTS_COLLECTION}/${cleanCedula}`;
  try {
    const snap = await getDoc(doc(db, PAYMENTS_COLLECTION, cleanCedula));
    if (!snap.exists()) return null;
    return mapDocToPayment(snap.id, snap.data() as Record<string, unknown>);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * PUBLIC: Real-time list of published Paz y Salvo items from Firestore /paz_y_salvos.
 */
export function subscribePublicPazYSalvos(
  onData: (items: PazYSalvoRecord[]) => void,
  onError?: (message: string) => void
): Unsubscribe {
  const q = query(collection(db, PAZ_Y_SALVOS_COLLECTION), where('isPublished', '==', true));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs
        .map((docSnap) => mapDocToPazYSalvo(docSnap.id, docSnap.data() as Record<string, unknown>))
        .sort((a, b) => {
          const ta = new Date(a.createdAt || 0).getTime();
          const tb = new Date(b.createdAt || 0).getTime();
          return tb - ta;
        });
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, PAZ_Y_SALVOS_COLLECTION);
      } catch {
        onError?.('No se pudo cargar el listado de Paz y Salvo desde Firestore.');
      }
    }
  );
}

/**
 * ADMIN: Real-time listener for all payment records in Firestore /payment_queries.
 */
export function subscribeAdminPayments(
  onData: (items: PaymentRecord[]) => void,
  onError?: (message: string) => void
): Unsubscribe {
  if (!isFirebaseAdminUser(auth.currentUser)) {
    onData([]);
    return () => undefined;
  }

  return onSnapshot(
    collection(db, PAYMENTS_COLLECTION),
    (snapshot) => {
      const items = snapshot.docs
        .map((docSnap) => mapDocToPayment(docSnap.id, docSnap.data() as Record<string, unknown>))
        .sort((a, b) => {
          const ta = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const tb = new Date(b.updatedAt || b.createdAt || 0).getTime();
          return tb - ta;
        });
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, PAYMENTS_COLLECTION);
      } catch {
        onError?.('No se pudieron cargar los pagos desde Firestore.');
      }
    }
  );
}

/**
 * ADMIN: Create or update a payment record in Firestore /payment_queries/{cedula}.
 */
export async function upsertPaymentInFirestore(input: {
  cedula: string;
  reference: string;
  amount: string;
  concept: string;
  isPaid: boolean;
  hasDueDate: boolean;
  dueDate: string;
}): Promise<{ payment: PaymentRecord; wasUpdate: boolean }> {
  const uid = requireVerifiedAdminUid();
  const cleanCedula = input.cedula.replace(/\D/g, '');
  const cleanRef = input.reference.trim().slice(0, 60);
  const cleanAmount = input.amount.trim().slice(0, 40);
  const cleanConcept = input.concept.trim().slice(0, 160);
  const hasDueDate = Boolean(input.hasDueDate);
  const cleanDueDate = hasDueDate ? input.dueDate.trim().slice(0, 20) : '';

  if (!CEDULA_REGEX.test(cleanCedula)) {
    throw new Error('Ingresa un número de cédula válido (solo dígitos, entre 5 y 15 números).');
  }
  if (!cleanRef) {
    throw new Error('Ingresa el número de referencia del pago.');
  }
  if (hasDueDate && !DATE_REGEX.test(cleanDueDate)) {
    throw new Error('Selecciona una fecha límite válida o marca la opción "Sin fecha límite".');
  }

  const docRef = doc(db, PAYMENTS_COLLECTION, cleanCedula);
  const path = `${PAYMENTS_COLLECTION}/${cleanCedula}`;

  let existed = false;
  try {
    const existingSnap = await getDoc(docRef);
    existed = existingSnap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  try {
    if (existed) {
      await updateDoc(docRef, {
        reference: cleanRef,
        amount: cleanAmount,
        concept: cleanConcept,
        isPaid: Boolean(input.isPaid),
        hasDueDate,
        dueDate: cleanDueDate,
        updatedBy: uid,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(docRef, {
        cedula: cleanCedula,
        reference: cleanRef,
        amount: cleanAmount,
        concept: cleanConcept,
        isPaid: Boolean(input.isPaid),
        hasDueDate,
        dueDate: cleanDueDate,
        updatedBy: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, existed ? OperationType.UPDATE : OperationType.CREATE, path);
  }

  const nowIso = new Date().toISOString();
  return {
    wasUpdate: existed,
    payment: {
      cedula: cleanCedula,
      reference: cleanRef,
      amount: cleanAmount,
      concept: cleanConcept,
      isPaid: Boolean(input.isPaid),
      hasDueDate,
      dueDate: cleanDueDate,
      updatedBy: uid,
      updatedAt: nowIso,
    },
  };
}

/**
 * ADMIN: Toggle paid status on an existing payment record in Firestore.
 */
export async function togglePaymentPaidInFirestore(
  cedula: string,
  nextIsPaid: boolean
): Promise<void> {
  const uid = requireVerifiedAdminUid();
  const cleanCedula = cedula.replace(/\D/g, '');
  if (!CEDULA_REGEX.test(cleanCedula)) {
    throw new Error('Cédula inválida.');
  }
  const path = `${PAYMENTS_COLLECTION}/${cleanCedula}`;
  try {
    await updateDoc(doc(db, PAYMENTS_COLLECTION, cleanCedula), {
      isPaid: Boolean(nextIsPaid),
      updatedBy: uid,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * ADMIN: Delete a payment record from Firestore.
 */
export async function deletePaymentInFirestore(cedula: string): Promise<void> {
  requireVerifiedAdminUid();
  const cleanCedula = cedula.replace(/\D/g, '');
  if (!CEDULA_REGEX.test(cleanCedula)) {
    throw new Error('Cédula inválida.');
  }
  const path = `${PAYMENTS_COLLECTION}/${cleanCedula}`;
  try {
    await deleteDoc(doc(db, PAYMENTS_COLLECTION, cleanCedula));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * ADMIN: Real-time listener for all Paz y Salvo documents in Firestore /paz_y_salvos.
 */
export function subscribeAdminPazYSalvos(
  onData: (items: PazYSalvoRecord[]) => void,
  onError?: (message: string) => void
): Unsubscribe {
  if (!isFirebaseAdminUser(auth.currentUser)) {
    onData([]);
    return () => undefined;
  }

  return onSnapshot(
    collection(db, PAZ_Y_SALVOS_COLLECTION),
    (snapshot) => {
      const items = snapshot.docs
        .map((docSnap) => mapDocToPazYSalvo(docSnap.id, docSnap.data() as Record<string, unknown>))
        .sort((a, b) => {
          const ta = new Date(a.createdAt || 0).getTime();
          const tb = new Date(b.createdAt || 0).getTime();
          return tb - ta;
        });
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, PAZ_Y_SALVOS_COLLECTION);
      } catch {
        onError?.('No se pudieron cargar los registros de Paz y Salvo desde Firestore.');
      }
    }
  );
}

/**
 * ADMIN: Create a new Paz y Salvo document in Firestore /paz_y_salvos.
 */
export async function createPazYSalvoInFirestore(input: {
  registrationNumber: string;
  name: string;
  description: string;
  downloadUrl: string;
}): Promise<PazYSalvoRecord> {
  const uid = requireVerifiedAdminUid();
  const registrationNumber = input.registrationNumber.trim().slice(0, 60);
  const name = input.name.trim().slice(0, 140);
  const description = input.description.trim().slice(0, 500);
  const downloadUrl = input.downloadUrl.trim().slice(0, 500);

  if (!registrationNumber) {
    throw new Error('Ingresa el número de registro del Paz y Salvo.');
  }
  if (!name) {
    throw new Error('Ingresa el nombre del Paz y Salvo.');
  }
  if (!HTTPS_URL_REGEX.test(downloadUrl)) {
    throw new Error('Ingresa un link de descarga válido que inicie con https://');
  }

  const docRef = doc(collection(db, PAZ_Y_SALVOS_COLLECTION));
  const path = `${PAZ_Y_SALVOS_COLLECTION}/${docRef.id}`;
  try {
    await setDoc(docRef, {
      registrationNumber,
      name,
      description,
      downloadUrl,
      isPublished: true,
      createdBy: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }

  const nowIso = new Date().toISOString();
  return {
    id: docRef.id,
    registrationNumber,
    name,
    description,
    downloadUrl,
    isPublished: true,
    createdBy: uid,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

/**
 * ADMIN: Update an existing Paz y Salvo document in Firestore.
 */
export async function updatePazYSalvoInFirestore(
  id: string,
  input: {
    registrationNumber: string;
    name: string;
    description: string;
    downloadUrl: string;
  }
): Promise<PazYSalvoRecord> {
  const uid = requireVerifiedAdminUid();
  const registrationNumber = input.registrationNumber.trim().slice(0, 60);
  const name = input.name.trim().slice(0, 140);
  const description = input.description.trim().slice(0, 500);
  const downloadUrl = input.downloadUrl.trim().slice(0, 500);

  if (!registrationNumber || !name || !HTTPS_URL_REGEX.test(downloadUrl)) {
    throw new Error('Verifica el número de registro, el nombre y el enlace seguro (https://).');
  }

  const path = `${PAZ_Y_SALVOS_COLLECTION}/${id}`;
  try {
    await updateDoc(doc(db, PAZ_Y_SALVOS_COLLECTION, id), {
      registrationNumber,
      name,
      description,
      downloadUrl,
      isPublished: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }

  return {
    id,
    registrationNumber,
    name,
    description,
    downloadUrl,
    isPublished: true,
    createdBy: uid,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * ADMIN: Delete a Paz y Salvo document from Firestore.
 */
export async function deletePazYSalvoInFirestore(id: string): Promise<void> {
  requireVerifiedAdminUid();
  const path = `${PAZ_Y_SALVOS_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, PAZ_Y_SALVOS_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
