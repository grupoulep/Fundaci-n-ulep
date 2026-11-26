/**
 * Phase 0 Payload-First Security TDD specification for Firestore rules.
 * Mirrors the exact invariants enforced in firestore.rules and verifies
 * that all "Dirty Dozen" adversarial payloads are rejected (PERMISSION_DENIED).
 */

export interface AuthContext {
  uid: string;
  email?: string;
  email_verified?: boolean;
  isListedAdmin?: boolean;
}

export interface RuleEvalResult {
  allowed: boolean;
  reason: string;
}

const BOOTSTRAP_ADMIN_EMAIL = 'grupoulep@gmail.com';
const VALID_STATUSES = new Set(['pendiente', 'pagado', 'vencido', 'anulado']);
const ALLOWED_REF_KEYS = new Set([
  'referenceNumber',
  'concept',
  'amount',
  'status',
  'dueDate',
  'paymentUrl',
  'notes',
  'createdAt',
  'updatedAt',
  'updatedBy',
]);
const ALLOWED_UPDATE_KEYS = new Set([
  'concept',
  'amount',
  'status',
  'dueDate',
  'paymentUrl',
  'notes',
  'updatedAt',
  'updatedBy',
]);

function isBootstrapAdmin(auth: AuthContext | null): boolean {
  return Boolean(
    auth &&
      auth.email === BOOTSTRAP_ADMIN_EMAIL &&
      auth.email_verified === true
  );
}

function isAdmin(auth: AuthContext | null): boolean {
  return Boolean(isBootstrapAdmin(auth) || (auth && auth.isListedAdmin === true));
}

function isValidReferenceId(id: string): boolean {
  return typeof id === 'string' && id.length >= 1 && id.length <= 30 && /^[0-9]+$/.test(id);
}

function isValidPaymentReferencePayload(
  data: Record<string, unknown>,
  docId: string,
  auth: AuthContext
): boolean {
  const keys = Object.keys(data);
  if (keys.length !== ALLOWED_REF_KEYS.size) return false;
  for (const key of keys) {
    if (!ALLOWED_REF_KEYS.has(key)) return false;
  }
  if (data.referenceNumber !== docId || !isValidReferenceId(String(data.referenceNumber))) {
    return false;
  }
  if (typeof data.concept !== 'string' || data.concept.length < 1 || data.concept.length > 180) {
    return false;
  }
  if (typeof data.amount !== 'number' || !Number.isFinite(data.amount) || data.amount < 0 || data.amount > 999999999999) {
    return false;
  }
  if (typeof data.status !== 'string' || !VALID_STATUSES.has(data.status)) {
    return false;
  }
  if (
    typeof data.dueDate !== 'string' ||
    data.dueDate.length > 30 ||
    !/^(|[0-9]{4}-[0-9]{2}-[0-9]{2})$/.test(data.dueDate)
  ) {
    return false;
  }
  if (
    typeof data.paymentUrl !== 'string' ||
    data.paymentUrl.length > 500 ||
    !/^(|https:\/\/.+)$/.test(data.paymentUrl)
  ) {
    return false;
  }
  if (typeof data.notes !== 'string' || data.notes.length > 400) {
    return false;
  }
  if (typeof data.updatedBy !== 'string' || data.updatedBy !== auth.uid) {
    return false;
  }
  return true;
}

export interface DirtyDozenCase {
  id: number;
  name: string;
  evaluate: () => RuleEvalResult;
}

const SERVER_TIME = '__SERVER_TIME__';

const BASE_EXISTING = {
  referenceNumber: '10001',
  concept: 'Matrícula académica',
  amount: 250000,
  status: 'pendiente',
  dueDate: '2026-12-31',
  paymentUrl: 'https://pagos.fundacionulep.fun/10001',
  notes: '',
  createdAt: '2026-11-01T00:00:00Z',
  updatedAt: '2026-11-01T00:00:00Z',
  updatedBy: 'admin-uid-1',
};

const VALID_ADMIN: AuthContext = {
  uid: 'admin-uid-1',
  email: BOOTSTRAP_ADMIN_EMAIL,
  email_verified: true,
};

function evaluateCreatePaymentRef(
  auth: AuthContext | null,
  docId: string,
  payload: Record<string, unknown>
): RuleEvalResult {
  if (!auth || !isAdmin(auth)) return { allowed: false, reason: 'PERMISSION_DENIED: admin required' };
  if (!isValidReferenceId(docId)) return { allowed: false, reason: 'PERMISSION_DENIED: invalid reference ID' };
  if (!isValidPaymentReferencePayload(payload, docId, auth)) {
    return { allowed: false, reason: 'PERMISSION_DENIED: invalid schema' };
  }
  if (payload.createdAt !== SERVER_TIME || payload.updatedAt !== SERVER_TIME) {
    return { allowed: false, reason: 'PERMISSION_DENIED: forged timestamp' };
  }
  return { allowed: true, reason: 'OK' };
}

