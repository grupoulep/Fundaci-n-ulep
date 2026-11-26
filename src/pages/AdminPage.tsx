import React, { useEffect, useMemo, useState } from 'react';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  Check,
  ExternalLink,
  LogOut,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import ErrorBoundary from '../components/ErrorBoundary';
import {
  ADMINS_COLLECTION,
  AMOUNT_MAX,
  auth,
  BOOTSTRAP_ADMIN_EMAIL,
  CONCEPT_MAX_LENGTH,
  db,
  DUE_DATE_MAX_LENGTH,
  DUE_DATE_PATTERN,
  formatCopCurrency,
  handleFirestoreError,
  normalizeAdminLoginIdentifier,
  NOTES_MAX_LENGTH,
  OperationType,
  PAYMENT_REFERENCES_COLLECTION,
  PAYMENT_URL_MAX_LENGTH,
  PAYMENT_URL_PATTERN,
  REF_NUMBER_MAX_LENGTH,
  REF_NUMBER_PATTERN,
  sanitizeDigitsOnly,
  VALID_PAYMENT_STATUSES,
  type PaymentReference,
  type PaymentReferenceStatus,
} from '../security/firebase';
import { withBase } from '../security/paths';
import { getMediaData } from '../security/vault';

const STATUS_LABELS: Record<PaymentReferenceStatus, string> = {
  pendiente: 'Pendiente',
  pagado: 'Pagado',
  vencido: 'Vencido',
  anulado: 'Anulado',
};

const STATUS_STYLES: Record<PaymentReferenceStatus, string> = {
  pendiente: 'bg-amber-50 text-amber-800 border-amber-200',
  pagado: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  vencido: 'bg-red-50 text-red-800 border-red-200',
  anulado: 'bg-gray-100 text-gray-700 border-gray-200',
};

interface ReferenceFormState {
  referenceNumber: string;
  concept: string;
  amount: string;
  status: PaymentReferenceStatus;
  dueDate: string;
  paymentUrl: string;
  notes: string;
}

const EMPTY_FORM: ReferenceFormState = {
  referenceNumber: '',
  concept: '',
  amount: '',
  status: 'pendiente',
  dueDate: '',
  paymentUrl: '',
  notes: '',
};

type AdminAuthStatus = 'checking' | 'unauthenticated' | 'authorized' | 'unauthorized';

