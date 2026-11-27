import React, { useEffect, useRef, useState } from 'react';
import {
  FileText,
  HeartHandshake,
  FileCheck2,
  ReceiptText,
  HelpCircle,
  X,
  Mail,
  Phone,
  Clock,
  Search,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Download,
} from 'lucide-react';
import SiteLayout from '../components/SiteLayout';
import PqrsInlinePanel from '../components/PqrsInlinePanel';
import ErrorBoundary from '../components/ErrorBoundary';
import AdminPortalOverlay from '../components/AdminPortalOverlay';
import { FaqAccordionContent } from './PreguntasFrecuentesPage';
import { withBase } from '../security/paths';
import { getMediaData, getOrgData } from '../security/vault';
import { sanitizeExternalUrl } from '../security/security';
import {
  getPublicPaymentByCedulaFromFirestore,
  subscribePublicPazYSalvos,
  type PaymentRecord,
  type PazYSalvoRecord,
} from '../security/firestoreTramites';

type TramitesPanelId =
  | 'consulta-pagos'
  | 'paz-y-salvo'
  | 'donaciones'
  | 'pqrs'
  | 'preguntas-frecuentes';

const VALID_PANELS = new Set<TramitesPanelId>([
  'consulta-pagos',
  'paz-y-salvo',
  'donaciones',
  'pqrs',
  'preguntas-frecuentes',
]);

const CEDULA_REGEX = /^[0-9]{5,15}$/;
const DATE_REGEX = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;

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

