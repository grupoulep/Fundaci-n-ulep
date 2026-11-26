import React, { useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { ExternalLink, Search } from 'lucide-react';
import ErrorBoundary from '../components/ErrorBoundary';
import {
  db,
  formatCopCurrency,
  handleFirestoreError,
  OperationType,
  PAYMENT_REFERENCES_COLLECTION,
  REF_NUMBER_MAX_LENGTH,
  REF_NUMBER_PATTERN,
  sanitizeDigitsOnly,
  type PaymentReference,
  type PaymentReferenceStatus,
} from '../security/firebase';
import { withBase } from '../security/paths';
import { sanitizeExternalUrl } from '../security/security';
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

function ZonaPagosContent() {
  const media = getMediaData();
  const [referenceInput, setReferenceInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PaymentReference | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [firestoreFatalError, setFirestoreFatalError] = useState<Error | null>(null);

  if (firestoreFatalError) {
    throw firestoreFatalError;
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = sanitizeDigitsOnly(e.target.value, REF_NUMBER_MAX_LENGTH);
    setReferenceInput(cleaned);
    if (notFound) setNotFound(false);
    if (errorMessage) setErrorMessage(null);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const cleaned = sanitizeDigitsOnly(pasted, REF_NUMBER_MAX_LENGTH);
    setReferenceInput(cleaned);
    if (notFound) setNotFound(false);
    if (errorMessage) setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const cleaned = sanitizeDigitsOnly(referenceInput, REF_NUMBER_MAX_LENGTH);
    setReferenceInput(cleaned);
    setResult(null);
    setNotFound(false);
    setErrorMessage(null);

    if (!REF_NUMBER_PATTERN.test(cleaned)) {
      setErrorMessage('Ingresa un número de referencia válido.');
      return;
    }

    setLoading(true);
    const path = `${PAYMENT_REFERENCES_COLLECTION}/${cleaned}`;
    try {
      const snap = await getDoc(doc(db, PAYMENT_REFERENCES_COLLECTION, cleaned));
      if (!snap.exists()) {
        setNotFound(true);
      } else {
        setResult(snap.data() as PaymentReference);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.toLowerCase().includes('permission')) {
        try {
          handleFirestoreError(error, OperationType.GET, path);
        } catch (wrapped) {
          setFirestoreFatalError(
            wrapped instanceof Error ? wrapped : new Error(String(wrapped))
          );
        }
      } else {
        setErrorMessage('No fue posible consultar la referencia en este momento.');
      }
    } finally {
      setLoading(false);
    }
  };

  const safePaymentHref =
    result?.paymentUrl && result.status === 'pendiente'
      ? sanitizeExternalUrl(result.paymentUrl)
      : '#';

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
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
            Zona de Pagos
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="reference-number"
                className="block text-sm font-semibold text-blue-950 mb-2"
              >
                Número de referencia
              </label>
              <input
                id="reference-number"
                name="referenceNumber"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                maxLength={REF_NUMBER_MAX_LENGTH}
                value={referenceInput}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder="Solo números"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 tabular-nums tracking-wide focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || referenceInput.length === 0}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 px-5 py-3 text-sm font-semibold text-white transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <Search className="w-4 h-4" />
              {loading ? 'Consultando...' : 'Consultar'}
            </button>
          </form>

          {errorMessage && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {notFound && (
            <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-center text-sm text-gray-700">
              No se encontró información para el número de referencia{' '}
              <span className="font-semibold text-blue-950 tabular-nums">
                {referenceInput}
              </span>
              .
            </div>
          )}

          {result && (
            <div className="mt-6 rounded-xl border border-blue-100 bg-gray-50 p-5 space-y-3">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-gray-200">
                <div>
                  <span className="block text-xs font-medium text-gray-500">
                    Referencia
                  </span>
                  <span className="text-base font-bold text-blue-950 tabular-nums">
                    {result.referenceNumber}
                  </span>
                </div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-lg border text-xs font-semibold ${STATUS_STYLES[result.status]}`}
                >
                  {STATUS_LABELS[result.status]}
                </span>
              </div>

              <div>
                <span className="block text-xs font-medium text-gray-500">
                  Concepto
                </span>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {result.concept}
                </p>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="block text-xs font-medium text-gray-500">
                    Valor
                  </span>
                  <p className="text-lg font-extrabold text-blue-950 tabular-nums mt-0.5">
                    {formatCopCurrency(result.amount)}
                  </p>
                </div>

                {result.dueDate && (
                  <div className="text-right">
                    <span className="block text-xs font-medium text-gray-500">
                      Fecha límite
                    </span>
                    <p className="text-sm font-semibold text-gray-800 tabular-nums mt-0.5">
                      {result.dueDate}
                    </p>
                  </div>
                )}
              </div>

              {result.notes && (
                <div className="pt-2 border-t border-gray-200">
                  <span className="block text-xs font-medium text-gray-500">
                    Observaciones
                  </span>
                  <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-line">
                    {result.notes}
                  </p>
                </div>
              )}

              {safePaymentHref !== '#' && (
                <div className="pt-2">
                  <a
                    href={safePaymentHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 hover:bg-blue-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
                  >
                    Realizar pago
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ZonaPagosPage() {
  return (
    <ErrorBoundary>
      <ZonaPagosContent />
    </ErrorBoundary>
  );
}
