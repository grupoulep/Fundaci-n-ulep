import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Mail,
  MapPin,
  Phone,
  ShieldCheck
} from 'lucide-react';
import SiteLayout from '../components/SiteLayout';
import { withBase } from '../security/paths';
import { isValidEmail, isValidPhone, sanitizeFormAction } from '../security/security';
import { getMediaData, getOrgData, getPqrsData } from '../security/vault';

export default function PqrsPage() {
  const org = getOrgData();
  const media = getMediaData();
  const pqrsVault = getPqrsData();
  const pqrsTypes = pqrsVault.types;
  const relatedAreas = pqrsVault.areas;
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

    if (!isValidEmail(email)) {
      e.preventDefault();
      setFormError('Por favor ingrese un correo electrónico válido.');
      return;
    }

    if (!isValidPhone(phone)) {
      e.preventDefault();
      setFormError('Por favor ingrese un número de teléfono válido.');
      return;
    }

    if (!acceptedPolicy) {
      e.preventDefault();
      setFormError(
        'Debe aceptar la Política de Privacidad y Tratamiento de Datos Personales para radicar su solicitud.'
      );
      return;
    }

    if (sanitizeFormAction(org.formAction) === '#') {
      e.preventDefault();
      setFormError('El canal de envío no se encuentra disponible temporalmente.');
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
            src={withBase(media.patternBg)}
            alt=""
            aria-hidden="true"
            className="pointer-events-none select-none hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 h-[125%] w-auto max-w-none object-contain -scale-x-100 opacity-[0.18] mix-blend-multiply"
          />
          <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 py-14 sm:py-18">
            <div className="max-w-3xl">
              <h1 className="text-3xl sm:text-5xl font-extrabold text-blue-950 tracking-tight leading-tight text-balance">
                Sistema de PQRS
              </h1>
              <p className="text-base sm:text-lg text-gray-600 mt-4 leading-relaxed max-w-2xl">
                Radica tus peticiones, quejas, reclamos, sugerencias o felicitaciones de forma
                formal a través de nuestros canales oficiales.
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
                  action={sanitizeFormAction(org.formAction)}
                  method="POST"
                  target="_blank"
                  rel="noopener noreferrer"
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
                        placeholder={org.phonePlaceholder}
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
                        href={withBase('/politica-privacidad.html')}
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
                        href={`mailto:${org.emailContact}`}
                        className="text-blue-700 hover:underline break-all"
                      >
                        {org.emailContact}
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
                        href={`mailto:${org.emailAdmin}`}
                        className="text-blue-700 hover:underline break-all"
                      >
                        {org.emailAdmin}
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
                        href={`mailto:${org.emailLegal}`}
                        className="text-blue-700 hover:underline break-all"
                      >
                        {org.emailLegal}
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Phone className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" />
                    <span className="tabular-nums">{org.phoneMain}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" />
                    <span>{org.addressShort}</span>
                  </li>
                </ul>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </SiteLayout>
  );
}