function PublicConsultaPagosPanel({
  emailAdmin,
  phoneMain,
}: {
  emailAdmin: string;
  phoneMain: string;
}) {
  const [cedulaInput, setCedulaInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchedCedula, setSearchedCedula] = useState<string | null>(null);
  const [result, setResult] = useState<PaymentRecord | null>(null);

  const handleLookup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanCedula = cedulaInput.replace(/\D/g, '');
    if (!CEDULA_REGEX.test(cleanCedula)) {
      setErrorMsg('Ingresa un número de cédula válido (solo dígitos, entre 5 y 15 números).');
      return;
    }

    setLoading(true);
    setSearchedCedula(cleanCedula);
    setResult(null);

    try {
      const payment = await getPublicPaymentByCedulaFromFirestore(cleanCedula);
      setResult(payment);
    } catch {
      setErrorMsg('No se pudo consultar el estado de pago en Firestore en este momento. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-2">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto">
          <ReceiptText className="w-6 h-6" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-blue-950">Consulta de Pagos</h2>
        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
          Ingresa tu número de cédula para verificar el estado de tu pago, referencia y fecha
          límite.
        </p>
      </div>

      <form
        onSubmit={handleLookup}
        className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5 space-y-3"
        noValidate
      >
        <label htmlFor="consulta-cedula" className="block text-xs font-semibold text-slate-700">
          Número de cédula
        </label>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            id="consulta-cedula"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            value={cedulaInput}
            onKeyDown={(e) => {
              if (e.ctrlKey || e.metaKey || e.altKey) return;
              const allowedKeys = [
                'Backspace',
                'Delete',
                'Tab',
                'Enter',
                'Escape',
                'ArrowLeft',
                'ArrowRight',
                'Home',
                'End',
              ];
              if (!allowedKeys.includes(e.key) && !/^[0-9]$/.test(e.key)) {
                e.preventDefault();
              }
            }}
            onChange={(e) => setCedulaInput(e.target.value.replace(/\D/g, '').slice(0, 15))}
            className="flex-1 px-4 py-2.5 rounded-lg bg-white border border-slate-300 text-sm text-slate-900 tabular-nums focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-950 hover:bg-blue-800 disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            <Search className="w-4 h-4" />
            <span>{loading ? 'Consultando...' : 'Consultar pago'}</span>
          </button>
        </div>

        {errorMsg && (
          <p role="alert" className="text-xs font-medium text-red-700 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </p>
        )}
      </form>

      {searchedCedula && !loading && !errorMsg && (
        <div>
          {result ? (
            <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Documento consultado</p>
                  <p className="text-lg font-extrabold text-blue-950 tabular-nums">
                    C.C. {result.cedula}
                  </p>
                </div>

                <div
                  className={`inline-flex items-center gap-1.5 text-sm font-bold ${
                    result.isPaid ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {result.isPaid ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Clock className="w-5 h-5" />
                  )}
                  <span>{result.isPaid ? 'Pagado' : 'Pendiente por pagar'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3.5">
                  <p className="text-xs font-semibold text-slate-500">Referencia de pago</p>
                  <p className="mt-1 font-bold text-blue-950 tabular-nums">{result.reference}</p>
                </div>

                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3.5">
                  <p className="text-xs font-semibold text-slate-500">Fecha límite</p>
                  <p className="mt-1 font-bold text-blue-950">
                    {result.hasDueDate && result.dueDate
                      ? formatSpanishDate(result.dueDate)
                      : 'Sin fecha límite'}
                  </p>
                </div>

                {result.amount && (
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3.5">
                    <p className="text-xs font-semibold text-slate-500">
                      {result.isPaid ? 'Valor cancelado' : 'Valor pendiente por pagar'}
                    </p>
                    <p className="mt-1 text-base font-extrabold text-blue-700 tabular-nums">
                      {result.amount}
                    </p>
                  </div>
                )}

                {result.concept && (
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3.5">
                    <p className="text-xs font-semibold text-slate-500">Concepto</p>
                    <p className="mt-1 font-semibold text-slate-800">{result.concept}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center space-y-2">
              <p className="text-sm font-bold text-blue-950">
                No se encontraron pagos registrados para la cédula {searchedCedula}.
              </p>
              <p className="text-xs text-slate-600">
                Si consideras que debes tener un registro activo, comunícate con nuestra área
                administrativa al teléfono {phoneMain} o al correo {emailAdmin}.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-950">
            <Mail className="w-4 h-4 text-blue-700" />
            Correo administrativo
          </div>
          <a
            href={`mailto:${emailAdmin}`}
            className="mt-1 block text-xs text-blue-700 hover:underline break-all"
          >
            {emailAdmin}
          </a>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-950">
            <Phone className="w-4 h-4 text-blue-700" />
            Teléfono de atención
          </div>
          <p className="mt-1 text-xs text-gray-700 tabular-nums">{phoneMain}</p>
        </div>
      </div>
    </div>
  );
}

function PublicPazYSalvoPanel({
  emailAdmin,
  phoneMain,
}: {
  emailAdmin: string;
  phoneMain: string;
}) {
  const [items, setItems] = useState<PazYSalvoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setLoadError('');
    const unsubscribe = subscribePublicPazYSalvos(
      (list) => {
        setItems(list);
        setLoading(false);
      },
      (errMessage) => {
        setLoadError(errMessage);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-2">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto">
          <FileCheck2 className="w-6 h-6" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-blue-950">Paz y Salvo</h2>
        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
          Consulta los certificados de paz y salvo disponibles, despliega su descripción y accede
          directamente a la descarga.
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 py-10 text-center text-sm text-slate-500">
          Cargando paz y salvos disponibles...
        </div>
      ) : loadError ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-5 text-center text-sm text-red-800"
        >
          {loadError}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center space-y-2">
          <p className="text-sm font-bold text-blue-950">
            Aún no hay paz y salvos publicados en este momento.
          </p>
          <p className="text-xs text-slate-600">
            Si necesitas solicitar tu certificado, contáctanos por correo o línea telefónica.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const isExpanded = expandedId === item.id;
            const safeHref = sanitizeExternalUrl(item.downloadUrl);
            return (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden transition-colors"
              >
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <p className="text-xs font-semibold text-blue-700 tabular-nums">
                      Registro N.º {item.registrationNumber}
                    </p>
                    <h3 className="text-base font-bold text-blue-950">{item.name}</h3>
                    {item.description && (
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        aria-expanded={isExpanded}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-blue-800 transition-colors cursor-pointer pt-0.5"
                      >
                        <span>{isExpanded ? 'Ocultar descripción' : 'Ver descripción'}</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    )}
                  </div>

                  {safeHref !== '#' && (
                    <a
                      href={safeHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-950 hover:bg-blue-800 text-white text-xs sm:text-sm font-semibold transition-colors shrink-0 whitespace-nowrap"
                    >
                      <Download className="w-4 h-4" />
                      <span>Descargar Paz y Salvo</span>
                    </a>
                  )}
                </div>

                {item.description && isExpanded && (
                  <div className="px-4 sm:px-5 pb-4 pt-3 border-t border-slate-100 bg-slate-50 text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {item.description}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-950">
            <Mail className="w-4 h-4 text-blue-700" />
            Correo de soporte
          </div>
          <a
            href={`mailto:${emailAdmin}`}
            className="mt-1 block text-xs text-blue-700 hover:underline break-all"
          >
            {emailAdmin}
          </a>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-950">
            <Phone className="w-4 h-4 text-blue-700" />
            Línea de atención
          </div>
          <p className="mt-1 text-xs text-gray-700 tabular-nums">{phoneMain}</p>
        </div>
      </div>
    </div>
  );
}

export default function TramitesPage() {
  const media = getMediaData();
  const org = getOrgData();
  const [activePanel, setActivePanel] = useState<TramitesPanelId | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const panelContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash.replace(/^#/, '') as TramitesPanelId;
      if (VALID_PANELS.has(hash)) {
        setActivePanel(hash);
      }
    };
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  useEffect(() => {
    if (activePanel && panelContainerRef.current) {
      panelContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activePanel]);

  const handleTogglePanel = (
    e: React.MouseEvent<HTMLAnchorElement>,
    panelId: TramitesPanelId
  ) => {
    e.preventDefault();
    setActivePanel((current) => {
      const next = current === panelId ? null : panelId;
      if (next) {
        window.history.replaceState(null, '', `#${next}`);
      } else {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      return next;
    });
  };

  const getButtonClassName = (panelId: TramitesPanelId) =>
    `group flex items-center justify-center rounded-xl border ${
      activePanel === panelId
        ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-100'
        : 'border-blue-200 bg-white hover:border-blue-600 hover:bg-blue-50/40'
    } shadow-sm hover:shadow-md transition-all px-4 cursor-pointer`;

  return (
    <SiteLayout>
      <main className="relative overflow-hidden w-full flex-1 bg-white">
        <img
          src={withBase(media.patternBg)}
          alt=""
          aria-hidden="true"
          className="pointer-events-none select-none absolute left-0 top-1/2 -translate-y-1/2 h-[125%] w-auto max-w-none object-contain opacity-[0.18] mix-blend-multiply"
        />
        <img
          src={withBase(media.patternBg)}
          alt=""
          aria-hidden="true"
          className="pointer-events-none select-none hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 h-[125%] w-auto max-w-none object-contain -scale-x-100 opacity-[0.18] mix-blend-multiply"
        />
        <div className="relative z-10 w-[calc(100%-1cm)] max-w-5xl mx-auto py-16 sm:py-24">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-950 tracking-tight text-balance">
              Trámites y Servicios en Línea
            </h1>
            <p className="text-base sm:text-lg text-gray-600 mt-3 leading-relaxed">
              Consulta tus pagos, solicita tu paz y salvo, apoya con donaciones, radica
              solicitudes PQRS y revisa nuestras preguntas frecuentes desde un solo lugar.{' '}
              <button
                type="button"
                onClick={() => setAdminOpen(true)}
                className="text-xs text-blue-700 hover:text-blue-950 transition-colors cursor-pointer bg-transparent border-0 p-0 align-baseline"
              >
                login
              </button>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <a
              id="consulta-pagos"
              href="#consulta-pagos"
              onClick={(e) => handleTogglePanel(e, 'consulta-pagos')}
              aria-expanded={activePanel === 'consulta-pagos'}
              className={getButtonClassName('consulta-pagos')}
              style={{ height: '96px' }}
            >
              <div className="flex items-center gap-3 mx-auto text-center sm:text-left">
                <ReceiptText className="w-6 h-6 text-blue-600 flex-shrink-0" />
                <span className="flex flex-col leading-tight">
                  <span className="text-xs font-semibold text-blue-700 tracking-wider">
                    CONSULTA DE
                  </span>
                  <span className="text-lg font-black text-blue-950 uppercase tracking-wide mt-0.5">
                    PAGOS
                  </span>
                </span>
              </div>
            </a>

            <a
              id="paz-y-salvo"
              href="#paz-y-salvo"
              onClick={(e) => handleTogglePanel(e, 'paz-y-salvo')}
              aria-expanded={activePanel === 'paz-y-salvo'}
              className={getButtonClassName('paz-y-salvo')}
              style={{ height: '96px' }}
            >
              <div className="flex items-center gap-3 mx-auto text-center sm:text-left">
                <FileCheck2 className="w-6 h-6 text-blue-600 flex-shrink-0" />
                <span className="flex flex-col leading-tight">
                  <span className="text-xs font-semibold text-blue-700 tracking-wider">
                    SOLICITA TU
                  </span>
                  <span className="text-lg font-black text-blue-950 uppercase tracking-wide mt-0.5">
                    PAZ Y SALVO
                  </span>
                </span>
              </div>
            </a>

            <a
              id="donaciones"
              href="#donaciones"
              onClick={(e) => handleTogglePanel(e, 'donaciones')}
              aria-expanded={activePanel === 'donaciones'}
              className={getButtonClassName('donaciones')}
              style={{ height: '96px' }}
            >
              <div className="flex items-center gap-3 mx-auto text-center sm:text-left">
                <HeartHandshake className="w-6 h-6 text-blue-600 flex-shrink-0" />
                <span className="flex flex-col leading-tight">
                  <span className="text-xs font-semibold text-blue-700 tracking-wider">
                    APOYA CON
                  </span>
                  <span className="text-lg font-black text-blue-950 uppercase tracking-wide mt-0.5">
                    DONACIONES
                  </span>
                </span>
              </div>
            </a>

            <a
              id="pqrs"
              href="#pqrs"
              onClick={(e) => handleTogglePanel(e, 'pqrs')}
              aria-expanded={activePanel === 'pqrs'}
              className={getButtonClassName('pqrs')}
              style={{ height: '96px' }}
            >
              <div className="flex items-center gap-3 mx-auto text-center sm:text-left">
                <FileText className="w-6 h-6 text-blue-600 flex-shrink-0" />
                <span className="flex flex-col leading-tight">
                  <span className="text-xs font-semibold text-blue-700 tracking-wider">
                    DILIGENCIA TU
                  </span>
                  <span className="text-lg font-black text-blue-950 uppercase tracking-wide mt-0.5">
                    PQRS
                  </span>
                </span>
              </div>
            </a>

            <a
              id="preguntas-frecuentes"
              href="#preguntas-frecuentes"
              onClick={(e) => handleTogglePanel(e, 'preguntas-frecuentes')}
              aria-expanded={activePanel === 'preguntas-frecuentes'}
              className={getButtonClassName('preguntas-frecuentes')}
              style={{ height: '96px' }}
            >
              <div className="flex items-center gap-3 mx-auto text-center sm:text-left">
                <HelpCircle className="w-6 h-6 text-blue-600 flex-shrink-0" />
                <span className="flex flex-col leading-tight">
                  <span className="text-xs font-semibold text-blue-700 tracking-wider">
                    PREGUNTAS
                  </span>
                  <span className="text-lg font-black text-blue-950 uppercase tracking-wide mt-0.5">
                    FRECUENTES
                  </span>
                </span>
              </div>
            </a>
          </div>

          {activePanel && (
            <div
              ref={panelContainerRef}
              className="mt-8 h-[1250px] overflow-y-auto rounded-2xl border border-blue-200 bg-white p-6 sm:p-8 shadow-sm relative"
            >
              <button
                type="button"
                onClick={() => setActivePanel(null)}
                aria-label="Cerrar panel"
                className="absolute right-4 top-4 p-2 rounded-lg text-gray-500 hover:text-blue-950 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {activePanel === 'consulta-pagos' && (
                <ErrorBoundary>
                  <PublicConsultaPagosPanel
                    emailAdmin={org.emailAdmin}
                    phoneMain={org.phoneMain}
                  />
                </ErrorBoundary>
              )}

              {activePanel === 'paz-y-salvo' && (
                <ErrorBoundary>
                  <PublicPazYSalvoPanel
                    emailAdmin={org.emailAdmin}
                    phoneMain={org.phoneMain}
                  />
                </ErrorBoundary>
              )}

              {activePanel === 'donaciones' && (
                <div className="max-w-2xl mx-auto text-center space-y-5 py-2">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto">
                    <HeartHandshake className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-blue-950">
                    Apoya con Donaciones
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                    Tu aporte contribuye al desarrollo de programas educativos y sociales de
                    Fundación ULEP. Para coordinar tu donación o solicitar certificado de donación,
                    comunícate con nuestra área administrativa:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <div className="flex items-center gap-2 text-xs font-semibold text-blue-950">
                        <Mail className="w-4 h-4 text-blue-700" />
                        Correo
                      </div>
                      <a
                        href={`mailto:${org.emailAdmin}`}
                        className="mt-1 block text-xs text-blue-700 hover:underline break-all"
                      >
                        {org.emailAdmin}
                      </a>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <div className="flex items-center gap-2 text-xs font-semibold text-blue-950">
                        <Phone className="w-4 h-4 text-blue-700" />
                        Teléfono
                      </div>
                      <p className="mt-1 text-xs text-gray-700 tabular-nums">{org.phoneMain}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <div className="flex items-center gap-2 text-xs font-semibold text-blue-950">
                        <Clock className="w-4 h-4 text-blue-700" />
                        Horario
                      </div>
                      <p className="mt-1 text-xs text-gray-700">{org.schedule}</p>
                    </div>
                  </div>
                </div>
              )}

              {activePanel === 'pqrs' && <PqrsInlinePanel />}

              {activePanel === 'preguntas-frecuentes' && (
                <div className="max-w-4xl mx-auto pt-2">
                  <div className="mb-8 pr-8">
                    <h2 className="text-xl sm:text-2xl font-extrabold text-blue-950 tracking-tight">
                      Preguntas Frecuentes
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Consulta respuestas rápidas sobre nuestra Fundación, programas, voluntariado,
                      alianzas y canales oficiales de atención.
                    </p>
                  </div>
                  <FaqAccordionContent />
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <ErrorBoundary>
        <AdminPortalOverlay
          isOpen={adminOpen}
          onClose={() => setAdminOpen(false)}
        />
      </ErrorBoundary>
    </SiteLayout>
  );
}
