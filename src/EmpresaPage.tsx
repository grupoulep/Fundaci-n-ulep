import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Users,
  Briefcase,
  Award,
  Handshake,
  Headphones,
  ShieldCheck
} from 'lucide-react';
import SiteLayout from './components/SiteLayout';

const requestTypes = [
  'Convenio Marco de Cooperación',
  'Convenio de Prácticas Profesionales',
  'Convenio de Formación Corporativa',
  'Participación en Proyecto Smart Cole 1.0',
  'Programa de Voluntariado y Trabajo Social',
  'Patrocinio de Becas y RSE',
  'Alianza Estratégica Interinstitucional',
  'Publicación de Vacante (Bolsa de Empleo)'
];

const agreementBenefits = [
  {
    title: 'Tarifas preferenciales en formación',
    description:
      'Acceso a descuentos y cupos corporativos en nuestros 32 cursos estudiantiles y 12 cursos administrativos para colaboradores y sus familias.',
    icon: GraduationCap
  },
  {
    title: 'Practicantes y bolsa de empleo sin costo',
    description:
      'Publique vacantes sin costo y vincule estudiantes en etapa práctica con acompañamiento docente y evaluación por competencias.',
    icon: Briefcase
  },
  {
    title: 'Capacitación diseñada a su medida',
    description:
      'Estructuramos talleres y programas cerrados según las necesidades operativas, metas y horarios de su equipo de trabajo.',
    icon: Users
  },
  {
    title: 'Certificación y soporte para Gestión Humana',
    description:
      'Emitimos certificados verificables de formación, constancias de convenio y reportes de asistencia para sus procesos internos.',
    icon: Award
  },
  {
    title: 'Posicionamiento en Responsabilidad Social',
    description:
      'Fortalezca la reputación de su marca como organización aliada de la educación y el desarrollo sostenible en el Cauca y Colombia.',
    icon: Handshake
  },
  {
    title: 'Acompañamiento institucional permanente',
    description:
      'Contará con un enlace directo de Fundación ULEP encargado de coordinar matrículas, actividades conjuntas y seguimiento continuo.',
    icon: Headphones
  }
];

const activeProjects = [
  {
    index: '01',
    title: 'Proyecto Smart Cole 1.0',
    scope: 'Innovación educativa · Tecnología',
    description:
      'Iniciativa orientada a fortalecer competencias digitales y tecnológicas en entornos educativos. Su empresa puede vincularse como aliada patrocinadora, proveedora de mentoría o cofinanciadora.',
    formType: 'Participación en Proyecto Smart Cole 1.0'
  },
  {
    index: '02',
    title: 'Voluntariado Corporativo y Trabajo Social',
    scope: 'Impacto comunitario · Certificación',
    description:
      'Integre a sus colaboradores en jornadas solidarias y procesos formativos comunitarios con certificación oficial de experiencia en trabajo social emitida por la Fundación.',
    formType: 'Programa de Voluntariado y Trabajo Social'
  },
  {
    index: '03',
    title: 'Becas de Formación para el Trabajo',
    scope: 'Responsabilidad Social Empresarial · Becas',
    description:
      'Apoye la formación técnica y laboral de jóvenes y adultos en condición de vulnerabilidad, generando oportunidades reales de empleabilidad con trazabilidad completa.',
    formType: 'Patrocinio de Becas y RSE'
  },
  {
    index: '04',
    title: 'Alianzas de Empleabilidad y Prácticas',
    scope: 'Sector productivo · Talento regional',
    description:
      'Participe en nuestras rutas de inserción laboral conectando directamente los perfiles certificados de Fundación ULEP con las necesidades de su empresa.',
    formType: 'Convenio de Prácticas Profesionales'
  }
];

const institutionalGuarantees = [
  {
    number: '01',
    title: 'Respaldo legal y tributario',
    description:
      'Entidad Sin Ánimo de Lucro legalmente constituida con NIT 902.050.377-7, sujeta a inspección y vigilancia, con documentación vigente ante DIAN y Cámara de Comercio.'
  },
  {
    number: '02',
    title: 'Convenio claro y formalizado',
    description:
      'Cada alianza se respalda mediante acuerdo escrito donde se definen alcances, compromisos, cronogramas y confidencialidad sin costos ocultos.'
  },
  {
    number: '03',
    title: 'Seguimiento e informes verificables',
    description:
      'Entregamos evidencias, reportes de avance, certificados y resultados medibles de cada programa de formación o proyecto social ejecutado.'
  },
  {
    number: '04',
    title: 'Protección de datos garantizada',
    description:
      'Tratamiento responsable y seguro de la información corporativa y de participantes en cumplimiento de la Ley 1581 de 2012.'
  }
];

