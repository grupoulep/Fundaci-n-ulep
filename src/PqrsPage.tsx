import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  Mail,
  MapPin,
  Phone,
  ShieldCheck
} from 'lucide-react';
import SiteLayout from './components/SiteLayout';

const pqrsTypes = [
  'Petición',
  'Queja',
  'Reclamo',
  'Sugerencia',
  'Felicitación',
  'Protección de Datos Personales (Habeas Data)'
];

const relatedAreas = [
  'Programas, Cursos y Formación',
  'Voluntariado',
  'Empresas, Convenios y Alianzas',
  'Donaciones y Administración',
  'Privacidad, Datos y Asuntos Legales',
  'Atención General'
];

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

const faqCategories: FaqCategory[] = [
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
            <span className="font-semibold text-blue-950 tabular-nums">NIT 902.050.377-7</span>.
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
            <strong className="font-semibold text-blue-950">
              Carrera 54 # 3A - 19, Barrio Lomas de Granada, Popayán, Cauca, Colombia
            </strong>
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
              href="https://fundacionulep.fun"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 font-medium hover:underline underline-offset-2"
            >
              https://fundacionulep.fun
            </a>{' '}
            y en nuestros canales oficiales. Para participar, solo debes diligenciar el formulario
            de inscripción correspondiente en la sección de{' '}
            <a
              href="/estudiantes.html#cursos"
              className="text-blue-700 font-medium hover:underline underline-offset-2"
            >
              Cursos
            </a>{' '}
            o escribir a{' '}
            <a
              href="mailto:contacto@fundacionulep.fun"
              className="text-blue-700 font-medium hover:underline underline-offset-2"
            >
              contacto@fundacionulep.fun
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
              href="/empresa.html"
              className="text-blue-700 font-medium hover:underline underline-offset-2"
            >
              Panel de Empresas
            </a>{' '}
            o escribir a{' '}
            <a
              href="mailto:contacto@fundacionulep.fun"
              className="text-blue-700 font-medium hover:underline underline-offset-2"
            >
              contacto@fundacionulep.fun
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
              href="https://fundacionulep.fun"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 font-medium hover:underline underline-offset-2"
            >
              https://fundacionulep.fun
            </a>{' '}
            o en cuentas bancarias a nombre de{' '}
            <strong className="font-semibold text-blue-950">FUNDACIÓN ULEP</strong>. Los recursos
            recaudados se destinan al financiamiento y sostenibilidad de nuestros proyectos
            sociales, educativos, deportivos y tecnológicos. Para solicitar comprobantes o soporte
            administrativo de tu aporte, escribe a{' '}
            <a
              href="mailto:administracion@fundacionulep.fun"
              className="text-blue-700 font-medium hover:underline underline-offset-2"
            >
              administracion@fundacionulep.fun
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
              href="mailto:legal@fundacionulep.fun"
              className="text-blue-700 font-medium hover:underline underline-offset-2"
            >
              legal@fundacionulep.fun
            </a>{' '}
            o consultar nuestra{' '}
            <a
              href="/politica-privacidad.html"
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
                href="mailto:contacto@fundacionulep.fun"
                className="text-blue-700 font-medium hover:underline underline-offset-2"
              >
                contacto@fundacionulep.fun
              </a>
            </li>
            <li>
              <strong className="font-semibold text-blue-950">
                Donaciones, comprobantes y temas contables:
              </strong>{' '}
              <a
                href="mailto:administracion@fundacionulep.fun"
                className="text-blue-700 font-medium hover:underline underline-offset-2"
              >
                administracion@fundacionulep.fun
              </a>
            </li>
            <li>
              <strong className="font-semibold text-blue-950">
                Protección de datos personales (PQR) y asuntos legales:
              </strong>{' '}
              <a
                href="mailto:legal@fundacionulep.fun"
                className="text-blue-700 font-medium hover:underline underline-offset-2"
              >
                legal@fundacionulep.fun
              </a>
            </li>
            <li>
              <strong className="font-semibold text-blue-950">Teléfono de contacto:</strong>{' '}
              <span className="tabular-nums">(+57) 316 900 8561</span>
            </li>
            <li>
              <strong className="font-semibold text-blue-950">Dirección física:</strong> Carrera 54
              # 3A - 19, Barrio Lomas de Granada, Popayán, Cauca.
            </li>
          </ul>
        )
      }
    ]
  }
];

