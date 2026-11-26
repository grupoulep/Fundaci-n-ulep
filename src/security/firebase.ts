import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  doc,
  getDocFromServer,
  getFirestore,
  type Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const PAYMENT_REFERENCES_COLLECTION = 'payment_references';
export const ADMINS_COLLECTION = 'admins';
export const ADMIN_DOMAIN_SUFFIX = '@admin.fundacionulep.fun';
export const BOOTSTRAP_ADMIN_EMAIL = 'grupoulep@gmail.com';

// Blueprint validation constants (synchronized verbatim with firebase-blueprint.json & firestore.rules)
export const REF_NUMBER_MAX_LENGTH = 30;
export const REF_NUMBER_PATTERN = /^[0-9]{1,30}$/;
export const CONCEPT_MAX_LENGTH = 180;
export const AMOUNT_MAX = 999999999999;
export const DUE_DATE_MAX_LENGTH = 30;
export const DUE_DATE_PATTERN = /^(|[0-9]{4}-[0-9]{2}-[0-9]{2})$/;
export const PAYMENT_URL_MAX_LENGTH = 500;
export const PAYMENT_URL_PATTERN = /^(|https:\/\/.+)$/;
export const NOTES_MAX_LENGTH = 400;

export type PaymentReferenceStatus = 'pendiente' | 'pagado' | 'vencido' | 'anulado';

export const VALID_PAYMENT_STATUSES: readonly PaymentReferenceStatus[] = [
  'pendiente',
  'pagado',
  'vencido',
  'anulado',
];

export interface PaymentReference {
  referenceNumber: string;
  concept: string;
  amount: number;
  status: PaymentReferenceStatus;
  dueDate: string;
  paymentUrl: string;
  notes: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
  updatedBy: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function sanitizeDigitsOnly(raw: string, maxLength = REF_NUMBER_MAX_LENGTH): string {
  return raw.replace(/\D/g, '').slice(0, maxLength);
}

export function normalizeAdminLoginIdentifier(rawIdentifier: string): string {
  const trimmed = rawIdentifier.trim().toLowerCase();
  if (!trimmed) return '';
  if (trimmed.includes('@')) {
    return trimmed;
  }
  const safeLocal = trimmed.replace(/[^a-z0-9._-]/g, '');
  if (!safeLocal) return '';
  return `${safeLocal}${ADMIN_DOMAIN_SUFFIX}`;
}

export function formatCopCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

void testConnection();