function evaluateUpdatePaymentRef(
  auth: AuthContext | null,
  docId: string,
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>
): RuleEvalResult {
  if (!auth || !isAdmin(auth)) return { allowed: false, reason: 'PERMISSION_DENIED: admin required' };
  if (!isValidReferenceId(docId)) return { allowed: false, reason: 'PERMISSION_DENIED: invalid reference ID' };
  if (!isValidPaymentReferencePayload(incoming, docId, auth)) {
    return { allowed: false, reason: 'PERMISSION_DENIED: invalid schema' };
  }
  if (incoming.referenceNumber !== existing.referenceNumber || incoming.createdAt !== existing.createdAt) {
    return { allowed: false, reason: 'PERMISSION_DENIED: immutable field modified' };
  }
  if (incoming.updatedAt !== SERVER_TIME) {
    return { allowed: false, reason: 'PERMISSION_DENIED: forged updatedAt' };
  }
  for (const key of Object.keys(incoming)) {
    if (incoming[key] !== existing[key] && !ALLOWED_UPDATE_KEYS.has(key)) {
      return { allowed: false, reason: `PERMISSION_DENIED: disallowed key ${key}` };
    }
  }
  return { allowed: true, reason: 'OK' };
}

export const DIRTY_DOZEN_TESTS: DirtyDozenCase[] = [
  {
    id: 1,
    name: 'Unauthenticated create on payment_references',
    evaluate: () =>
      evaluateCreatePaymentRef(null, '10001', {
        ...BASE_EXISTING,
        createdAt: SERVER_TIME,
        updatedAt: SERVER_TIME,
      }),
  },
  {
    id: 2,
    name: 'Unauthenticated list query on payment_references',
    evaluate: () => ({
      allowed: isAdmin(null),
      reason: isAdmin(null) ? 'OK' : 'PERMISSION_DENIED: list restricted to admin',
    }),
  },
  {
    id: 3,
    name: 'Shadow field injection on create',
    evaluate: () =>
      evaluateCreatePaymentRef(VALID_ADMIN, '10002', {
        ...BASE_EXISTING,
        referenceNumber: '10002',
        createdAt: SERVER_TIME,
        updatedAt: SERVER_TIME,
        isVerified: true,
      }),
  },
  {
    id: 4,
    name: 'Shadow field injection on update',
    evaluate: () =>
      evaluateUpdatePaymentRef(VALID_ADMIN, '10001', BASE_EXISTING, {
        ...BASE_EXISTING,
        updatedAt: SERVER_TIME,
        overrideRole: 'superadmin',
      }),
  },
  {
    id: 5,
    name: 'Email spoofing with email_verified=false',
    evaluate: () =>
      evaluateCreatePaymentRef(
        { uid: 'spoof-uid', email: BOOTSTRAP_ADMIN_EMAIL, email_verified: false },
        '10003',
        {
          ...BASE_EXISTING,
          referenceNumber: '10003',
          updatedBy: 'spoof-uid',
          createdAt: SERVER_TIME,
          updatedAt: SERVER_TIME,
        }
      ),
  },
  {
    id: 6,
    name: 'Self-assigned admin escalation on /admins/{uid}',
    evaluate: () => {
      const attacker: AuthContext = { uid: 'attacker-uid', email: 'attacker@example.com', email_verified: true };
      const allowed = isBootstrapAdmin(attacker);
      return {
        allowed,
        reason: allowed ? 'OK' : 'PERMISSION_DENIED: only bootstrap admin can write /admins',
      };
    },
  },
  {
    id: 7,
    name: 'ID poisoning with non-numeric reference ID',
    evaluate: () =>
      evaluateCreatePaymentRef(VALID_ADMIN, 'abc-123', {
        ...BASE_EXISTING,
        referenceNumber: 'abc-123',
        createdAt: SERVER_TIME,
        updatedAt: SERVER_TIME,
      }),
  },
  {
    id: 8,
    name: 'Reference number mismatch on update',
    evaluate: () =>
      evaluateUpdatePaymentRef(VALID_ADMIN, '10001', BASE_EXISTING, {
        ...BASE_EXISTING,
        referenceNumber: '99999',
        updatedAt: SERVER_TIME,
      }),
  },
  {
    id: 9,
    name: 'Immutable createdAt tampering on update',
    evaluate: () =>
      evaluateUpdatePaymentRef(VALID_ADMIN, '10001', BASE_EXISTING, {
        ...BASE_EXISTING,
        createdAt: '2020-01-01T00:00:00Z',
        updatedAt: SERVER_TIME,
      }),
  },
  {
    id: 10,
    name: 'Unsafe javascript: URL injection in paymentUrl',
    evaluate: () =>
      evaluateUpdatePaymentRef(VALID_ADMIN, '10001', BASE_EXISTING, {
        ...BASE_EXISTING,
        paymentUrl: 'javascript:alert(1)',
        updatedAt: SERVER_TIME,
      }),
  },
  {
    id: 11,
    name: 'Value poisoning with negative amount',
    evaluate: () =>
      evaluateUpdatePaymentRef(VALID_ADMIN, '10001', BASE_EXISTING, {
        ...BASE_EXISTING,
        amount: -500,
        updatedAt: SERVER_TIME,
      }),
  },
  {
    id: 12,
    name: 'Identity spoofing via mismatched updatedBy UID',
    evaluate: () =>
      evaluateUpdatePaymentRef(VALID_ADMIN, '10001', BASE_EXISTING, {
        ...BASE_EXISTING,
        updatedBy: 'other-admin-uid',
        updatedAt: SERVER_TIME,
      }),
  },
];

export function verifyDirtyDozenDenied(): boolean {
  return DIRTY_DOZEN_TESTS.every((testCase) => !testCase.evaluate().allowed);
}
