/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import SiteLayout from './components/SiteLayout';
import { withBase } from './utils/paths';

export default function App() {
  const carouselImages = [
    {
      url: withBase('/assets/aistudio/1_e7975bbe.png'),
      title: 'Fundación ULEP',
      subtitle: 'Educación y compromiso con la comunidad'
    },
    {
      url: withBase('/assets/aistudio/2_07cc1b38.png'),
      title: 'Realiza y consulta tus pagos aquí',
      subtitle: 'Paga tus facturas ULEP y descarga tus certificados'
    }
  ];

  const eventsData = [
    {
      image: withBase('/assets/aistudio/1_34f12066.png'),
      date: '19 Nov 2026',
      title: 'Proyecto Smart Cole 1.0 - Fundación ULEP'
    },
    {
      image: withBase('/assets/aistudio/2_f5d2c5c7.png'),
      date: '19 Nov 2026',
      title: 'Certificado de Voluntariado - Fundación ULEP'
    }
  ];

  const welcomeTimeline = [
    {
      step: '01',
      title: 'Da el primer paso hoy',
      message: 'Tu futuro cambia en el instante en que decides formarte. En ULEP las puertas están abiertas para ti.',
      detail: 'Inicia desde cero o fortalece tus habilidades con rutas claras y acompañamiento cercano.'
    },
    {
      step: '02',
      title: 'Aprende con propósito real',
      message: 'Estudia contenidos prácticos diseñados para los retos del mundo laboral y empresarial actual.',
      detail: 'Cursos estudiantiles y administrativos flexibles para avanzar a tu ritmo desde cualquier lugar.'
    },
    {
      step: '03',
      title: 'Certifica tu talento',
      message: 'Cada logro suma: respalda tu hoja de vida con certificados y experiencia que abren nuevas puertas.',
      detail: 'Formación institucional y proyectos de voluntariado que destacan tu perfil profesional.'
    },
    {
      step: '04',
      title: 'Transforma tu futuro en ULEP',
      message: 'No postergues tus metas. Únete a nuestra comunidad de estudiantes y construye nuevas oportunidades.',
      detail: 'Más de 350 estudiantes activos ya confían en Fundación ULEP para crecer cada día.'
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [mapImageError, setMapImageError] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const timelineRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Auto-advance top banner every 4 seconds
  useEffect(() => {
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

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? carouselImages.length - 1 : prevIndex - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % carouselImages.length);
  };

  return (
    <SiteLayout>
      {/* Carousel Section */}
      <main className="w-full p-0">
        <div
          className="w-[calc(100%-1cm)] mx-auto relative aspect-[2/1] overflow-hidden shadow-lg bg-gray-900 group"
          style={{ width: 'calc(100% - 1cm)', marginLeft: '0.5cm', marginRight: '0.5cm' }}
        >
          {/* Images */}
          {carouselImages.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              <img
                src={slide.url}
                alt={slide.title}
                className="w-full h-full object-cover aspect-[2/1]"
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
            </div>
          ))}

          {/* Left Arrow */}
          <button
            onClick={prevSlide}
            aria-label="Anterior"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-200 opacity-70 group-hover:opacity-100 focus:outline-none"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Right Arrow */}
          <button
            onClick={nextSlide}
            aria-label="Siguiente"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-200 opacity-70 group-hover:opacity-100 focus:outline-none"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
            {carouselImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Ir a diapositiva ${index + 1}`}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </div>

        {/* ULEP en Cifras Section */}
        <section
          id="cifras"
          className="relative overflow-hidden w-full bg-white border-y border-gray-200 py-14 sm:py-16 mt-12 mb-16"
        >
          <img
            src={withBase('/assets/aistudio/PROYECTO_8decce25.png')}
            alt=""
            aria-hidden="true"
            className="pointer-events-none select-none absolute left-0 top-1/2 -translate-y-1/2 h-[135%] w-auto max-w-none object-contain opacity-[0.18] mix-blend-multiply"
          />
          <img
            src={withBase('/assets/aistudio/PROYECTO_8decce25.png')}
            alt=""
            aria-hidden="true"
            className="pointer-events-none select-none hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 h-[135%] w-auto max-w-none object-contain -scale-x-100 opacity-[0.15] mix-blend-multiply"
          />
          <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold text-blue-950 uppercase tracking-wide text-balance">
                ULEP en Cifras
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-0 lg:divide-x lg:divide-gray-200">
              {[
                { value: '350', label: 'Estudiantes activos' },
                { value: '32', label: 'Cursos estudiantiles' },
                { value: '12', label: 'Cursos administrativos' },
                { value: '4', label: 'Proyectos vigentes' }
              ].map((stat) => (
                <div key={stat.label} className="text-center px-6 py-2">
                  <p className="text-4xl sm:text-5xl font-black text-blue-600 tabular-nums tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-sm sm:text-base font-semibold text-blue-950 mt-2.5">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Interactive Vertical Welcome Timeline */}
        <section
          id="bienvenida"
          className="scroll-mt-24 relative overflow-hidden w-full mt-16 mb-24 py-4"
        >
          <img
            src={withBase('/assets/aistudio/PROYECTO_8decce25.png')}
            alt=""
            aria-hidden="true"
            className="pointer-events-none select-none hidden md:block absolute left-0 top-8 h-[520px] w-auto max-w-none object-contain opacity-[0.14] mix-blend-multiply"
          />
          <img
            src={withBase('/assets/aistudio/PROYECTO_8decce25.png')}
            alt=""
            aria-hidden="true"
            className="pointer-events-none select-none hidden md:block absolute right-0 bottom-4 h-[520px] w-auto max-w-none object-contain -scale-x-100 opacity-[0.14] mix-blend-multiply"
          />
          <div className="relative z-10 w-[calc(100%-1cm)] max-w-5xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl md:text-5xl font-extrabold text-blue-950 tracking-tight text-balance mb-4">
              Bienvenidos a la <span className="text-blue-600 font-black">Fundación ULEP</span>
            </h2>
            <p className="text-base md:text-lg text-gray-600 leading-relaxed">
              Recorre el camino hacia tus metas. Haz clic en cada paso o desplázate hacia abajo para descubrir por qué estudiar en ULEP impulsa tu futuro.
            </p>
          </div>

          {/* Vertical Timeline Container */}
          <div className="relative py-2">
            {/* Background Vertical Track */}
            <div
              aria-hidden="true"
              className="absolute left-5 md:left-1/2 md:-translate-x-1/2 top-6 bottom-6 w-0.5 bg-gray-200"
            />
            {/* Animated Progress Vertical Fill */}
            <div
              aria-hidden="true"
              className="absolute left-5 md:left-1/2 md:-translate-x-1/2 top-6 bottom-6 w-0.5 bg-blue-600 origin-top transition-transform duration-300 ease-out"
              style={{
                transform: `scaleY(${activeStep / (welcomeTimeline.length - 1)})`
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
                    {/* Center/Left Circular Node */}
                    <button
                      type="button"
                      onClick={() => setActiveStep(idx)}
                      aria-label={`Paso ${item.step}: ${item.title}`}
                      className={`absolute left-5 md:left-1/2 -translate-x-1/2 z-10 w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-extrabold tabular-nums transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                        isActive
                          ? 'bg-blue-600 border-blue-600 text-white scale-110 shadow-md'
                          : isCompleted
                          ? 'bg-blue-950 border-blue-950 text-white'
                          : 'bg-white border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-700'
                      }`}
                    >
                      {item.step}
                    </button>

                    {/* Alternating Card Placement */}
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
                            ? 'bg-white border-blue-600 shadow-md'
                            : 'bg-white/80 border-gray-200 hover:border-blue-300 hover:bg-white'
                        }`}
                      >
                        <h3 className="text-lg sm:text-xl font-bold text-blue-950 leading-snug">
                          {item.title}
                        </h3>
                        <p className="text-sm sm:text-[15px] text-gray-700 mt-2 leading-relaxed">
                          {item.message}
                        </p>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          </div>
        </section>

        {/* News and Events Section */}
        <section
          id="noticias"
          className="scroll-mt-24 w-[calc(100%-1cm)] mx-auto mb-24 px-2"
          style={{ width: 'calc(100% - 1cm)', marginLeft: '0.5cm', marginRight: '0.5cm' }}
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-blue-950 uppercase tracking-wide">Noticias</h2>
          </div>

          {/* Static Mosaic Showing All News with Original 3:4 Card Size */}
          <div className="max-w-6xl mx-auto pt-6 px-4">
            <div className="flex flex-wrap justify-center gap-8">
              {eventsData.map((event, idx) => (
                <a
                  key={idx}
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="group relative flex-shrink-0 w-72 md:w-80 aspect-[3/4] rounded-2xl shadow-lg cursor-pointer transition-all duration-300 hover:scale-105 active:scale-105 hover:shadow-2xl"
                >
                  <div className="w-full h-full rounded-2xl overflow-hidden relative">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover aspect-[3/4] transition-transform duration-500 group-hover:scale-110 group-active:scale-110"
                    />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Nationwide Educational Reach Section */}
        <section
          id="cobertura"
          className="relative overflow-hidden w-full bg-white border-t border-gray-200 py-16 sm:py-24"
        >
          <img
            src={withBase('/assets/aistudio/PROYECTO_8decce25.png')}
            alt=""
            aria-hidden="true"
            className="pointer-events-none select-none hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 h-[105%] w-auto max-w-none object-contain -scale-x-100 opacity-[0.16] mix-blend-multiply"
          />
          <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Side: Map of Colombia */}
            <div className="lg:col-span-5 flex items-center justify-center">
              {mapImageError ? (
                <div className="w-full max-w-sm aspect-[3/4] rounded-2xl bg-blue-50 border border-blue-100 flex flex-col items-center justify-center p-8 text-center">
                  <MapPin className="w-10 h-10 text-blue-700 mb-3" />
                  <p className="text-base font-bold text-blue-950">Presencia en toda Colombia</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Desde Popayán, Cauca hacia todos los departamentos del país.
                  </p>
                </div>
              ) : (
                <img
                  src={withBase('/src/assets/images/mapa_colombia_ulep_1795117682970.jpg')}
                  alt="Mapa de Colombia representando el alcance educativo nacional de Fundación ULEP"
                  referrerPolicy="no-referrer"
                  onError={() => setMapImageError(true)}
                  className="w-full max-w-sm mx-auto object-contain"
                />
              )}
            </div>

            {/* Right Side: Inspirational Nationwide Message */}
            <div className="lg:col-span-7 text-center lg:text-left">
              <p className="text-sm font-semibold text-blue-600 tracking-wide mb-3">
                Presencia Nacional · Desde Popayán para toda Colombia
              </p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-blue-950 tracking-tight leading-tight text-balance">
                La educación no conoce fronteras: llega a cada rincón de Colombia
              </h2>
              <p className="text-base sm:text-lg text-gray-600 mt-5 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                En la Fundación ULEP creemos que el talento está presente en todo el territorio y que las oportunidades deben llegar hasta donde están las personas. A través de nuestros programas virtuales, formación para el trabajo y proyectos sociales, acercamos conocimiento, acompañamiento y futuro a cada municipio del país.
              </p>

              <div className="mt-8 pt-6 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
                <div>
                  <p className="text-sm font-bold text-blue-950">Modalidad virtual</p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    Aulas digitales accesibles desde cualquier municipio.
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-950">Origen regional</p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    Impulsando el desarrollo desde Popayán, Cauca.
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-950">Sin barreras</p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    Formación continua pensada para transformar vidas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </SiteLayout>
  );
}
