import React, { useState } from 'react';
import {
  ChevronDown,
  Menu,
  X,
  MapPin,
  Phone,
  Mail,
  Clock,
  Facebook,
  Instagram,
  Linkedin,
  Youtube
} from 'lucide-react';
import { withBase } from '../security/paths';
import { getMediaData, getOrgData } from '../security/vault';

interface SiteLayoutProps {
  children: React.ReactNode;
}

interface SubItem {
  label: string;
  href?: string;
  targetId?: string;
}

interface MenuItem {
  title: string;
  href?: string;
  subitems: SubItem[];
}

const menuItems: MenuItem[] = [
  {
    title: 'INICIO',
    href: '/',
    subitems: []
  },
  {
    title: 'ESTUDIANTES',
    href: '/estudiantes.html',
    subitems: []
  },
  {
    title: 'EMPRESA',
    href: '/empresa.html',
    subitems: []
  },
  {
    title: 'TRÁMITES',
    href: '/tramites.html',
    subitems: []
  },
  {
    title: 'TRANSPARENCIA',
    href: '/transparencia.html',
    subitems: []
  }
];

export default function SiteLayout({ children }: SiteLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openSubmenuIndex, setOpenSubmenuIndex] = useState<number | null>(null);
  const org = getOrgData();
  const media = getMediaData();

  const handleSubitemClick = (e: React.MouseEvent<HTMLAnchorElement>, sub: SubItem) => {
    if (sub.targetId) {
      const targetEl = document.getElementById(sub.targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setMobileMenuOpen(false);
        setOpenSubmenuIndex(null);
        return;
      }
    }
    if (!sub.href) {
      e.preventDefault();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Logo Section (scrolls away) */}
      <div className="w-full bg-white">
        <div className="w-full max-w-[1000px] mx-auto flex items-center justify-center py-4 px-4">
          <a href={withBase('/')} aria-label="Ir al inicio de Fundación ULEP">
            <img
              src={withBase(media.logoPrimary)}
              alt="Fundación ULEP Logo"
              className="h-14 md:h-16 lg:h-20 object-contain mx-auto"
            />
          </a>
        </div>
      </div>

      {/* Sticky Navigation Menu */}
      <header className="w-full bg-white shadow-md sticky top-0 z-50 border-t border-gray-100">
        <div className="w-full max-w-[1000px] mx-auto px-4">
          {/* Mobile menu bar */}
          <div className="w-full flex md:hidden items-center justify-end py-2.5">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-blue-900 hover:bg-blue-50 focus:outline-none"
              aria-label="Menú principal"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Desktop Navigation Menu */}
          <nav className="w-full hidden md:flex justify-center py-2.5">
            <ul className="flex flex-wrap justify-center items-center gap-2 lg:gap-6">
              {menuItems.map((item, index) => {
                const hasSubitems = item.subitems.length > 0;
                return (
                  <li key={index} className="relative group py-1">
                    <a
                      href={item.href ? withBase(item.href) : '#'}
                      onClick={item.href ? undefined : (e) => e.preventDefault()}
                      className="flex items-center gap-1 px-3 py-2 text-sm lg:text-base font-semibold text-blue-900 hover:text-blue-600 transition-colors rounded-md hover:bg-blue-50"
                    >
                      {item.title}
                      {hasSubitems && (
                        <ChevronDown className="w-4 h-4 text-blue-700 transition-transform duration-200 group-hover:rotate-180" />
                      )}
                    </a>

                    {/* Dropdown List */}
                    {hasSubitems && (
                      <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <div className="bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden py-1">
                          {item.subitems.map((sub, subIdx) => (
                            <a
                              key={subIdx}
                              href={sub.href ? withBase(sub.href) : '#'}
                              onClick={(e) => handleSubitemClick(e, sub)}
                              className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-600 hover:text-white transition-colors"
                            >
                              {sub.label}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Mobile Dropdown Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 shadow-lg">
            <ul className="flex flex-col space-y-2">
              {menuItems.map((item, index) => {
                const hasSubitems = item.subitems.length > 0;
                return (
                  <li key={index} className="border-b border-gray-50 last:border-none pb-2">
                    {hasSubitems ? (
                      <>
                        <div
                          onClick={() => setOpenSubmenuIndex(openSubmenuIndex === index ? null : index)}
                          className="flex items-center justify-between py-2 text-sm font-semibold text-blue-950 cursor-pointer"
                        >
                          {item.href ? (
                            <a
                              href={withBase(item.href)}
                              onClick={(e) => e.stopPropagation()}
                              className="hover:text-blue-600 transition-colors"
                            >
                              {item.title}
                            </a>
                          ) : (
                            <span>{item.title}</span>
                          )}
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-200 ${
                              openSubmenuIndex === index ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                        {openSubmenuIndex === index && (
                          <ul className="pl-4 py-1 space-y-1 bg-gray-50 rounded-md">
                            {item.subitems.map((sub, subIdx) => (
                              <li key={subIdx}>
                                <a
                                  href={sub.href ? withBase(sub.href) : '#'}
                                  onClick={(e) => handleSubitemClick(e, sub)}
                                  className="block py-1.5 text-xs text-gray-600 hover:text-blue-600"
                                >
                                  {sub.label}
                                </a>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    ) : (
                      <a
                        href={item.href ? withBase(item.href) : '#'}
                        className="block py-2 text-sm font-semibold text-blue-950 hover:text-blue-600 transition-colors"
                      >
                        {item.title}
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </header>

      {/* Page Content */}
      {children}

      {/* Institutional Footer */}
      <footer className="w-full bg-blue-950 text-blue-100 mt-auto border-t border-blue-900">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
            {/* Brand Column */}
            <div className="space-y-5">
              <a
                href={withBase('/')}
                className="inline-flex items-center"
                aria-label="Inicio Fundación ULEP"
              >
                <img
                  src={withBase(media.logoFooter)}
                  alt="Fundación ULEP Logo"
                  className="h-16 object-contain"
                />
              </a>
              <p className="text-sm text-blue-200/90 leading-relaxed max-w-xs">
                Comprometidos con la educación, el acompañamiento integral y el desarrollo social sostenible de nuestra comunidad.
              </p>
              <div className="flex items-center gap-3 pt-1">
                {[
                  { label: 'Facebook', icon: Facebook },
                  { label: 'Instagram', icon: Instagram },
                  { label: 'LinkedIn', icon: Linkedin },
                  { label: 'YouTube', icon: Youtube }
                ].map(({ label, icon: Icon }) => (
                  <a
                    key={label}
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    aria-label={label}
                    className="w-10 h-10 rounded-lg bg-blue-900/70 hover:bg-blue-600 text-blue-100 hover:text-white flex items-center justify-center transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Navigation */}
            <div>
              <h3 className="text-sm font-bold text-white tracking-wider mb-5">
                Navegación
              </h3>
              <ul className="space-y-3 text-sm">
                {[
                  { label: 'Inicio', href: '/' },
                  { label: 'Estudiantes', href: '/estudiantes.html' },
                  { label: 'Empresa', href: '/empresa.html' },
                  { label: 'Trámites', href: '/tramites.html' },
                  { label: 'Transparencia', href: '/transparencia.html' }
                ].map((link) => (
                  <li key={link.label}>
                    <a
                      href={withBase(link.href)}
                      className="text-blue-200/90 hover:text-white hover:underline underline-offset-4 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-sm font-bold text-white tracking-wider mb-5">
                Servicios en Línea
              </h3>
              <ul className="space-y-3 text-sm">
                {[
                  { label: 'Consulta tus Pagos', href: '/tramites.html#consulta-pagos' },
                  { label: 'Paz y Salvo', href: '/tramites.html#paz-y-salvo' },
                  { label: 'Donaciones', href: '/tramites.html#donaciones' },
                  { label: 'Diligencia tu PQRS', href: '/tramites.html#pqrs' },
                  { label: 'Preguntas Frecuentes', href: '/tramites.html#preguntas-frecuentes' }
                ].map((service) => (
                  <li key={service.label}>
                    <a
                      href={service.href ? withBase(service.href) : '#'}
                      onClick={service.href ? undefined : (e) => e.preventDefault()}
                      className="text-blue-200/90 hover:text-white hover:underline underline-offset-4 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
                    >
                      {service.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-sm font-bold text-white tracking-wider mb-5">
                Contacto y Horarios
              </h3>
              <ul className="space-y-3.5 text-sm text-blue-200/90">
                <li className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
                  <span>{org.addressShort}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
                  <span className="tabular-nums">{org.phonesDash}</span>
                </li>
                <li className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
                  <a
                    href={`mailto:${org.emailLegal}`}
                    className="hover:text-white transition-colors"
                  >
                    {org.emailLegal}
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
                  <span>{org.schedule}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright Bar */}
          <div className="mt-12 pt-6 border-t border-blue-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-blue-300/80">
            <p>© {new Date().getFullYear()} Fundación ULEP. Todos los derechos reservados.</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href={withBase('/politica-privacidad.html')}
                className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
              >
                Política de Privacidad y Tratamiento de Datos Personales
              </a>
              <span aria-hidden="true">·</span>
              <a
                href={withBase('/terminos-de-uso.html')}
                className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
              >
                Términos de Uso
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
