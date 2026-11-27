import React from 'react';
import SiteLayout from '../components/SiteLayout';
import { withBase } from '../security/paths';
import { sanitizeExternalUrl } from '../security/security';
import { getOrgData } from '../security/vault';

export default function TermsOfUsePage() {
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
              TÉRMINOS Y CONDICIONES DE USO DEL SITIO WEB
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
                1. ACEPTACIÓN DE LOS TÉRMINOS
              </h2>
              <p>
                El acceso, navegación y uso del sitio web{' '}
                <a
                  href={sanitizeExternalUrl(org.websiteUrl)}
                  rel="noopener noreferrer"
                  className="text-blue-700 hover:text-blue-900 underline underline-offset-2"
                >
                  {org.websiteUrl}
                </a>
                , propiedad de FUNDACIÓN ULEP, Entidad Sin Ánimo de Lucro identificada con NIT{' '}
                <span className="tabular-nums">{org.nit}</span> y domiciliada en la{' '}
                {org.addressFull}, implican la aceptación plena y sin reservas de los presentes Términos y Condiciones. Si el usuario no está de acuerdo con ellos, deberá abstenerse de utilizar este portal.
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-4 pt-6 border-t border-gray-100">
              <h2 className="text-lg sm:text-xl font-bold text-blue-950">
                2. NATURALEZA Y FINALIDAD DEL SITIO WEB
              </h2>
              <p>
                Este sitio web tiene carácter informativo, educativo e institucional. A través de él se divulgan los programas de formación para el trabajo, cursos, proyectos académicos, laborales, empresariales y sociales desarrollados por FUNDACIÓN ULEP, así como los canales oficiales de contacto, inscripción, vinculación de voluntarios y recaudo de donaciones.
              </p>
            </section>

            {/* Section 3 */}
            <section className="space-y-4 pt-6 border-t border-gray-100">
              <h2 className="text-lg sm:text-xl font-bold text-blue-950">
                3. PROPIEDAD INTELECTUAL
              </h2>
              <p>
                Todos los contenidos publicados en este portal —incluyendo textos, logotipos, marcas, diseños gráficos, fotografías, material didáctico, documentos descargables y código fuente— son propiedad de FUNDACIÓN ULEP o cuentan con autorización de uso de sus respectivos titulares, y se encuentran protegidos por las normas colombianas e internacionales de derechos de autor y propiedad industrial. Queda prohibida su reproducción, distribución, modificación o uso comercial sin autorización previa y por escrito.
              </p>
            </section>

            {/* Section 4 */}
            <section className="space-y-4 pt-6 border-t border-gray-100">
              <h2 className="text-lg sm:text-xl font-bold text-blue-950">
                4. USO PERMITIDO Y OBLIGACIONES DEL USUARIO
              </h2>
              <p>
                El usuario se compromete a utilizar el sitio web de forma lícita, respetuosa y veraz. Queda estrictamente prohibido:
              </p>
              <ul className="space-y-2.5 list-disc pl-6 marker:text-blue-600">
                <li>
                  Suministrar información falsa, inexacta o suplantar la identidad de terceros en los formularios de inscripción, voluntariado, donación o contacto.
                </li>
                <li>
                  Intentar vulnerar la seguridad del sitio, introducir virus o software malicioso, alterar su funcionamiento o extraer bases de datos de manera automatizada (scraping).
                </li>
                <li>
                  Utilizar el nombre, logotipos, siglas o imagen institucional de FUNDACIÓN ULEP con fines fraudulentos o sin autorización expresa.
                </li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className="space-y-4 pt-6 border-t border-gray-100">
              <h2 className="text-lg sm:text-xl font-bold text-blue-950">
                5. ENLACES A TERCEROS
              </h2>
              <p>
                Este portal puede contener enlaces a plataformas externas (como aulas virtuales, redes sociales, entidades aliadas o pasarelas de pago). FUNDACIÓN ULEP no controla ni asume responsabilidad por el contenido, disponibilidad, seguridad o políticas de privacidad de dichos sitios de terceros.
              </p>
            </section>

            {/* Section 6 */}
            <section className="space-y-4 pt-6 border-t border-gray-100">
              <h2 className="text-lg sm:text-xl font-bold text-blue-950">
                6. PRIVACIDAD Y PROTECCIÓN DE DATOS
              </h2>
              <p>
                El tratamiento de los datos personales que el usuario suministre a través de este sitio web se rige por nuestra Política de Privacidad y Tratamiento de Datos Personales, disponible en{' '}
                <a
                  href={withBase('/politica-privacidad.html')}
                  className="text-blue-700 hover:text-blue-900 underline underline-offset-2"
                >
                  {org.privacyUrlText}
                </a>
                .
              </p>
            </section>

            {/* Section 7 */}
            <section className="space-y-4 pt-6 border-t border-gray-100">
              <h2 className="text-lg sm:text-xl font-bold text-blue-950">
                7. LIMITACIÓN DE RESPONSABILIDAD
              </h2>
              <p>
                FUNDACIÓN ULEP realiza esfuerzos razonables para mantener la información actualizada y el portal operativo; sin embargo, no garantiza la ausencia total de interrupciones técnicas, fallas de conexión, mantenimiento programado o errores tipográficos involuntarios.
              </p>
            </section>

            {/* Section 8 */}
            <section className="space-y-4 pt-6 border-t border-gray-100">
              <h2 className="text-lg sm:text-xl font-bold text-blue-950">
                8. MODIFICACIONES
              </h2>
              <p>
                FUNDACIÓN ULEP podrá actualizar o modificar estos Términos y Condiciones en cualquier momento sin previo aviso. Los cambios entrarán en vigor desde su publicación en esta misma página, por lo que se recomienda revisarlos periódicamente.
              </p>
            </section>

            {/* Section 9 */}
            <section className="space-y-4 pt-6 border-t border-gray-100">
              <h2 className="text-lg sm:text-xl font-bold text-blue-950">
                9. LEY APLICABLE Y CONTACTO
              </h2>
              <p>
                Estos términos se rigen por las leyes de la República de Colombia y cualquier controversia relacionada con su interpretación o cumplimiento será sometida a la jurisdicción competente en la ciudad de Popayán, Cauca. Para inquietudes sobre el uso de este sitio web, puede comunicarse al correo electrónico{' '}
                <a
                  href={`mailto:${org.emailContact}`}
                  className="text-blue-700 hover:text-blue-900 underline underline-offset-2"
                >
                  {org.emailContact}
                </a>{' '}
                o al teléfono <span className="tabular-nums">{org.phonesSlash}</span>.
              </p>
            </section>
          </div>
        </article>
      </main>
    </SiteLayout>
  );
}
