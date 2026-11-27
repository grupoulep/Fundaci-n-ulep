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
} from 'lucide-react';
import SiteLayout from '../components/SiteLayout';
import PqrsInlinePanel from '../components/PqrsInlinePanel';
import { FaqAccordionContent } from './PreguntasFrecuentesPage';
import { withBase } from '../security/paths';
import { getMediaData, getOrgData } from '../security/vault';

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

export default function TramitesPage() {
  const media = getMediaData();
  const org = getOrgData();
  const [activePanel, setActivePanel] = useState<TramitesPanelId | null>(null);
  const panelContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const hashId = window.location.hash.replace(/^#/, '') as TramitesPanelId;
    if (VALID_PANELS.has(hashId)) {
      setActivePanel(hashId);
    }
  }, []);

  const handleTogglePanel = (
    e: React.MouseEvent<HTMLAnchorElement>,
    panelId: TramitesPanelId
  ) => {
    e.preventDefault();
    setActivePanel((current) => {
      const next = current === panelId ? null : panelId;
      if (next) {
        window.setTimeout(() => {
          panelContainerRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
          });
        }, 50);
      }
      return next;
    });
  };

  const getButtonClassName = (panelId: TramitesPanelId) =>
    `scroll-mt-24 group w-full h-[96px] py-2.5 px-5 rounded-2xl flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.98] border-2 ${
      activePanel === panelId
        ? 'bg-blue-50 border-blue-700 ring-2 ring-blue-200'
        : 'bg-gray-50 hover:bg-gray-100 border-blue-400'
    }`;

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
              solicitudes PQRS y revisa nuestras preguntas frecuentes desde un solo lugar.
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
                    CONSULTA TU
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
                <div className="max-w-2xl mx-auto text-center space-y-5 py-2">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto">
                    <ReceiptText className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-blue-950">
                    Consulta de Pagos
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                    Para verificar el estado de tus pagos o solicitar soportes y comprobantes
                    contables, comunícate con nuestra área administrativa indicando tu nombre
                    completo, documento y comprobante o fecha del pago.
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

              {activePanel === 'paz-y-salvo' && (
                <div className="max-w-2xl mx-auto text-center space-y-5 py-2">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto">
                    <FileCheck2 className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-blue-950">
                    Consulta tu Paz y Salvo
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                    Para solicitar o verificar el estado de tu Paz y Salvo institucional,
                    comunícate con nuestra área de atención indicando tu nombre completo y número de
                    documento.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                    <a
                      href={`mailto:${org.emailAdmin}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-700 hover:bg-blue-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      {org.emailAdmin}
                    </a>
                    <span className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700 tabular-nums">
                      <Phone className="w-4 h-4 text-blue-700" />
                      {org.phoneMain}
                    </span>
                  </div>
                </div>
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
    </SiteLayout>
  );
}