function getInitialRequestType(): string {
  if (typeof window === 'undefined') return requestTypes[0];
  const param = new URLSearchParams(window.location.search).get('tipo');
  if (param && requestTypes.includes(param)) {
    return param;
  }
  return requestTypes[0];
}

export default function EmpresaPage() {
  const [companyName, setCompanyName] = useState('');
  const [nit, setNit] = useState('');
  const [contactName, setContactName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [requestType, setRequestType] = useState<string>(getInitialRequestType);
  const [details, setDetails] = useState('');
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [formError, setFormError] = useState('');
  const [submittedRecord, setSubmittedRecord] = useState<{
    companyName: string;
    requestType: string;
    email: string;
  } | null>(null);

  const handleSelectAndScroll = (type: string) => {
    setRequestType(type);
    setSubmittedRecord(null);
    setFormError('');
    document
      .getElementById('formulario-empresa')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!companyName.trim() || !contactName.trim() || !email.trim() || !phone.trim()) {
      e.preventDefault();
      setFormError('Por favor complete los campos obligatorios marcados con asterisco (*).');
      return;
    }
    if (!acceptedPolicy) {
      e.preventDefault();
      setFormError(
        'Debe aceptar la Política de Privacidad y Tratamiento de Datos Personales para continuar.'
      );
      return;
    }

    setFormError('');
    // Allow native FormSubmit POST to fundacionulep@gmail.com and display confirmation
    const savedCompany = companyName.trim();
    const savedType = requestType;
    const savedEmail = email.trim();
    window.setTimeout(() => {
      setSubmittedRecord({
        companyName: savedCompany,
        requestType: savedType,
        email: savedEmail
      });
    }, 300);
  };

  const handleResetForm = () => {
    setCompanyName('');
    setNit('');
    setContactName('');
    setRole('');
    setEmail('');
    setPhone('');
    setDetails('');
    setAcceptedPolicy(false);
    setFormError('');
    setSubmittedRecord(null);
  };

  return (
    <SiteLayout>
      <main className="w-full flex-1 bg-gray-50">
        {/* Welcome Hero for Companies */}
        <section className="relative overflow-hidden w-full bg-white border-b border-gray-200">
          <img
            src="/assets/aistudio/PROYECTO_8decce25.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none select-none hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 h-[118%] w-auto max-w-none object-contain -scale-x-100 opacity-[0.20] mix-blend-multiply"
          />
          <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 py-14 sm:py-20">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold text-blue-700 tracking-wide mb-3">
                Fundación ULEP · Portal Empresarial
              </p>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-blue-950 tracking-tight leading-tight text-balance">
                Bienvenidos al convenio que impulsa a su empresa y transforma vidas
              </h1>
              <p className="text-base sm:text-lg text-gray-600 mt-5 leading-relaxed max-w-2xl">
                Únase a la red de empresas aliadas de Fundación ULEP. Acceda a beneficios exclusivos en formación, incorpore talento calificado y participe activamente en nuestros proyectos educativos y sociales con respaldo institucional garantizado.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => handleSelectAndScroll('Convenio Marco de Cooperación')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-950 hover:bg-blue-800 text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  Unirme al convenio ahora
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href="#beneficios"
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .getElementById('beneficios')
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-3 text-sm font-semibold text-blue-900 hover:text-blue-700 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
                >
                  Conocer beneficios y garantías
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Section 1: Benefits of the Agreement */}
        <section id="beneficios" className="scroll-mt-24 max-w-6xl mx-auto px-6 sm:px-8 py-16">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-semibold text-blue-700 tracking-wide mb-2">
              01 · Ventajas para su organización
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-blue-950 tracking-tight text-balance">
              Beneficios de ser parte del convenio
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mt-3 leading-relaxed">
              Al formalizar una alianza con Fundación ULEP, su empresa recibe herramientas concretas para fortalecer su talento humano y potenciar su impacto social.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agreementBenefits.map(({ title, description, icon: Icon }) => (
              <div
                key={title}
                className="bg-white rounded-xl border border-gray-200 p-7 flex flex-col justify-between transition-colors hover:border-blue-300"
              >
                <div>
                  <div className="w-11 h-11 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center mb-5">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-blue-950 mb-2.5 leading-snug">
                    {title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Join Our Projects */}
        <section
          id="proyectos"
          className="scroll-mt-24 relative overflow-hidden w-full bg-white border-y border-gray-200 py-16"
        >
          <img
            src="/assets/aistudio/PROYECTO_8decce25.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none select-none hidden md:block absolute left-0 top-1/2 -translate-y-1/2 h-[95%] w-auto max-w-none object-contain opacity-[0.15] mix-blend-multiply"
          />
          <img
            src="/assets/aistudio/PROYECTO_8decce25.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none select-none hidden lg:block absolute right-0 bottom-0 h-[75%] w-auto max-w-none object-contain -scale-x-100 opacity-[0.12] mix-blend-multiply"
          />
          <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8">
            <div className="max-w-2xl mb-10">
              <p className="text-xs font-semibold text-blue-700 tracking-wide mb-2">
                02 · Impacto compartido
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-blue-950 tracking-tight text-balance">
                Únase a nuestros proyectos vigentes
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mt-3 leading-relaxed">
                Su organización puede sumarse directamente a nuestras iniciativas activas en educación, tecnología, voluntariado y empleabilidad regional.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeProjects.map((project) => (
                <div
                  key={project.index}
                  className="bg-gray-50 rounded-xl border border-gray-200 p-7 flex flex-col justify-between transition-colors hover:border-blue-300"
                >
                  <div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                      <span className="font-bold text-blue-700 tabular-nums">
                        Proyecto {project.index}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{project.scope}</span>
                    </div>
                    <h3 className="text-xl font-bold text-blue-950 leading-snug mb-2.5">
                      {project.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{project.description}</p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => handleSelectAndScroll(project.formType)}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-900 hover:text-blue-600 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Unir mi empresa a este proyecto
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 3: Institutional Guarantees */}
        <section id="garantias" className="scroll-mt-24 max-w-6xl mx-auto px-6 sm:px-8 py-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold text-blue-700 tracking-wide mb-2">
                03 · Confianza y transparencia
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-blue-950 tracking-tight text-balance">
                Garantías que respaldan su alianza
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mt-3 leading-relaxed">
                Trabajamos bajo criterios estrictos de formalidad legal, rendición de cuentas y cumplimiento normativo para total tranquilidad de su organización.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-blue-950 shrink-0">
              <ShieldCheck className="w-5 h-5 text-blue-700" />
              <span className="tabular-nums">NIT 902.050.377-7 · Popayán, Cauca</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {institutionalGuarantees.map((item) => (
              <div key={item.number} className="pt-5 border-t-2 border-blue-900">
                <p className="text-xs font-bold text-blue-700 tabular-nums mb-2">
                  Garantía {item.number}
                </p>
                <h3 className="text-base font-bold text-blue-950 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Persuasive Invitation + FormSubmit Corporate Form */}
        <section
          id="formulario-empresa"
          className="scroll-mt-24 w-full bg-white border-t border-gray-200 py-16 sm:py-20"
        >
          <div className="max-w-4xl mx-auto px-6 sm:px-8">
            {/* Persuasive Callout Banner */}
            <div className="relative overflow-hidden bg-blue-950 text-white rounded-2xl p-8 sm:p-10 mb-10 text-center">
              <img
                src="/assets/aistudio/PROYECTO_8decce25.png"
                alt=""
                aria-hidden="true"
                className="pointer-events-none select-none absolute left-0 top-1/2 -translate-y-1/2 h-[140%] w-auto max-w-none object-contain grayscale invert mix-blend-screen opacity-[0.22]"
              />
              <img
                src="/assets/aistudio/PROYECTO_8decce25.png"
                alt=""
                aria-hidden="true"
                className="pointer-events-none select-none hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 h-[140%] w-auto max-w-none object-contain -scale-x-100 grayscale invert mix-blend-screen opacity-[0.22]"
              />
              <div className="relative z-10">
                <p className="text-xs font-semibold text-sky-300 tracking-wide mb-2">
                  Dé el siguiente paso hoy
                </p>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-balance">
                  Convierta a su empresa en aliada de Fundación ULEP
                </h2>
                <p className="text-sm sm:text-base text-blue-100/90 mt-3 max-w-2xl mx-auto leading-relaxed">
                  Vincularse al convenio es ágil y sin costo de inscripción. Diligencie el siguiente formulario y nuestro equipo se comunicará con usted para estructurar una alianza a la medida de su organización.
                </p>
              </div>
            </div>

            {/* Corporate Form Connected to FormSubmit */}
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-7 sm:p-10">
              {submittedRecord ? (
                <div className="py-6 space-y-5 text-center">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-blue-950">
                      Solicitud enviada correctamente
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 mt-2 leading-relaxed max-w-xl mx-auto">
                      Gracias,{' '}
                      <strong className="font-semibold text-gray-900">
                        {submittedRecord.companyName}
                      </strong>
                      . Hemos enviado su solicitud para{' '}
                      <strong className="font-semibold text-gray-900">
                        {submittedRecord.requestType}
                      </strong>
                      . Nuestro equipo institucional se pondrá en contacto al correo{' '}
                      <span className="font-medium text-blue-900">{submittedRecord.email}</span>{' '}
                      dentro de los próximos 2 días hábiles.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleResetForm}
                      className="px-5 py-2.5 rounded-lg bg-blue-950 hover:bg-blue-800 text-white text-sm font-semibold transition-colors cursor-pointer"
                    >
                      Enviar otra solicitud
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
                    value={`Nueva solicitud empresarial (${requestType}) - Fundación ULEP`}
                  />
                  <input type="hidden" name="_template" value="table" />
                  <input
                    type="text"
                    name="_honey"
                    className="hidden"
                    tabIndex={-1}
                    autoComplete="off"
                  />

                  <div className="pb-4 border-b border-gray-200">
                    <h3 className="text-xl sm:text-2xl font-bold text-blue-950 tracking-tight">
                      Formulario de Vinculación Empresarial
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      Los campos marcados con asterisco (*) son obligatorios.
                    </p>
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
                        htmlFor="companyName"
                        className="block text-xs font-semibold text-gray-700 mb-1.5"
                      >
                        Razón social / Empresa *
                      </label>
                      <input
                        id="companyName"
                        name="empresa"
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Ej. Industrias del Cauca S.A.S."
                        className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-gray-300 text-sm text-gray-900 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="nit"
                        className="block text-xs font-semibold text-gray-700 mb-1.5"
                      >
                        NIT (opcional)
                      </label>
                      <input
                        id="nit"
                        name="nit"
                        type="text"
                        value={nit}
                        onChange={(e) => setNit(e.target.value)}
                        placeholder="Ej. 900.123.456-7"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-gray-300 text-sm text-gray-900 tabular-nums focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="contactName"
                        className="block text-xs font-semibold text-gray-700 mb-1.5"
                      >
                        Nombre de contacto *
                      </label>
                      <input
                        id="contactName"
                        name="contacto"
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Nombre completo"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-gray-300 text-sm text-gray-900 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="role"
                        className="block text-xs font-semibold text-gray-700 mb-1.5"
                      >
                        Cargo o área
                      </label>
                      <input
                        id="role"
                        name="cargo"
                        type="text"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="Ej. Gestión Humana / Gerencia"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-gray-300 text-sm text-gray-900 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-xs font-semibold text-gray-700 mb-1.5"
                      >
                        Correo electrónico corporativo *
                      </label>
                      <input
                        id="email"
                        name="correo"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="correo@empresa.com"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-gray-300 text-sm text-gray-900 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-xs font-semibold text-gray-700 mb-1.5"
                      >
                        Teléfono / WhatsApp *
                      </label>
                      <input
                        id="phone"
                        name="telefono"
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Ej. 300 000 0000"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-gray-300 text-sm text-gray-900 tabular-nums focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="requestType"
                      className="block text-xs font-semibold text-gray-700 mb-1.5"
                    >
                      Tipo de alianza, convenio o proyecto *
                    </label>
                    <select
                      id="requestType"
                      name="tipo_solicitud"
                      value={requestType}
                      onChange={(e) => setRequestType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-gray-300 text-sm text-gray-900 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                    >
                      {requestTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="details"
                      className="block text-xs font-semibold text-gray-700 mb-1.5"
                    >
                      Descripción de la propuesta o necesidad
                    </label>
                    <textarea
                      id="details"
                      name="mensaje"
                      rows={4}
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      placeholder="Cuéntenos brevemente sobre su empresa, el convenio de interés o el proyecto al que desea unirse."
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
                      Autorizo el tratamiento de los datos suministrados conforme a la{' '}
                      <a
                        href="/politica-privacidad.html"
                        className="text-blue-800 hover:underline underline-offset-2 font-medium"
                      >
                        Política de Privacidad y Tratamiento de Datos Personales
                      </a>{' '}
                      de Fundación ULEP.
                    </span>
                  </label>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-950 hover:bg-blue-800 text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Enviar solicitud empresarial
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>
    </SiteLayout>
  );
}
