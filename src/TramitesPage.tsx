import React from 'react';
import { CreditCard, FileText, HeartHandshake } from 'lucide-react';
import SiteLayout from './components/SiteLayout';
import { withBase } from './utils/paths';

export default function TramitesPage() {
  return (
    <SiteLayout>
      <main className="relative overflow-hidden w-full flex-1 bg-white">
        <img
          src={withBase('/assets/aistudio/PROYECTO_8decce25.png')}
          alt=""
          aria-hidden="true"
          className="pointer-events-none select-none absolute left-0 top-1/2 -translate-y-1/2 h-[125%] w-auto max-w-none object-contain opacity-[0.18] mix-blend-multiply"
        />
        <img
          src={withBase('/assets/aistudio/PROYECTO_8decce25.png')}
          alt=""
          aria-hidden="true"
          className="pointer-events-none select-none hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 h-[125%] w-auto max-w-none object-contain -scale-x-100 opacity-[0.18] mix-blend-multiply"
        />
        <div className="relative z-10 w-[calc(100%-1cm)] max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 py-16 sm:py-24">
          <a
            id="zona-pagos"
            href="#"
            onClick={(e) => e.preventDefault()}
            className="scroll-mt-24 group w-full h-[96px] bg-gray-50 hover:bg-gray-100 border-2 border-blue-400 py-2.5 px-5 rounded-2xl flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.98]"
            style={{ height: '96px' }}
          >
            <div className="flex items-center gap-3 mx-auto text-center sm:text-left">
              <CreditCard className="w-6 h-6 text-blue-600 flex-shrink-0" />
              <span className="flex flex-col leading-tight">
                <span className="text-xs font-semibold text-blue-700 tracking-wider">ZONA DE</span>
                <span className="text-lg font-black text-blue-950 uppercase tracking-wide mt-0.5">
                  PAGOS
                </span>
              </span>
            </div>
          </a>
          <a
            href={withBase('/pqrs.html')}
            className="group w-full h-[96px] bg-gray-50 hover:bg-gray-100 border-2 border-blue-400 py-2.5 px-5 rounded-2xl flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.98]"
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
            id="donaciones"
            href="#"
            onClick={(e) => e.preventDefault()}
            className="scroll-mt-24 group w-full h-[96px] bg-gray-50 hover:bg-gray-100 border-2 border-blue-400 py-2.5 px-5 rounded-2xl flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.98]"
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
        </div>
      </main>
    </SiteLayout>
  );
}