function AdminContent() {
  const media = getMediaData();

  const [user, setUser] = useState<User | null>(null);
  const [adminStatus, setAdminStatus] = useState<AdminAuthStatus>('checking');

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showGoogleFallback, setShowGoogleFallback] = useState(false);

  // Payment references management state
  const [references, setReferences] = useState<PaymentReference[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentReferenceStatus | 'todos'>('todos');

  // Form state
  const [form, setForm] = useState<ReferenceFormState>(EMPTY_FORM);
  const [editingRef, setEditingRef] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [pendingDeleteRef, setPendingDeleteRef] = useState<string | null>(null);
  const [deletingRef, setDeletingRef] = useState<string | null>(null);
  const [fatalError, setFatalError] = useState<Error | null>(null);

  if (fatalError) {
    throw fatalError;
  }

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!active) return;
      setUser(currentUser);

      if (!currentUser) {
        setAdminStatus('unauthenticated');
        setReferences([]);
        return;
      }

      setAdminStatus('checking');
      const isBootstrap =
        currentUser.email === BOOTSTRAP_ADMIN_EMAIL &&
        currentUser.emailVerified === true;

      if (isBootstrap) {
        if (active) setAdminStatus('authorized');
        return;
      }

      try {
        const adminDoc = await getDoc(doc(db, ADMINS_COLLECTION, currentUser.uid));
        if (!active) return;
        if (adminDoc.exists() && adminDoc.data()?.active === true) {
          setAdminStatus('authorized');
        } else {
          setAdminStatus('unauthorized');
        }
      } catch {
        if (active) setAdminStatus('unauthorized');
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (adminStatus !== 'authorized' || !user) return;
    setListLoading(true);
    const q = query(
      collection(db, PAYMENT_REFERENCES_COLLECTION),
      orderBy('updatedAt', 'desc')
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: PaymentReference[] = snapshot.docs.map(
          (docSnap) => docSnap.data() as PaymentReference
        );
        setReferences(items);
        setListLoading(false);
      },
      (error) => {
        setListLoading(false);
        try {
          handleFirestoreError(error, OperationType.LIST, PAYMENT_REFERENCES_COLLECTION);
        } catch (wrapped) {
          setFatalError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
        }
      }
    );

    return () => unsubscribe();
  }, [adminStatus, user]);

  const filteredReferences = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return references.filter((item) => {
      if (statusFilter !== 'todos' && item.status !== statusFilter) return false;
      if (!q) return true;
      return (
        item.referenceNumber.toLowerCase().includes(q) ||
        item.concept.toLowerCase().includes(q)
      );
    });
  }, [references, searchQuery, statusFilter]);

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError(null);
    setShowGoogleFallback(false);

    const normalizedEmail = normalizeAdminLoginIdentifier(username);
    if (!normalizedEmail || !password) {
      setLoginError('Ingresa usuario y contraseña.');
      return;
    }

    setLoginLoading(true);
    try {
      await signInWithEmailAndPassword(auth, normalizedEmail, password);
      setPassword('');
    } catch (err: unknown) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: unknown }).code)
          : '';
      if (code === 'auth/operation-not-allowed') {
        setLoginError(
          'El inicio de sesión con usuario y contraseña aún debe habilitarse en Firebase.'
        );
        setShowGoogleFallback(true);
      } else if (code === 'auth/too-many-requests') {
        setLoginError('Demasiados intentos. Intenta nuevamente en unos minutos.');
      } else {
        setLoginError('Usuario o contraseña incorrectos.');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoginError(null);
    setLoginLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch {
      setLoginError('No fue posible iniciar sesión.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUsername('');
    setPassword('');
    setEditingRef(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setFormSuccess(null);
  };

  const handleReferenceNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const allowedKeys = [
      'Backspace',
      'Delete',
      'Tab',
      'Enter',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
    ];
    if (allowedKeys.includes(e.key)) return;
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const startEdit = (item: PaymentReference) => {
    setEditingRef(item.referenceNumber);
    setForm({
      referenceNumber: item.referenceNumber,
      concept: item.concept,
      amount: String(item.amount),
      status: item.status,
      dueDate: item.dueDate || '',
      paymentUrl: item.paymentUrl || '',
      notes: item.notes || '',
    });
    setFormError(null);
    setFormSuccess(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingRef(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setFormSuccess(null);
  };

  const handleSaveReference = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setFormError(null);
    setFormSuccess(null);

    const refNum = sanitizeDigitsOnly(form.referenceNumber, REF_NUMBER_MAX_LENGTH);
    const concept = form.concept.trim().slice(0, CONCEPT_MAX_LENGTH);
    const parsedAmount = Number(form.amount.replace(/[^\d.]/g, ''));
    const status = form.status;
    const dueDate = form.dueDate.trim().slice(0, DUE_DATE_MAX_LENGTH);
    const paymentUrl = form.paymentUrl.trim().slice(0, PAYMENT_URL_MAX_LENGTH);
    const notes = form.notes.trim().slice(0, NOTES_MAX_LENGTH);

    if (!REF_NUMBER_PATTERN.test(refNum)) {
      setFormError('El número de referencia debe contener solo números (1 a 30 dígitos).');
      return;
    }
    if (!concept) {
      setFormError('El concepto es obligatorio.');
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0 || parsedAmount > AMOUNT_MAX) {
      setFormError('Ingresa un valor válido.');
      return;
    }
    if (!VALID_PAYMENT_STATUSES.includes(status)) {
      setFormError('Selecciona un estado válido.');
      return;
    }
    if (!DUE_DATE_PATTERN.test(dueDate)) {
      setFormError('La fecha límite debe tener formato AAAA-MM-DD.');
      return;
    }
    if (!PAYMENT_URL_PATTERN.test(paymentUrl)) {
      setFormError('El enlace de pago debe iniciar con https:// o quedar vacío.');
      return;
    }

    setSaving(true);
    const docPath = `${PAYMENT_REFERENCES_COLLECTION}/${refNum}`;
    const docRef = doc(db, PAYMENT_REFERENCES_COLLECTION, refNum);

    try {
      if (editingRef) {
        await updateDoc(docRef, {
          concept,
          amount: parsedAmount,
          status,
          dueDate,
          paymentUrl,
          notes,
          updatedAt: serverTimestamp(),
          updatedBy: user.uid,
        });
        setFormSuccess('Referencia actualizada correctamente.');
        setEditingRef(null);
        setForm(EMPTY_FORM);
      } else {
        const existingSnap = await getDoc(docRef);
        if (existingSnap.exists()) {
          setFormError('Ya existe un registro con ese número de referencia.');
          setSaving(false);
          return;
        }
        await setDoc(docRef, {
          referenceNumber: refNum,
          concept,
          amount: parsedAmount,
          status,
          dueDate,
          paymentUrl,
          notes,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          updatedBy: user.uid,
        });
        setFormSuccess('Referencia guardada correctamente.');
        setForm(EMPTY_FORM);
      }
    } catch (error) {
      const opType = editingRef ? OperationType.UPDATE : OperationType.CREATE;
      try {
        handleFirestoreError(error, opType, docPath);
      } catch (wrapped) {
        setFatalError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReference = async (refNum: string) => {
    setDeletingRef(refNum);
    const docPath = `${PAYMENT_REFERENCES_COLLECTION}/${refNum}`;
    try {
      await deleteDoc(doc(db, PAYMENT_REFERENCES_COLLECTION, refNum));
      if (editingRef === refNum) {
        cancelEdit();
      }
      setPendingDeleteRef(null);
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.DELETE, docPath);
      } catch (wrapped) {
        setFatalError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    } finally {
      setDeletingRef(null);
    }
  };

  if (adminStatus === 'checking') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-sm font-medium text-blue-950">Cargando...</div>
      </div>
    );
  }

  if (adminStatus === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-8">
            <a href={withBase('/')} aria-label="Fundación ULEP">
              <img
                src={withBase(media.logoPrimary)}
                alt="Fundación ULEP Logo"
                className="h-16 object-contain"
              />
            </a>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
            <h1 className="text-xl font-bold text-blue-950 text-center mb-6">
              Login
            </h1>

            <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
              <div>
                <label
                  htmlFor="admin-user"
                  className="block text-sm font-semibold text-blue-950 mb-1.5"
                >
                  Usuario
                </label>
                <input
                  id="admin-user"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="admin-pass"
                  className="block text-sm font-semibold text-blue-950 mb-1.5"
                >
                  Contraseña
                </label>
                <input
                  id="admin-pass"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>

              {loginError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full rounded-xl bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 px-5 py-2.5 text-sm font-semibold text-white transition-colors cursor-pointer"
              >
                {loginLoading ? 'Ingresando...' : 'Ingresar'}
              </button>

              {showGoogleFallback && (
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loginLoading}
                  className="w-full rounded-xl border border-gray-300 bg-white hover:bg-gray-50 px-5 py-2.5 text-sm font-semibold text-blue-950 transition-colors cursor-pointer"
                >
                  Continuar con Google
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (adminStatus === 'unauthorized') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-lg font-bold text-blue-950">Acceso no autorizado</h1>
          <p className="mt-2 text-sm text-gray-600">
            Esta cuenta no tiene permisos para administrar referencias de pago.
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 hover:bg-blue-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <a href={withBase('/')} aria-label="Inicio Fundación ULEP">
              <img
                src={withBase(media.logoPrimary)}
                alt="Fundación ULEP Logo"
                className="h-10 object-contain"
              />
            </a>
            <div className="h-6 w-px bg-gray-200 hidden sm:block" />
            <h1 className="text-base sm:text-lg font-bold text-blue-950">
              Referencias de Pago
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={withBase('/zona-pagos.html')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 text-xs sm:text-sm font-semibold text-blue-900 transition-colors"
            >
              Zona de Pagos
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 px-3 py-1.5 text-xs sm:text-sm font-semibold text-gray-700 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Create / Edit Form */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-5">
            <h2 className="text-base font-bold text-blue-950">
              {editingRef
                ? `Editar referencia ${editingRef}`
                : 'Nueva referencia de pago'}
            </h2>
            {editingRef && (
              <button
                type="button"
                onClick={cancelEdit}
                className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
                Cancelar edición
              </button>
            )}
          </div>

          <form onSubmit={handleSaveReference} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="ref-num"
                className="block text-xs font-semibold text-blue-950 mb-1.5"
              >
                Número de referencia *
              </label>
              <input
                id="ref-num"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={REF_NUMBER_MAX_LENGTH}
                disabled={Boolean(editingRef)}
                value={form.referenceNumber}
                onKeyDown={handleReferenceNumberKeyDown}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    referenceNumber: sanitizeDigitsOnly(
                      e.target.value,
                      REF_NUMBER_MAX_LENGTH
                    ),
                  }))
                }
                placeholder="Solo números"
                className="w-full rounded-xl border border-gray-300 disabled:bg-gray-100 px-3.5 py-2.5 text-sm text-gray-900 tabular-nums focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>

            <div>
              <label
                htmlFor="ref-concept"
                className="block text-xs font-semibold text-blue-950 mb-1.5"
              >
                Concepto *
              </label>
              <input
                id="ref-concept"
                type="text"
                maxLength={CONCEPT_MAX_LENGTH}
                value={form.concept}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, concept: e.target.value }))
                }
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>

            <div>
              <label
                htmlFor="ref-amount"
                className="block text-xs font-semibold text-blue-950 mb-1.5"
              >
                Valor (COP) *
              </label>
              <input
                id="ref-amount"
                type="text"
                inputMode="numeric"
                value={form.amount}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    amount: sanitizeDigitsOnly(e.target.value, 12),
                  }))
                }
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 tabular-nums focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>

            <div>
              <label
                htmlFor="ref-status"
                className="block text-xs font-semibold text-blue-950 mb-1.5"
              >
                Estado *
              </label>
              <select
                id="ref-status"
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    status: e.target.value as PaymentReferenceStatus,
                  }))
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {VALID_PAYMENT_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {STATUS_LABELS[st]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="ref-due"
                className="block text-xs font-semibold text-blue-950 mb-1.5"
              >
                Fecha límite
              </label>
              <input
                id="ref-due"
                type="date"
                value={form.dueDate}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, dueDate: e.target.value }))
                }
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="ref-url"
                className="block text-xs font-semibold text-blue-950 mb-1.5"
              >
                Enlace de pago (https://)
              </label>
              <input
                id="ref-url"
                type="url"
                maxLength={PAYMENT_URL_MAX_LENGTH}
                value={form.paymentUrl}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, paymentUrl: e.target.value }))
                }
                placeholder="https://..."
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label
                htmlFor="ref-notes"
                className="block text-xs font-semibold text-blue-950 mb-1.5"
              >
                Observaciones
              </label>
              <input
                id="ref-notes"
                type="text"
                maxLength={NOTES_MAX_LENGTH}
                value={form.notes}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {formError && (
              <div className="sm:col-span-2 lg:col-span-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="sm:col-span-2 lg:col-span-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
                {formSuccess}
              </div>
            )}

            <div className="sm:col-span-2 lg:col-span-3 flex items-center justify-end gap-3 pt-1">
              {editingRef && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-xl border border-gray-300 bg-white hover:bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 px-5 py-2.5 text-sm font-semibold text-white transition-colors cursor-pointer"
              >
                {editingRef ? (
                  <>
                    <Check className="w-4 h-4" />
                    {saving ? 'Actualizando...' : 'Actualizar referencia'}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    {saving ? 'Guardando...' : 'Guardar referencia'}
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Payment References Table */}
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-bold text-blue-950">
              Referencias registradas ({filteredReferences.length})
            </h2>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar referencia o concepto"
                  className="w-full sm:w-64 rounded-xl border border-gray-300 pl-9 pr-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as PaymentReferenceStatus | 'todos')
                }
                aria-label="Filtrar por estado"
                className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="todos">Todos los estados</option>
                {VALID_PAYMENT_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {STATUS_LABELS[st]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {listLoading ? (
            <div className="p-10 text-center text-sm text-gray-500">
              Cargando referencias...
            </div>
          ) : filteredReferences.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-500">
              No hay referencias registradas.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Referencia</th>
                    <th className="py-3 px-4">Concepto</th>
                    <th className="py-3 px-4">Valor</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4">Fecha límite</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredReferences.map((item) => (
                    <tr key={item.referenceNumber} className="hover:bg-gray-50/70">
                      <td className="py-3.5 px-4 font-bold text-blue-950 tabular-nums whitespace-nowrap">
                        {item.referenceNumber}
                      </td>
                      <td className="py-3.5 px-4 text-gray-800 max-w-xs truncate">
                        {item.concept}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-gray-900 tabular-nums whitespace-nowrap">
                        {formatCopCurrency(item.amount)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-lg border text-xs font-semibold ${STATUS_STYLES[item.status]}`}
                        >
                          {STATUS_LABELS[item.status]}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 tabular-nums whitespace-nowrap">
                        {item.dueDate || '—'}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        {pendingDeleteRef === item.referenceNumber ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={deletingRef === item.referenceNumber}
                              onClick={() => handleDeleteReference(item.referenceNumber)}
                              className="rounded-lg bg-red-600 hover:bg-red-700 px-2.5 py-1 text-xs font-semibold text-white cursor-pointer"
                            >
                              Confirmar
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingDeleteRef(null)}
                              className="rounded-lg border border-gray-300 bg-white hover:bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700 cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => startEdit(item)}
                              aria-label={`Editar referencia ${item.referenceNumber}`}
                              className="p-2 rounded-lg text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingDeleteRef(item.referenceNumber)}
                              aria-label={`Eliminar referencia ${item.referenceNumber}`}
                              className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <ErrorBoundary>
      <AdminContent />
    </ErrorBoundary>
  );
}
