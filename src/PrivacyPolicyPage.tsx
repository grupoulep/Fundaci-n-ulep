import React from 'react';
import SiteLayout from './components/SiteLayout';
import { getOrgData } from './utils/vault';

export default function PrivacyPolicyPage() {
  const org = getOrgData();
  return (
    <SiteLayout>
      <main className="w-full flex-1 bg-white">
        <article className="max-w-4xl mx-auto px-6 sm:px-10 py-14 sm:py-20 text-gray-800">
          {/* Document Header */}
          <header className="pb-8 border-b border-gray-200 mb-10">
            <p className="text-sm font-semibold text-blue-700 tracking-wide mb-3">
              FUNDACIÓN ULEP
            </p>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-blue-950 tracking-tight leading-tight text-balance">
              POLÍTICA DE PRIVACIDAD Y TRATAMIENTO DE DATOS PERSONALES
            </h1>
            <p className="text-sm text-gray-500 mt-4">
              Fecha de última actualización: 19 de noviembre de 2026
            </p>
          </header>

          {/* Document Body */}
          <div className="space-y-10 text-[15px] sm:text-base leading-relaxed text-gray-700">
            {/* Section 1 */}
            <section className="space-y-4">
              <h2 className="text-lg sm:text-xl font-bold text-blue-950">
                1. IDENTIFICACIÓN DEL RESPONSABLE DEL TRATAMIENTO
              </h2>
              <ul className="space-y-2 list-disc pl-6 marker:text-blue-600">
                <li>
                  <strong className="font-semibold text-gray-900">Razón Social:</strong> FUNDACIÓN ULEP
                </li>
                <li>
                  <strong className="font-semibold text-gray-900">NIT:</strong>{' '}
                  <span className="tabular-nums">{org.nit}</span>
                </li>
                <li>
                  <strong className="font-semibold text-gray-900">Domicilio Principal:</strong>{' '}
                  {org.addressFull}
                </li>
                <li>
                  <strong className="font-semibold text-gray-900">Representante Legal:</strong>{' '}
                  {org.legalRep}
                </li>
                <li>
                  <strong className="font-semibold text-gray-900">Teléfonos:</strong>{' '}
                  <span className="tabular-nums">{org.phonesDash}</span>
                </li>
                <li>
                  <strong className="font-semibold text-gray-900">Sitio Web:</strong>{' '}
                  <a
                    href={org.websiteUrl}
                    className="text-blue-700 hover:text-blue-900 underline underline-offset-2"
                  >
                    {org.websiteUrl}
                  </a>
                </li>
                <li>
                  <strong className="font-semibold text-gray-900">
                    Correo Electrónico para Protección de Datos (PQR):
                  </strong>{' '}
                  <a
                    href={`mailto:${org.emailLegal}`}
                    className="text-blue-700 hover:text-blue-900 underline underline-offset-2"
                  >
                    {org.emailLegal}
                  </a>
                </li>
              </ul>
            </section>

            {/* Section 2 */}
            <section className="space-y-4 pt-6 border-t border-gray-100">
              <h2 className="text-lg sm:text-xl font-bold text-blue-950">
                2. MARCO LEGAL Y OBJETO
              </h2>
              <p>
                En cumplimiento de lo dispuesto en el artículo 15 de la Constitución Política de Colombia, la Ley Estatutaria 1581 de 2012, el Decreto 1377 de 2013 (compilado en el Decreto Único Reglamentario 1074 de 2015) y demás normas concordantes, FUNDACIÓN ULEP adopta la presente Política de Privacidad y Tratamiento de Datos Personales para garantizar el derecho constitucional que tienen todas las personas a conocer, actualizar, rectificar y suprimir la información personal recolectada a través de su sitio web, formularios digitales, aulas virtuales y canales institucionales.
              </p>
            </section>

            {/* Section 3 */}
            <section className="space-y-4 pt-6 border-t border-gray-100">
              <h2 className="text-lg sm:text-xl font-bold text-blue-950">
                3. FINALIDADES DEL TRATAMIENTO
              </h2>
              <p>
                Los datos personales recolectados de beneficiarios, estudiantes, voluntarios, donantes, aliados, proveedores y visitantes del sitio web serán tratados exclusivamente para las siguientes finalidades:
              </p>
              <ul className="space-y-2.5 list-disc pl-6 marker:text-blue-600">
                <li>
                  Gestionar solicitudes de información, contacto, peticiones, quejas o reclamos enviados a través de los formularios del sitio web.
                </li>
                <li>
                  Administrar procesos de inscripción, matrícula, seguimiento académico y certificación en programas de formación para el trabajo, cursos virtuales, talleres y actividades educativas o empresariales.
                </li>
                <li>
                  Gestionar la vinculación, coordinación y seguimiento de voluntarios, contratistas, aliados estratégicos y convenios interinstitucionales.
                </li>
                <li>
                  Recibir, registrar y administrar donaciones, aportes o pagos, así como expedir los recibos, facturas electrónicas o certificados correspondientes.
                </li>
                <li>
                  Cumplir con obligaciones legales, contables, tributarias y de inspección, vigilancia y control ante entidades como la DIAN, la Cámara de Comercio y la Gobernación del Cauca.
                </li>
                <li>
                  Enviar comunicaciones institucionales sobre convocatorias, programas académicos, proyectos sociales, eventos o actualizaciones de la Fundación, siempre que el titular haya otorgado su autorización.
                </li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="space-y-4 pt-6 border-t border-gray-100">
              <h2 className="text-lg sm:text-xl font-bold text-blue-950">
                4. DATOS SENSIBLES Y DE MENORES DE EDAD
              </h2>
              <p>
                La Fundación no exige el suministro de datos sensibles (salud, orientación política, convicciones religiosas, datos biométricos, entre otros) salvo cuando sea estrictamente necesario para la ejecución de un programa social o educativo específico; en tales casos, se informará previamente al titular que su entrega es completamente facultativa. El tratamiento de datos personales de niños, niñas y adolescentes solo se realizará respetando su interés superior y mediante autorización previa de sus padres o representantes legales.
              </p>
            </section>

            {/* Section 5 */}
            <section className="space-y-4 pt-6 border-t border-gray-100">
              <h2 className="text-lg sm:text-xl font-bold text-blue-950">
                5. DERECHOS DE LOS TITULARES
              </h2>
              <p>
                De conformidad con el artículo 8 de la Ley 1581 de 2012, el titular de los datos personales tiene derecho a:
              </p>
              <ul className="space-y-2.5 list-disc pl-6 marker:text-blue-600">
                <li>
                  Conocer, actualizar y rectificar sus datos personales frente a la Fundación.
                </li>
                <li>
                  Solicitar prueba de la autorización otorgada para el tratamiento de sus datos.
                </li>
                <li>
                  Ser informado, previa solicitud, respecto del uso que se le ha dado a sus datos personales.
                </li>
                <li>
                  Presentar ante la Superintendencia de Industria y Comercio (SIC) quejas por infracciones a la normatividad de protección de datos.
                </li>
                <li>
                  Revocar la autorización y/o solicitar la supresión del dato cuando no se respeten los principios, derechos y garantías constitucionales y legales, o cuando no exista un deber legal o contractual que impida su eliminación.
                </li>
                <li>
                  Acceder en forma gratuita a sus datos personales que hayan sido objeto de tratamiento.
                </li>
              </ul>
            </section>

            {/* Section 6 */}
            <section className="space-y-4 pt-6 border-t border-gray-100">
              <h2 className="text-lg sm:text-xl font-bold text-blue-950">
                6. ÁREA RESPONSABLE Y PROCEDIMIENTO PARA CONSULTAS Y RECLAMOS (PQR)
              </h2>
              <p>
                El área responsable de atender las peticiones, consultas y reclamos sobre datos personales puede ser contactada a través del correo electrónico{' '}
                <a
                  href={`mailto:${org.emailLegal}`}
                  className="text-blue-700 hover:text-blue-900 underline underline-offset-2"
                >
                  {org.emailLegal}
                </a>{' '}
                o mediante comunicación escrita dirigida a la {org.addressShort}.
              </p>
              <ul className="space-y-3 list-disc pl-6 marker:text-blue-600">
                <li>
                  <strong className="font-semibold text-gray-900">Consultas:</strong> Serán atendidas en un término máximo de diez (10) días hábiles contados a partir de la fecha de recibo. Si no fuere posible atenderla dentro de dicho término, se informará al interesado los motivos de la demora y la nueva fecha de respuesta, la cual no superará los cinco (5) días hábiles siguientes al vencimiento del primer plazo.
                </li>
                <li>
                  <strong className="font-semibold text-gray-900">
                    Reclamos (corrección, actualización o supresión):
                  </strong>{' '}
                  Deberán contener la identificación del titular, la descripción de los hechos, la dirección o correo de notificación y los documentos de soporte. Se resolverán en un término máximo de quince (15) días hábiles contados a partir del día siguiente a su recibo, prorrogables hasta por ocho (8) días hábiles adicionales previa notificación al solicitante.
                </li>
              </ul>
            </section>

            {/* Section 7 */}
            <section className="space-y-4 pt-6 border-t border-gray-100">
              <h2 className="text-lg sm:text-xl font-bold text-blue-950">
                7. SEGURIDAD DE LA INFORMACIÓN Y ENCARGADOS DEL TRATAMIENTO
              </h2>
              <p>
                FUNDACIÓN ULEP implementa medidas técnicas, humanas y administrativas razonables (como cifrado SSL/HTTPS y control de accesos) para proteger los datos contra adulteración, pérdida, consulta o uso no autorizado. Los datos podrán ser almacenados o procesados a través de proveedores tecnológicos (hosting, plataformas educativas, correo electrónico o pasarelas de pago) bajo estrictos deberes de confidencialidad y cumplimiento normativo.
              </p>
            </section>

            {/* Section 8 */}
            <section className="space-y-4 pt-6 border-t border-gray-100">
              <h2 className="text-lg sm:text-xl font-bold text-blue-950">
                8. VIGENCIA
              </h2>
              <p>
                La presente política rige a partir de su publicación en el sitio web y los datos personales permanecerán en las bases de datos de la Fundación durante el tiempo necesario para cumplir con las finalidades descritas y las obligaciones legales vigentes. Cualquier modificación sustancial será informada oportunamente a través de este mismo portal.
              </p>
            </section>
          </div>
        </article>
      </main>
    </SiteLayout>
  );
}
