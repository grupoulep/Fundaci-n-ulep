import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { withBase } from '../security/paths';
import { isValidEmail, isValidPhone } from '../security/security';
import { createPqrsSubmissionInFirestore } from '../security/firestoreForms';
import { getOrgData, getPqrsData } from '../security/vault';

export default function PqrsInlinePanel() {
  const org = getOrgData();
  const pqrsVault = getPqrsData();
  const pqrsTypes = pqrsVault.types;
  const relatedAreas = pqrsVault.areas;

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
  const [submitting, setSubmitting] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState<{
    radicado: string;
    pqrsType: string;
    fullName: string;
    email: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    if (
      !fullName.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !subject.trim() ||
      !message.trim()
    ) {
      setFormError(
        'Por favor complete todos los campos obligatorios marcados con asterisco (*).'
      );
      return;
    }

    if (!isValidEmail(email)) {
      setFormError('Por favor ingrese un correo electrónico válido.');
      return;
    }

    if (!isValidPhone(phone)) {
      setFormError('Por favor ingrese un número de teléfono válido.');
      return;
    }

    if (!acceptedPolicy) {
      setFormError(
        'Debe aceptar la Política de Privacidad y Tratamiento de Datos Personales para radicar su solicitud.'
      );
      return;
    }

    setFormError('');
    setSubmitting(true);
    try {
      const savedName = fullName.trim();
      const savedEmail = email.trim();
      const savedType = pqrsType;
      const result = await createPqrsSubmissionInFirestore({
        pqrsType: savedType,
        area,
        fullName: savedName,
        documentNumber: documentNumber.trim(),
        email: savedEmail,
        phone: phone.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });
      setSubmittedRecord({
        radicado: result.radicado,
        pqrsType: savedType,
        fullName: savedName,
        email: savedEmail,
      });
    } catch {
      setFormError(
        'No fue posible radicar tu solicitud en este momento. Intenta nuevamente en unos segundos.'
      );
    } finally {
      setSubmitting(false);
    }
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-8">
        {submittedRecord ? (
          <div className="py-8 space-y-5 text-center">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wider tabular-nums">
                Referencia: {submittedRecord.radicado}
              </p>
              <h3 className="text-2xl font-bold text-blue-950 mt-1.5">
                Solicitud PQRS radicada correctamente
              </h3>
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
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            <div className="pb-4 border-b border-gray-200 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center shrink-0 mt-0.5">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-blue-950 tracking-tight">
                  Radicar Solicitud PQRS
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Diligencia los datos a continuación. Los campos marcados con asterisco (*) son
                  obligatorios.
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
                  htmlFor="inlinePqrsType"
                  className="block text-xs font-semibold text-gray-700 mb-1.5"
                >
                  Tipo de solicitud *
                </label>
                <select
                  id="inlinePqrsType"
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
                  htmlFor="inlineRelatedArea"
                  className="block text-xs font-semibold text-gray-700 mb-1.5"
                >
                  Área relacionada *
                </label>
                <select
                  id="inlineRelatedArea"
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
                  htmlFor="inlinePqrsFullName"
                  className="block text-xs font-semibold text-gray-700 mb-1.5"
                >
                  Nombre completo *
                </label>
                <input
                  id="inlinePqrsFullName"
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
                  htmlFor="inlinePqrsDocument"
                  className="block text-xs font-semibold text-gray-700 mb-1.5"
                >
                  Número de documento (opcional)
                </label>
                <input
                  id="inlinePqrsDocument"
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
                  htmlFor="inlinePqrsEmail"
                  className="block text-xs font-semibold text-gray-700 mb-1.5"
                >
                  Correo electrónico *
                </label>
                <input
                  id="inlinePqrsEmail"
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
                  htmlFor="inlinePqrsPhone"
                  className="block text-xs font-semibold text-gray-700 mb-1.5"
                >
                  Teléfono / WhatsApp *
                </label>
                <input
                  id="inlinePqrsPhone"
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
                htmlFor="inlinePqrsSubject"
                className="block text-xs font-semibold text-gray-700 mb-1.5"
              >
                Asunto de la solicitud *
              </label>
              <input
                id="inlinePqrsSubject"
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
                htmlFor="inlinePqrsMessage"
                className="block text-xs font-semibold text-gray-700 mb-1.5"
              >
                Descripción detallada *
              </label>
              <textarea
                id="inlinePqrsMessage"
                name="descripcion"
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe los hechos, fechas, programa o solicitud con el mayor detalle posible."
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
                Autorizo el tratamiento de mis datos personales conforme a la Ley 1581 de 2012 y la{' '}
                <a
                  href={withBase('/politica-privacidad.html')}
                  className="text-blue-800 hover:underline underline-offset-2 font-medium"
                >
                  Política de Privacidad y Tratamiento de Datos Personales
                </a>{' '}
                de FUNDACIÓN ULEP.
              </span>
            </label>

            <div className="pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-blue-950 hover:bg-blue-800 disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                {submitting ? 'Radicando solicitud...' : 'Radicar solicitud'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>

      <aside className="lg:col-span-4 space-y-4">
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-700 shrink-0" />
            <h3 className="text-sm font-bold text-blue-950">Tiempos de respuesta</h3>
          </div>
          <ul className="space-y-2 text-xs text-gray-700">
            <li className="flex justify-between gap-2 border-b border-gray-200 pb-1.5">
              <span>Peticiones generales y sugerencias</span>
              <span className="font-bold text-blue-950 tabular-nums shrink-0">15 días</span>
            </li>
            <li className="flex justify-between gap-2 border-b border-gray-200 pb-1.5">
              <span>Documentos o información</span>
              <span className="font-bold text-blue-950 tabular-nums shrink-0">10 días</span>
            </li>
            <li className="flex justify-between gap-2">
              <span>Consultas y reclamos Habeas Data</span>
              <span className="font-bold text-blue-950 tabular-nums shrink-0">10–15 días</span>
            </li>
          </ul>
        </div>

        <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
            <h3 className="text-sm font-bold text-blue-950">Canales oficiales</h3>
          </div>
          <ul className="space-y-2.5 text-xs text-gray-600">
            <li className="flex items-start gap-2">
              <Mail className="w-3.5 h-3.5 text-blue-700 mt-0.5 shrink-0" />
              <a href={`mailto:${org.emailContact}`} className="text-blue-700 hover:underline break-all">
                {org.emailContact}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <Mail className="w-3.5 h-3.5 text-blue-700 mt-0.5 shrink-0" />
              <a href={`mailto:${org.emailLegal}`} className="text-blue-700 hover:underline break-all">
                {org.emailLegal}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <Phone className="w-3.5 h-3.5 text-blue-700 mt-0.5 shrink-0" />
              <span className="tabular-nums">{org.phoneMain}</span>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-blue-700 mt-0.5 shrink-0" />
              <span>{org.addressShort}</span>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