export default function PqrsPage() {
  // PQRS Form State
  const [pqrsType, setPqrsType] = useState(pqrsTypes[0]);
  const [area, setArea] = useState(relatedAreas[0]);
  const [fullName, setFullName] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [formError, setFormError] = useState('');
  const [submittedRecord, setSubmittedRecord] = useState<{
    radicado: string;
    pqrsType: string;
    fullName: string;
    email: string;
  } | null>(null);

  // Accordion FAQ State
  const [openFaqIds, setOpenFaqIds] = useState<string[]>([]);

  const toggleFaq = (id: string) => {
    setOpenFaqIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (
      !fullName.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !subject.trim() ||
      !message.trim()
    ) {
      e.preventDefault();
      setFormError('Por favor complete todos los campos obligatorios marcados con asterisco (*).');
      return;
    }

    if (!acceptedPolicy) {
      e.preventDefault();
      setFormError(
        'Debe aceptar la Política de Privacidad y Tratamiento de Datos Personales para radicar su solicitud.'
      );
      return;
    }

    setFormError('');
    const radicado = `PQRS-${new Date().getFullYear()}-${String(
      Math.floor(1000 + Math.random() * 9000)
    )}`;
    const savedName = fullName.trim();
    const savedEmail = email.trim();
    const savedType = pqrsType;

    window.setTimeout(() => {
      setSubmittedRecord({
        radicado,
        pqrsType: savedType,
        fullName: savedName,
        email: savedEmail
      });
    }, 300);
  };

  const handleResetForm = () => {
    setPqrsType(pqrsTypes[0]);
    setArea(relatedAreas[0]);
    setFullName('');
    setDocumentNumber('');
    setEmail('');
    setPhone('');
    setSubject('');
    setMessage('');
    setAcceptedPolicy(false);
    setFormError('');
    setSubmittedRecord(null);
  };

  return (
    <SiteLayout>
      <main className="w-full flex-1 bg-gray-50">
        {/* Institutional Hero Header */}
        <section className="relative overflow-hidden w-full bg-white border-b border-gray-200">
          <img
            src="/assets/aistudio/PROYECTO_8decce25.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none select-none hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 h-[125%] w-auto max-w-none object-contain -scale-x-100 opacity-[0.18] mix-blend-multiply"
          />
          <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 py-14 sm:py-18">
            <div className="max-w-3xl">
              <h1 className="text-3xl sm:text-5xl font-extrabold text-blue-950 tracking-tight leading-tight text-balance">
                Sistema de PQRS y Preguntas Frecuentes
              </h1>
              <p className="text-base sm:text-lg text-gray-600 mt-4 leading-relaxed max-w-2xl">
                Radica tus peticiones, quejas, reclamos, sugerencias o felicitaciones de forma
                formal, o consulta respuestas rápidas sobre nuestra Fundación, programas,
                voluntariado y canales oficiales.
              </p>
            </div>
          </div>
        </section>

        {/* Section 1: Radicar Solicitud PQRS Form */}
        <section
          id="radicar-solicitud"
          className="scroll-mt-24 max-w-6xl mx-auto px-6 sm:px-8 py-14 sm:py-18"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Main Form Column */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200 p-6 sm:p-9">
              {submittedRecord ? (
                <div className="py-8 space-y-5 text-center">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wider tabular-nums">
                      Referencia: {submittedRecord.radicado}
                    </p>
                    <h2 className="text-2xl font-bold text-blue-950 mt-1.5">
                      Solicitud PQRS radicada correctamente
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600 mt-2.5 leading-relaxed max-w-xl mx-auto">
                      Gracias,{' '}
                      <strong className="font-semibold text-gray-900">
                        {submittedRecord.fullName}
                      </strong>
                      . Hemos enviado tu{' '}
                      <strong className="font-semibold text-gray-900">
                        {submittedRecord.pqrsType}
                      </strong>{' '}
                      al equipo de atención de Fundación ULEP. Recibirás respuesta en el correo{' '}
                      <span className="font-medium text-blue-900">{submittedRecord.email}</span>{' '}
                      dentro de los términos legales vigentes.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleResetForm}
                      className="px-5 py-2.5 rounded-lg bg-blue-950 hover:bg-blue-800 text-white text-sm font-semibold transition-colors cursor-pointer"
                    >
                      Radicar otra solicitud
                    </button>
                  </div>
                </div>
              ) : (
                <form
                  action="https://formsubmit.co/fundacionulep@gmail.com"
                  method="POST"
                  target="_blank"
                  onSubmit={handleSubmit}
                  className="space-y-5"
                  noValidate
                >
                  <input
                    type="hidden"
                    name="_subject"
                    value={`Nueva PQRS (${pqrsType}): ${subject || 'Solicitud ciudadana'} - Fundación ULEP`}
                  />
                  <input type="hidden" name="_template" value="table" />
                  <input
                    type="text"
                    name="_honey"
                    className="hidden"
                    tabIndex={-1}
                    autoComplete="off"
                  />

                  <div className="pb-4 border-b border-gray-200 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-blue-950 tracking-tight">
                        Radicar Solicitud PQRS
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        Diligencia los datos a continuación. Los campos marcados con asterisco (*)
                        son obligatorios.
                      </p>
                    </div>
                  </div>

                  {formError && (
                    <div
                      role="alert"
                      className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800"
                    >
                      {formError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="pqrsType"
                        className="block text-xs font-semibold text-gray-700 mb-1.5"
                      >
                        Tipo de solicitud *
                      </label>
                      <select
                        id="pqrsType"
                        name="tipo_pqrs"
                        value={pqrsType}
                        onChange={(e) => setPqrsType(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-gray-300 text-sm text-gray-900 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                      >
                        {pqrsTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="relatedArea"
                        className="block text-xs font-semibold text-gray-700 mb-1.5"
                      >
                        Área relacionada *
                      </label>
                      <select
                        id="relatedArea"
                        name="area_relacionada"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-gray-300 text-sm text-gray-900 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                      >
                        {relatedAreas.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="pqrsFullName"
                        className="block text-xs font-semibold text-gray-700 mb-1.5"
                      >
                        Nombre completo *
                      </label>
                      <input
                        id="pqrsFullName"
                        name="nombre_completo"
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Nombres y apellidos"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-gray-300 text-sm text-gray-900 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="pqrsDocument"
                        className="block text-xs font-semibold text-gray-700 mb-1.5"
                      >
                        Número de documento (opcional)
                      </label>
                      <input
                        id="pqrsDocument"
                        name="documento"
                        type="text"
                        value={documentNumber}
                        onChange={(e) => setDocumentNumber(e.target.value)}
                        placeholder="CC / TI / CE / NIT"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-gray-300 text-sm text-gray-900 tabular-nums focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="pqrsEmail"
                        className="block text-xs font-semibold text-gray-700 mb-1.5"
                      >
                        Correo electrónico *
                      </label>
                      <input
                        id="pqrsEmail"
                        name="correo"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="correo@ejemplo.com"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-gray-300 text-sm text-gray-900 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="pqrsPhone"
                        className="block text-xs font-semibold text-gray-700 mb-1.5"
                      >
                        Teléfono / WhatsApp *
                      </label>
                      <input
                        id="pqrsPhone"
                        name="telefono"
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Ej. 316 900 8561"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-gray-300 text-sm text-gray-900 tabular-nums focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="pqrsSubject"
                      className="block text-xs font-semibold text-gray-700 mb-1.5"
                    >
                      Asunto de la solicitud *
                    </label>
                    <input
                      id="pqrsSubject"
                      name="asunto"
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Resumen breve de tu petición, queja, reclamo o sugerencia"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-gray-300 text-sm text-gray-900 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="pqrsMessage"
                      className="block text-xs font-semibold text-gray-700 mb-1.5"
                    >
                      Descripción detallada *
                    </label>
                    <textarea
                      id="pqrsMessage"
                      name="descripcion"
                      rows={5}
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe los hechos, fechas, programa o solicitud con el mayor detalle posible para brindarte una respuesta oportuna."
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-gray-300 text-sm text-gray-900 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100 resize-y"
                    />
                  </div>

                  <label className="flex items-start gap-2.5 text-xs text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      name="autorizacion_datos"
                      value="Sí, autorizo"
                      checked={acceptedPolicy}
                      onChange={(e) => setAcceptedPolicy(e.target.checked)}
                      className="mt-0.5 rounded border-gray-300 text-blue-800 focus:ring-blue-600"
                    />
                    <span>
                      Autorizo el tratamiento de mis datos personales conforme a la Ley 1581 de
                      2012 y la{' '}
                      <a
                        href="/politica-privacidad.html"
                        className="text-blue-800 hover:underline underline-offset-2 font-medium"
                      >
                        Política de Privacidad y Tratamiento de Datos Personales
                      </a>{' '}
                      de FUNDACIÓN ULEP.
                    </span>
                  </label>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-950 hover:bg-blue-800 text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Radicar solicitud
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Institutional Guidance Sidebar */}
            <aside className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-5 h-5 text-blue-700 shrink-0" />
                  <h3 className="text-base font-bold text-blue-950">Tiempos de respuesta</h3>
                </div>
                <ul className="space-y-2.5 text-sm text-gray-700 pt-1">
                  <li className="flex justify-between gap-3 border-b border-gray-100 pb-2">
                    <span>Peticiones generales y sugerencias</span>
                    <span className="font-bold text-blue-950 tabular-nums shrink-0">
                      15 días
                    </span>
                  </li>
                  <li className="flex justify-between gap-3 border-b border-gray-100 pb-2">
                    <span>Solicitud de documentos o información</span>
                    <span className="font-bold text-blue-950 tabular-nums shrink-0">
                      10 días
                    </span>
                  </li>
                  <li className="flex justify-between gap-3">
                    <span>Consultas y reclamos Habeas Data</span>
                    <span className="font-bold text-blue-950 tabular-nums shrink-0">
                      10–15 días
                    </span>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0" />
                  <h3 className="text-base font-bold text-blue-950">Canales oficiales</h3>
                </div>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-start gap-2.5">
                    <Mail className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-blue-950">
                        General y voluntariado
                      </p>
                      <a
                        href="mailto:contacto@fundacionulep.fun"
                        className="text-blue-700 hover:underline break-all"
                      >
                        contacto@fundacionulep.fun
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Mail className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-blue-950">
                        Donaciones y contabilidad
                      </p>
                      <a
                        href="mailto:administracion@fundacionulep.fun"
                        className="text-blue-700 hover:underline break-all"
                      >
                        administracion@fundacionulep.fun
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Mail className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-blue-950">
                        Datos personales (PQR) y legal
                      </p>
                      <a
                        href="mailto:legal@fundacionulep.fun"
                        className="text-blue-700 hover:underline break-all"
                      >
                        legal@fundacionulep.fun
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Phone className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" />
                    <span className="tabular-nums">(+57) 316 900 8561</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" />
                    <span>Carrera 54 # 3A - 19, Barrio Lomas de Granada, Popayán, Cauca</span>
                  </li>
                </ul>
              </div>
            </aside>
          </div>
        </section>

        {/* Section 2: Collapsible Frequently Asked Questions */}
        <section
          id="preguntas-frecuentes"
          className="scroll-mt-24 relative overflow-hidden w-full bg-white border-t border-gray-200 py-16 sm:py-20"
        >
          <img
            src="/assets/aistudio/PROYECTO_8decce25.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none select-none hidden md:block absolute left-0 top-12 h-[540px] w-auto max-w-none object-contain opacity-[0.14] mix-blend-multiply"
          />
          <img
            src="/assets/aistudio/PROYECTO_8decce25.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none select-none hidden md:block absolute right-0 bottom-12 h-[540px] w-auto max-w-none object-contain -scale-x-100 opacity-[0.14] mix-blend-multiply"
          />

          <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8">
            <div className="mb-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-blue-950 tracking-tight text-balance">
                Preguntas Frecuentes
              </h2>
            </div>

            <div className="space-y-10">
              {faqCategories.map((category) => (
                <div key={category.title}>
                  <h3 className="text-lg sm:text-xl font-extrabold text-blue-950 tracking-tight pb-3 border-b-2 border-blue-950 mb-4">
                    {category.title}
                  </h3>

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
