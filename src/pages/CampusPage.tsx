import React, { useState } from 'react';
import { MonitorPlay, ArrowRight } from 'lucide-react';
import SiteLayout from '../components/SiteLayout';
import { withBase } from '../security/paths';
import { getMediaData } from '../security/vault';

export default function CampusPage() {
  const [imageError, setImageError] = useState(false);
  const media = getMediaData();

  return (
    <SiteLayout>
      <main className="w-full flex-1 bg-white">
        {/* Campus Virtual Section */}
        <section
          id="campus-virtual"
          className="relative overflow-hidden w-full bg-white py-16 sm:py-24"
        >
          <img
            src={withBase(media.patternBg)}
            alt=""
            aria-hidden="true"
            className="pointer-events-none select-none hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 h-[108%] w-auto max-w-none object-contain -scale-x-100 opacity-[0.17] mix-blend-multiply"
          />
          <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Side: Campus Virtual Illustration */}
            <div className="lg:col-span-5 flex items-center justify-center">
              {imageError ? (
                <div className="w-full max-w-md aspect-[4/3] rounded-2xl bg-blue-50 border border-blue-100 flex flex-col items-center justify-center p-8 text-center">
                  <MonitorPlay className="w-10 h-10 text-blue-700 mb-3" />
                  <p className="text-base font-bold text-blue-950">Campus Virtual ULEP</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Plataforma digital de formación, clases en línea y recursos académicos.
                  </p>
                </div>
              ) : (
                <img
                  src={withBase(media.campusHero)}
                  alt="Ilustración institucional del Campus Virtual de Fundación ULEP"
                  referrerPolicy="no-referrer"
                  onError={() => setImageError(true)}
                  className="w-full max-w-md mx-auto object-contain"
                />
              )}
            </div>

            {/* Right Side: Campus Virtual Message */}
            <div className="lg:col-span-7 text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-blue-950 tracking-tight leading-tight text-balance">
                Tu Campus Virtual: aprende a tu ritmo, sin barreras ni distancias
              </h1>
              <p className="text-base sm:text-lg text-gray-600 mt-5 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Accede a un entorno académico moderno diseñado para acompañar tu crecimiento
                profesional. En el Campus Virtual de Fundación ULEP encuentras tus aulas en línea,
                guías de estudio, actividades prácticas, seguimiento docente y tus certificados en
                un solo lugar.
              </p>

              <div className="mt-7 flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <button
                  type="button"
                  onClick={(e) => e.preventDefault()}
                  className="group inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-950 hover:bg-blue-800 text-white text-sm font-semibold transition-all duration-200 active:scale-[0.98] cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  <span>Ingresar al Campus Virtual</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </SiteLayout>
  );
}
