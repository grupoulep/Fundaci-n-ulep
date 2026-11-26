import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import SiteLayout from '../components/SiteLayout';
import { withBase } from '../security/paths';
import { sanitizeExternalUrl } from '../security/security';
import { getMediaData, getOrgData } from '../security/vault';

interface FaqItem {
  id: string;
  number: string;
  question: string;
  answer: React.ReactNode;
}

interface FaqCategory {
  title: string;
  items: FaqItem[];
}

function buildFaqCategories(): FaqCategory[] {
  const org = getOrgData();
  return [
    {
      title: 'Sobre FUNDACIÓN ULEP',
      items: [
        {
          id: 'faq-1',
          number: '01',
          question: '¿Qué es FUNDACIÓN ULEP?',
          answer: (
            <p>
              <strong className="font-semibold text-blue-950">FUNDACIÓN ULEP</strong> es una Entidad
              Sin Ánimo de Lucro (ESAL) de derecho privado, autónoma y de utilidad común, dedicada a
              transformar realidades y promover el desarrollo comunitario mediante la educación, el
              voluntariado y la inclusión social. Está identificada con el{' '}
              <span className="font-semibold text-blue-950 tabular-nums">NIT {org.nit}</span>.
            </p>
          )
        },
        {
          id: 'faq-2',
          number: '02',
          question: '¿Dónde está ubicada la Fundación y cuál es su cobertura?',
          answer: (
            <p>
              Nuestra sede principal se encuentra en la{' '}
              <strong className="font-semibold text-blue-950">{org.addressFull}</strong>
              . Aunque nuestro domicilio principal es Popayán, contamos con la capacidad estatutaria
              para desarrollar actividades, proyectos y convenios en otros municipios y ciudades del
              país, así como en el exterior.
            </p>
          )
        },
        {
          id: 'faq-3',
          number: '03',
          question: '¿Cuáles son las principales áreas de trabajo de la Fundación?',
          answer: (
            <p>
              Desarrollamos programas y proyectos enfocados en tres grandes ejes: el{' '}
              <strong className="font-semibold text-blue-950">área educativa</strong>, el{' '}
              <strong className="font-semibold text-blue-950">área deportiva</strong> y el{' '}
              <strong className="font-semibold text-blue-950">área tecnológica</strong>. Nuestras
              iniciativas buscan reducir brechas sociales mediante el acceso a la educación, la
              alfabetización digital, el fomento del emprendimiento, la innovación, el deporte, la
              recreación y los hábitos de vida saludable.
            </p>
          )
        }
      ]
    },
    {
      title: 'Programas, Formación y Proyectos',
      items: [
        {
          id: 'faq-4',
          number: '04',
          question: '¿A quiénes están dirigidos los programas y capacitaciones?',
          answer: (
            <p>
              Nuestros programas de formación integral y procesos de educación para el trabajo y el
              desarrollo humano están dirigidos a niños, jóvenes, adultos, sectores vulnerables,
              emprendedores, empresarios, trabajadores independientes y deportistas interesados en
              fortalecer sus competencias educativas, emprendedoras, deportivas y científicas.
            </p>
          )
        },
        {
          id: 'faq-5',
          number: '05',
          question: '¿Qué proyectos impulsa actualmente FUNDACIÓN ULEP?',
          answer: (
            <p>
              Impulsamos iniciativas pedagógicas, sociales y de apropiación tecnológica en comunidades
              urbanas y rurales del Cauca, entre las que destacan proyectos como{' '}
              <strong className="font-semibold text-blue-950">Un Futuro de Educación</strong> y el
              programa <strong className="font-semibold text-blue-950">SMART COLE 1.0</strong>.
            </p>
          )
        },
        {
          id: 'faq-6',
          number: '06',
          question: '¿Cómo puedo inscribirme en un curso, taller o convocatoria?',
          answer: (
            <p>
              Las convocatorias vigentes se publican en nuestro sitio web{' '}
              <a
                href={sanitizeExternalUrl(org.websiteUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 font-medium hover:underline underline-offset-2"
              >
                {org.websiteUrl}
              </a>{' '}
              y en nuestros canales oficiales. Para participar, solo debes diligenciar el formulario
              de inscripción correspondiente en la sección de{' '}
              <a
                href={withBase('/cursos.html')}
                className="text-blue-700 font-medium hover:underline underline-offset-2"
              >
                Cursos
              </a>{' '}
              o escribir a{' '}
              <a
                href={`mailto:${org.emailContact}`}
                className="text-blue-700 font-medium hover:underline underline-offset-2"
              >
                {org.emailContact}
              </a>{' '}
              indicando el programa de tu interés.
            </p>
          )
        }
      ]
    },
    {
      title: 'Voluntariado',
      items: [
        {
          id: 'faq-7',
          number: '07',
          question: '¿Cómo puedo ser voluntario de FUNDACIÓN ULEP?',
          answer: (
            <p>
              Cualquier persona comprometida con el impacto social puede postularse diligenciando el
              Formulario de Voluntariado disponible en nuestra página web. Una vez recibida tu
              solicitud, nuestro equipo revisa tu perfil y disponibilidad para integrarte a una de
              nuestras áreas de acción.
            </p>
          )
        },
        {
          id: 'faq-8',
          number: '08',
          question: '¿En qué áreas puedo participar como voluntario?',
          answer: (
            <div className="space-y-3">
              <p>
                Puedes vincularte según tus habilidades e intereses en cinco áreas estratégicas:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li>
                  <strong className="font-semibold text-blue-950">Educación y Talleres:</strong>{' '}
                  diseño e impartición de espacios pedagógicos y capacitaciones.
                </li>
                <li>
                  <strong className="font-semibold text-blue-950">Campo y Comunidad:</strong>{' '}
                  intervención directa y acompañamiento en territorio con la población beneficiaria.
                </li>
                <li>
                  <strong className="font-semibold text-blue-950">Logística y Eventos:</strong>{' '}
                  organización operativa de jornadas comunitarias y actividades.
                </li>
                <li>
                  <strong className="font-semibold text-blue-950">
                    Comunicación y Redes Sociales:
                  </strong>{' '}
                  difusión, convocatoria comunitaria y visibilización del impacto social.
                </li>
                <li>
                  <strong className="font-semibold text-blue-950">Apoyo Administrativo:</strong>{' '}
                  soporte a la gestión institucional y operativa.
                </li>
              </ul>
            </div>
          )
        },
        {
          id: 'faq-9',
          number: '09',
          question: '¿El voluntariado incluye certificación oficial?',
          answer: (
            <p>
              Sí. FUNDACIÓN ULEP expide un{' '}
              <strong className="font-semibold text-blue-950">
                Certificado de Experiencia de Voluntariado
              </strong>{' '}
              firmado por el Representante Legal. Este documento acredita el período de vinculación,
              la intensidad horaria total de horas efectivas, el programa o proyecto en el que
              participaste, el rol desempeñado (como Tallerista, Promotor Comunitario, Apoyo
              Logístico o Coordinador de Campo), las actividades ejecutadas y las competencias
              desarrolladas.
            </p>
          )
        }
      ]
    },
    {
      title: 'Empresas, Alianzas y Donaciones',
      items: [
        {
          id: 'faq-10',
          number: '10',
          question: '¿Cómo pueden vincularse empresas o entidades públicas con la Fundación?',
          answer: (
            <p>
              Establecemos alianzas estratégicas, convenios de cooperación y esquemas de financiación
              o cofinanciación con organizaciones del sector público, privado y de la sociedad civil,
              tanto nacionales como internacionales. Las compañías pueden apoyarnos patrocinando
              proyectos educativos o tecnológicos, aportando en especie, articulando oportunidades de
              talento o mediante voluntariado corporativo. Para proponer una alianza, pueden acceder
              al{' '}
              <a
                href={withBase('/empresa.html')}
                className="text-blue-700 font-medium hover:underline underline-offset-2"
              >
                Panel de Empresas
              </a>{' '}
              o escribir a{' '}
              <a
                href={`mailto:${org.emailContact}`}
                className="text-blue-700 font-medium hover:underline underline-offset-2"
              >
                {org.emailContact}
              </a>
              .
            </p>
          )
        },
        {
          id: 'faq-11',
          number: '11',
          question: '¿Cómo puedo realizar una donación segura?',
          answer: (
            <p>
              Todas las donaciones deben realizarse exclusivamente a través de los canales oficiales
              publicados en{' '}
              <a
                href={sanitizeExternalUrl(org.websiteUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 font-medium hover:underline underline-offset-2"
              >
                {org.websiteUrl}
              </a>{' '}
              o en cuentas bancarias a nombre de{' '}
              <strong className="font-semibold text-blue-950">FUNDACIÓN ULEP</strong>. Los recursos
              recaudados se destinan al financiamiento y sostenibilidad de nuestros proyectos
              sociales, educativos, deportivos y tecnológicos. Para solicitar comprobantes o soporte
              administrativo de tu aporte, escribe a{' '}
              <a
                href={`mailto:${org.emailAdmin}`}
                className="text-blue-700 font-medium hover:underline underline-offset-2"
              >
                {org.emailAdmin}
              </a>
              .
            </p>
          )
        }
      ]
    },
    {
      title: 'Privacidad, Datos y Contacto',
      items: [
        {
          id: 'faq-12',
          number: '12',
          question: '¿Cómo protege FUNDACIÓN ULEP mis datos personales y los de menores de edad?',
          answer: (
            <p>
              Cumplimos estrictamente con la Ley 1581 de 2012 (Habeas Data) y las normas de
              protección de menores en Colombia. Los datos recolectados en nuestros formularios se
              utilizan únicamente para las finalidades autorizadas por el titular. Si deseas conocer,
              actualizar, rectificar o suprimir tu información personal, puedes enviar tu solicitud a{' '}
              <a
                href={`mailto:${org.emailLegal}`}
                className="text-blue-700 font-medium hover:underline underline-offset-2"
              >
                {org.emailLegal}
              </a>{' '}
              o consultar nuestra{' '}
              <a
                href={withBase('/politica-privacidad.html')}
                className="text-blue-700 font-medium hover:underline underline-offset-2"
              >
                Política de Privacidad
              </a>
              .
            </p>
          )
        },
        {
          id: 'faq-13',
          number: '13',
          question: '¿Cuáles son los canales oficiales de atención?',
          answer: (
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>
                <strong className="font-semibold text-blue-950">
                  Consultas generales, programas y voluntariado:
                </strong>{' '}
                <a
                  href={`mailto:${org.emailContact}`}
                  className="text-blue-700 font-medium hover:underline underline-offset-2"
                >
                  {org.emailContact}
                </a>
              </li>
              <li>
                <strong className="font-semibold text-blue-950">
                  Donaciones, comprobantes y temas contables:
                </strong>{' '}
                <a
                  href={`mailto:${org.emailAdmin}`}
                  className="text-blue-700 font-medium hover:underline underline-offset-2"
                >
                  {org.emailAdmin}
                </a>
              </li>
              <li>
                <strong className="font-semibold text-blue-950">
                  Protección de datos personales (PQR) y asuntos legales:
                </strong>{' '}
                <a
                  href={`mailto:${org.emailLegal}`}
                  className="text-blue-700 font-medium hover:underline underline-offset-2"
                >
                  {org.emailLegal}
                </a>
              </li>
              <li>
                <strong className="font-semibold text-blue-950">Teléfono de contacto:</strong>{' '}
                <span className="tabular-nums">{org.phoneMain}</span>
              </li>
              <li>
                <strong className="font-semibold text-blue-950">Dirección física:</strong>{' '}
                {org.addressShort}.
              </li>
            </ul>
          )
        }
      ]
    }
  ];
}

export default function PreguntasFrecuentesPage() {
  const faqCategories = buildFaqCategories();
  const media = getMediaData();
  const [openFaqIds, setOpenFaqIds] = useState<string[]>([]);

  const toggleFaq = (id: string) => {
    setOpenFaqIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <SiteLayout>
      <main className="w-full flex-1 bg-white">
        {/* Institutional Hero Header */}
        <section className="relative overflow-hidden w-full bg-white border-b border-gray-200">
          <img
            src={withBase(media.patternBg)}
            alt=""
            aria-hidden="true"
            className="pointer-events-none select-none hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 h-[125%] w-auto max-w-none object-contain -scale-x-100 opacity-[0.18] mix-blend-multiply"
          />
          <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 py-14 sm:py-18">
            <div className="max-w-3xl">
              <h1 className="text-3xl sm:text-5xl font-extrabold text-blue-950 tracking-tight leading-tight text-balance">
                Preguntas Frecuentes
              </h1>
              <p className="text-base sm:text-lg text-gray-600 mt-4 leading-relaxed max-w-2xl">
                Consulta respuestas rápidas sobre nuestra Fundación, programas, voluntariado,
                alianzas y canales oficiales de atención.
              </p>
            </div>
          </div>
        </section>

        {/* Collapsible Frequently Asked Questions */}
        <section
          id="preguntas-frecuentes"
          className="scroll-mt-24 relative overflow-hidden w-full bg-white py-14 sm:py-20"
        >
          <img
            src={withBase(media.patternBg)}
            alt=""
            aria-hidden="true"
            className="pointer-events-none select-none hidden md:block absolute left-0 top-12 h-[540px] w-auto max-w-none object-contain opacity-[0.14] mix-blend-multiply"
          />
          <img
            src={withBase(media.patternBg)}
            alt=""
            aria-hidden="true"
            className="pointer-events-none select-none hidden md:block absolute right-0 bottom-12 h-[540px] w-auto max-w-none object-contain -scale-x-100 opacity-[0.14] mix-blend-multiply"
          />

          <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8">
            <div className="space-y-10">
              {faqCategories.map((category) => (
                <div key={category.title}>
                  <h2 className="text-lg sm:text-xl font-extrabold text-blue-950 tracking-tight pb-3 border-b-2 border-blue-950 mb-4">
                    {category.title}
                  </h2>

                  <div className="divide-y divide-gray-200 border-b border-gray-200 bg-white/90">
                    {category.items.map((item) => {
                      const isOpen = openFaqIds.includes(item.id);
                      const panelId = `${item.id}-panel`;

                      return (
                        <div key={item.id}>
                          <button
                            type="button"
                            aria-expanded={isOpen}
                            aria-controls={panelId}
                            onClick={() => toggleFaq(item.id)}
                            className="w-full py-4 sm:py-5 px-2 sm:px-3 flex items-center justify-between gap-4 text-left hover:bg-gray-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg"
                          >
                            <span className="flex items-baseline gap-3">
                              <span className="text-xs font-bold text-blue-700 tabular-nums shrink-0">
                                {item.number}.
                              </span>
                              <span className="text-sm sm:text-base font-bold text-blue-950 leading-snug">
                                {item.question}
                              </span>
                            </span>
                            <ChevronDown
                              aria-hidden="true"
                              className={`w-5 h-5 text-blue-800 shrink-0 transition-transform duration-200 ${
                                isOpen ? 'rotate-180' : ''
                              }`}
                            />
                          </button>

                          {isOpen && (
                            <div
                              id={panelId}
                              className="px-2 sm:px-3 pb-5 pl-9 sm:pl-11 text-sm sm:text-[15px] text-gray-600 leading-relaxed"
                            >
                              {item.answer}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </SiteLayout>
  );
}
