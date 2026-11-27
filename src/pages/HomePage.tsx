import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, X, Image as ImageIcon } from 'lucide-react';
import SiteLayout from '../components/SiteLayout';
import ColombiaInteractiveMap from '../components/ColombiaInteractiveMap';
import { withBase } from '../security/paths';
import { getHomeData, getMediaData } from '../security/vault';

interface NewsEvent {
  image: string;
  date: string;
  title: string;
}

export default function HomePage() {
  const homeData = getHomeData();
  const media = getMediaData();
  const carouselImages = homeData.carousel.map((item) => ({
    ...item,
    url: withBase(item.url)
  }));
  const eventsData: NewsEvent[] = homeData.events.map((item) => ({
    ...item,
    image: withBase(item.image)
  }));
  const welcomeTimeline = homeData.timeline;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedEventImages, setFailedEventImages] = useState<Record<number, boolean>>({});
  const [selectedEvent, setSelectedEvent] = useState<NewsEvent | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const timelineRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Auto-advance top banner every 4 seconds
  useEffect(() => {
    if (carouselImages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % carouselImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [carouselImages.length]);

  // Smoothly progress vertical timeline as the user scrolls through milestones
  useEffect(() => {
    const elements = timelineRefs.current;
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute('data-step-index'));
            if (!Number.isNaN(idx)) {
              setActiveStep(idx);
            }
          }
        });
      },
      { rootMargin: '-30% 0px -45% 0px', threshold: 0.1 }
    );

    elements.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Allow closing news preview modal with Escape key
  useEffect(() => {
    if (!selectedEvent) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedEvent(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEvent]);

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? carouselImages.length - 1 : prevIndex - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % carouselImages.length);
  };

  return (
    <SiteLayout>
      <main className="w-full flex-1 bg-white">
        {/* Panel 1: Main Banner Carousel */}
        <section className="w-full bg-white pt-6 pb-10 sm:pt-8 sm:pb-12">
          <div className="max-w-6xl mx-auto px-6 sm:px-8">
            <div className="relative w-full aspect-[2/1] rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm group">
              {carouselImages.map((slide, index) => (
                <div
                  key={slide.url}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                    index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                  }`}
                >
                  <img
                    src={slide.url}
                    alt={slide.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover aspect-[2/1]"
                  />
                </div>
              ))}

              {carouselImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevSlide}
                    aria-label="Anterior"
                    className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-blue-950/65 hover:bg-blue-950/90 text-white flex items-center justify-center transition-all duration-200 opacity-80 group-hover:opacity-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={nextSlide}
                    aria-label="Siguiente"
                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-blue-950/65 hover:bg-blue-950/90 text-white flex items-center justify-center transition-all duration-200 opacity-80 group-hover:opacity-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Panel 2: ULEP en Cifras */}
        <section
          id="cifras"
          className="scroll-mt-24 relative overflow-hidden w-full bg-slate-50 border-y border-slate-200 py-14 sm:py-16"
        >
          <img
            src={withBase(media.patternBg)}
            alt=""
            aria-hidden="true"
            className="pointer-events-none select-none hidden sm:block absolute left-0 top-1/2 -translate-y-1/2 h-[125%] w-auto max-w-none object-contain opacity-[0.12] mix-blend-multiply"
          />
          <img
            src={withBase(media.patternBg)}
            alt=""
            aria-hidden="true"
            className="pointer-events-none select-none hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 h-[125%] w-auto max-w-none object-contain -scale-x-100 opacity-[0.12] mix-blend-multiply"
          />

          <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
              <p className="text-sm font-semibold text-blue-600 mb-2">Impacto institucional</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-blue-950 tracking-tight text-balance">
                ULEP en cifras
              </h2>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 lg:divide-x lg:divide-slate-200">
              {homeData.stats.map((stat) => (
                <div key={stat.label} className="text-center px-4 sm:px-6 py-2">
                  <p className="text-4xl sm:text-5xl font-black text-blue-700 tabular-nums tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-sm sm:text-base font-semibold text-blue-950 mt-2">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Panel 3: Welcome Journey Timeline */}
        <section
          id="bienvenida"
          className="scroll-mt-24 relative overflow-hidden w-full bg-white py-16 sm:py-24"
        >
          <img
            src={withBase(media.patternBg)}
            alt=""
            aria-hidden="true"
            className="pointer-events-none select-none hidden md:block absolute left-0 top-10 h-[480px] w-auto max-w-none object-contain opacity-[0.1] mix-blend-multiply"
          />
          <img
            src={withBase(media.patternBg)}
            alt=""
            aria-hidden="true"
            className="pointer-events-none select-none hidden md:block absolute right-0 bottom-6 h-[480px] w-auto max-w-none object-contain -scale-x-100 opacity-[0.1] mix-blend-multiply"
          />

          <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="text-sm font-semibold text-blue-600 mb-2">Formación con propósito</p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-blue-950 tracking-tight text-balance">
                Bienvenidos a la <span className="text-blue-600">Fundación ULEP</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-600 mt-4 leading-relaxed">
                Recorre el camino hacia tus metas y descubre cómo nuestros programas impulsan tu
                crecimiento académico y profesional.
              </p>
            </div>

            {/* Vertical Timeline Container */}
            <div className="relative py-2">
              <div
                aria-hidden="true"
                className="absolute left-5 md:left-1/2 md:-translate-x-1/2 top-6 bottom-6 w-0.5 bg-slate-200"
              />
              <div
                aria-hidden="true"
                className="absolute left-5 md:left-1/2 md:-translate-x-1/2 top-6 bottom-6 w-0.5 bg-blue-600 origin-top transition-transform duration-300 ease-out"
                style={{
                  transform: `scaleY(${
                    welcomeTimeline.length > 1 ? activeStep / (welcomeTimeline.length - 1) : 1
                  })`
                }}
              />

              <div className="space-y-8 md:space-y-10">
                {welcomeTimeline.map((item, idx) => {
                  const isActive = idx === activeStep;
                  const isCompleted = idx <= activeStep;
                  const isLeft = idx % 2 === 0;

                  return (
                    <div
                      key={item.step}
                      className="relative grid grid-cols-1 md:grid-cols-2 items-center gap-4 md:gap-12"
                    >
                      <button
                        type="button"
                        onClick={() => setActiveStep(idx)}
                        aria-label={`Paso ${item.step}: ${item.title}`}
                        className={`absolute left-5 md:left-1/2 -translate-x-1/2 z-10 w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-extrabold tabular-nums transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                          isActive
                            ? 'bg-blue-600 border-blue-600 text-white scale-110 shadow-sm'
                            : isCompleted
                            ? 'bg-blue-950 border-blue-950 text-white'
                            : 'bg-white border-slate-300 text-slate-500 hover:border-blue-500 hover:text-blue-700'
                        }`}
                      >
                        {item.step}
                      </button>

                      <div
                        className={`pl-14 md:pl-0 ${
                          isLeft
                            ? 'md:col-start-1 md:pr-8 md:text-right'
                            : 'md:col-start-2 md:pl-8 md:text-left'
                        }`}
                      >
                        <button
                          ref={(el) => {
                            timelineRefs.current[idx] = el;
                          }}
                          data-step-index={idx}
                          type="button"
                          onClick={() => setActiveStep(idx)}
                          className={`w-full text-left ${
                            isLeft ? 'md:text-right' : 'md:text-left'
                          } rounded-xl p-6 border transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                            isActive
                              ? 'bg-white border-blue-600 shadow-sm'
                              : 'bg-slate-50/70 border-slate-200 hover:border-blue-300 hover:bg-white'
                          }`}
                        >
                          <h3 className="text-lg sm:text-xl font-bold text-blue-950 leading-snug">
                            {item.title}
                          </h3>
                          <p className="text-sm sm:text-[15px] text-slate-600 mt-2 leading-relaxed">
                            {item.message}
                          </p>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-12 text-center">
              <a
                href={withBase('/estudiantes.html')}
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-950 hover:bg-blue-800 text-white text-sm font-semibold transition-colors duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <span>Explorar campus y cursos</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </a>
            </div>
          </div>
        </section>

        {/* Panel 4: News and Announcements */}
        <section
          id="noticias"
          className="scroll-mt-24 w-full bg-slate-50 border-y border-slate-200 py-16 sm:py-24"
        >
          <div className="max-w-6xl mx-auto px-6 sm:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="text-sm font-semibold text-blue-600 mb-2">Actualidad institucional</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-blue-950 tracking-tight text-balance">
                Noticias y novedades
              </h2>
              <p className="text-base text-slate-600 mt-3 leading-relaxed">
                Conoce los proyectos vigentes, programas de voluntariado y anuncios de nuestra
                comunidad.
              </p>
            </div>

            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
              {eventsData.map((event, idx) => (
                <article
                  key={event.title}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col transition-colors duration-200 hover:border-blue-300"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedEvent(event)}
                    aria-label={`Ampliar imagen: ${event.title}`}
                    className="group relative w-full aspect-[3/4] overflow-hidden bg-blue-950 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    {failedEventImages[idx] ? (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-blue-100">
                        <ImageIcon className="w-8 h-8 mb-2 opacity-80" />
                        <span className="text-sm font-semibold">{event.title}</span>
                      </div>
                    ) : (
                      <img
                        src={event.image}
                        alt={event.title}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedEventImages((prev) => ({ ...prev, [idx]: true }))
                        }
                        className="w-full h-full object-cover aspect-[3/4] transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    )}
                  </button>

                  <div className="p-6 flex flex-col flex-1 justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium text-slate-500 tabular-nums">
                        {event.date} <span aria-hidden="true">·</span> Fundación ULEP
                      </p>
                      <h3 className="text-lg font-bold text-blue-950 mt-1.5 leading-snug">
                        {event.title}
                      </h3>
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => setSelectedEvent(event)}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-950 transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                      >
                        <span>Ver publicación</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Panel 5: Nationwide Educational Reach */}
        <section
          id="cobertura"
          className="scroll-mt-24 relative overflow-hidden w-full bg-white py-16 sm:py-24"
        >
          <img
            src={withBase(media.patternBg)}
            alt=""
            aria-hidden="true"
            className="pointer-events-none select-none hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 h-[105%] w-auto max-w-none object-contain -scale-x-100 opacity-[0.12] mix-blend-multiply"
          />

          <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Side: Interactive Map of Colombia */}
            <div className="lg:col-span-5 flex items-center justify-center">
              <ColombiaInteractiveMap mapSrc={withBase(media.colombiaMap)} />
            </div>

            {/* Right Side: Inspirational Nationwide Message */}
            <div className="lg:col-span-7 text-center lg:text-left">
              <p className="text-sm font-semibold text-blue-600 mb-2">
                Presencia nacional · Desde Popayán para toda Colombia
              </p>
              <h2 className="text-3xl sm:text-4xl lg:text-[2.65rem] font-extrabold text-blue-950 tracking-tight leading-tight text-balance">
                La educación no conoce fronteras: llega a cada rincón de Colombia
              </h2>
              <p className="text-base sm:text-lg text-slate-600 mt-5 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                En la Fundación ULEP creemos que el talento está presente en todo el territorio y
                que las oportunidades deben llegar hasta donde están las personas. A través de
                nuestros programas virtuales, formación para el trabajo y proyectos sociales,
                acercamos conocimiento, acompañamiento y futuro a cada municipio del país.
              </p>

              <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
                <div>
                  <p className="text-sm font-bold text-blue-950">Modalidad virtual</p>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                    Aulas digitales accesibles desde cualquier municipio.
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-950">Origen regional</p>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                    Impulsando el desarrollo desde Popayán, Cauca.
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-950">Sin barreras</p>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                    Formación continua pensada para transformar vidas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* News Lightbox Modal */}
      {selectedEvent && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={selectedEvent.title}
          onClick={() => setSelectedEvent(null)}
          className="fixed inset-0 z-50 bg-blue-950/75 flex items-center justify-center p-4 sm:p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-2xl border border-slate-200 max-w-lg w-full overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-200">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 tabular-nums">
                  {selectedEvent.date} <span aria-hidden="true">·</span> Fundación ULEP
                </p>
                <h3 className="text-sm sm:text-base font-bold text-blue-950 truncate">
                  {selectedEvent.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                aria-label="Cerrar publicación"
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-slate-50 p-4 flex items-center justify-center">
              <img
                src={selectedEvent.image}
                alt={selectedEvent.title}
                referrerPolicy="no-referrer"
                className="max-h-[75vh] w-auto rounded-xl object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </SiteLayout>
  );
}
