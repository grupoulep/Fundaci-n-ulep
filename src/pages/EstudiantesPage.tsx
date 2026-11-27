import React, { useState, useRef, useEffect } from 'react';
import {
  MonitorPlay,
  ArrowRight,
  Search,
  SlidersHorizontal,
  X,
  BookOpen,
  CheckCircle2
} from 'lucide-react';
import SiteLayout from '../components/SiteLayout';
import { withBase } from '../security/paths';
import { isValidEmail, isValidPhone, sanitizeFormAction } from '../security/security';
import { getCoursesData, getMediaData, getOrgData } from '../security/vault';

interface CourseItem {
  id: string;
  name: string;
  category: string;
  image: string;
}

export default function EstudiantesPage() {
  const org = getOrgData();
  const media = getMediaData();
  const coursesVault = getCoursesData();
  const COURSE_CATEGORIES = coursesVault.categories;
  const INITIAL_COURSES: CourseItem[] = coursesVault.items.map((item) => ({
    ...item,
    image: withBase(item.image)
  }));

  // Campus hero image fallback
  const [campusImageError, setCampusImageError] = useState(false);

  // Courses search & filter state
  const [failedCourseImages, setFailedCourseImages] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  // Enrollment modal state
  const [enrollingCourse, setEnrollingCourse] = useState<CourseItem | null>(null);
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [enrollError, setEnrollError] = useState('');
  const [enrollSuccess, setEnrollSuccess] = useState(false);

  // Close filter dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((item) => item !== category) : [...prev, category]
    );
  };

  const filteredCourses = INITIAL_COURSES.filter((course) => {
    const matchesSearch = course.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .includes(
        searchQuery
          .trim()
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
      );
    const matchesCategory =
      selectedCategories.length === 0 || selectedCategories.includes(course.category);
    return matchesSearch && matchesCategory;
  });

  const openEnrollModal = (course: CourseItem) => {
    setEnrollingCourse(course);
    setStudentName('');
    setStudentEmail('');
    setStudentPhone('');
    setEnrollError('');
    setEnrollSuccess(false);
  };

  const closeEnrollModal = () => {
    setEnrollingCourse(null);
    setEnrollError('');
    setEnrollSuccess(false);
  };

  const handleEnrollSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!enrollingCourse) {
      e.preventDefault();
      return;
    }

    if (!studentName.trim() || !studentEmail.trim() || !studentPhone.trim()) {
      e.preventDefault();
      setEnrollError('Por favor completa tu nombre, correo y teléfono para inscribirte.');
      return;
    }

    if (!isValidEmail(studentEmail)) {
      e.preventDefault();
      setEnrollError('Por favor ingresa un correo electrónico válido.');
      return;
    }

    if (!isValidPhone(studentPhone)) {
      e.preventDefault();
      setEnrollError('Por favor ingresa un número de teléfono válido.');
      return;
    }

    if (sanitizeFormAction(org.formAction) === '#') {
      e.preventDefault();
      setEnrollError('El canal de inscripción no se encuentra disponible temporalmente.');
      return;
    }

    setEnrollError('');
    window.setTimeout(() => {
      setEnrollSuccess(true);
    }, 300);
  };

  return (
    <SiteLayout>
      <main className="w-full flex-1 bg-white">
        {/* Campus Virtual Panel */}
        <section
          id="campus-virtual"
          className="scroll-mt-24 relative overflow-hidden w-full bg-white py-16 sm:py-24"
        >
          <img
            src={withBase(media.patternBg)}
            alt=""
            aria-hidden="true"
            className="pointer-events-none select-none hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 h-[108%] w-auto max-w-none object-contain -scale-x-100 opacity-[0.17] mix-blend-multiply"
          />
          <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Side: Campus Virtual Illustration */}
            <div className="lg:col-span-5 flex items-center justify-center">
              {campusImageError ? (
                <div className="w-full max-w-md aspect-[4/3] rounded-2xl bg-blue-50 border border-blue-100 flex flex-col items-center justify-center p-8 text-center">
                  <MonitorPlay className="w-10 h-10 text-blue-700 mb-3" />
                  <p className="text-base font-bold text-blue-950">Campus Virtual ULEP</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Plataforma digital de formación, clases en línea y recursos académicos.
                  </p>
                </div>
              ) : (
                <img
                  src={withBase(media.campusHero)}
                  alt="Ilustración institucional del Campus Virtual de Fundación ULEP"
                  referrerPolicy="no-referrer"
                  onError={() => setCampusImageError(true)}
                  className="w-full max-w-md mx-auto object-contain"
                />
              )}
            </div>

            {/* Right Side: Campus Virtual Message */}
            <div className="lg:col-span-7 text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-blue-950 tracking-tight leading-tight text-balance">
                Tu Campus Virtual: aprende a tu ritmo, sin barreras ni distancias
              </h1>
              <p className="text-base sm:text-lg text-gray-600 mt-5 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Accede a un entorno académico moderno diseñado para acompañar tu crecimiento
                profesional. En el Campus Virtual de Fundación ULEP encuentras tus aulas en línea,
                guías de estudio, actividades prácticas, seguimiento docente y tus certificados en
                un solo lugar.
              </p>

              <div className="mt-7 flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <button
                  type="button"
                  onClick={(e) => e.preventDefault()}
                  className="group inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-950 hover:bg-blue-800 text-white text-sm font-semibold transition-all duration-200 active:scale-[0.98] cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  <span>Ingresar al Campus Virtual</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Courses Panel (2:3 Cards + Simple Search + Checkbox Filter Dropdown) */}
        <section
          id="cursos"
          className="scroll-mt-24 relative overflow-hidden w-full bg-gray-50 border-t border-gray-200/80 py-14 sm:py-20"
        >
          <img
            src={withBase(media.patternBg)}
            alt=""
            aria-hidden="true"
            className="pointer-events-none select-none hidden md:block absolute left-0 top-0 h-[540px] w-auto max-w-none object-contain opacity-[0.14] mix-blend-multiply"
          />
          <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8">
            {/* Header + Search & Filter Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-10">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-blue-950 tracking-tight">
                Cursos Disponibles
              </h2>

              <div className="flex items-center gap-2.5 w-full md:w-auto">
                {/* Simple Search Input */}
                <div className="relative flex-1 md:w-72">
                  <Search
                    aria-hidden="true"
                    className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar curso..."
                    aria-label="Buscar curso"
                    className="w-full pl-10 pr-9 py-2.5 rounded-lg bg-white border border-gray-300 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="Limpiar búsqueda"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Icon Button with Checkbox Dropdown */}
                <div ref={filterMenuRef} className="relative flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setFilterOpen((prev) => !prev)}
                    aria-expanded={filterOpen}
                    aria-haspopup="true"
                    aria-label="Filtrar cursos por categoría"
                    className={`inline-flex items-center justify-center gap-2 h-[42px] px-3.5 rounded-lg border text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      filterOpen || selectedCategories.length > 0
                        ? 'bg-blue-950 border-blue-950 text-white'
                        : 'bg-white border-gray-300 text-blue-950 hover:border-blue-600'
                    }`}
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    {selectedCategories.length > 0 && (
                      <span className="text-xs tabular-nums">{selectedCategories.length}</span>
                    )}
                  </button>

                  {filterOpen && (
                    <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl border border-gray-200 shadow-lg z-30 p-4">
                      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-gray-100">
                        <span className="text-xs font-bold text-blue-950">Filtrar por área</span>
                        {selectedCategories.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedCategories([])}
                            className="text-xs font-medium text-blue-700 hover:underline cursor-pointer"
                          >
                            Limpiar
                          </button>
                        )}
                      </div>

                      <div className="space-y-2.5">
                        {COURSE_CATEGORIES.map((category) => {
                          const isChecked = selectedCategories.includes(category);
                          return (
                            <label
                              key={category}
                              className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-blue-950 cursor-pointer select-none"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleCategory(category)}
                                className="w-4 h-4 rounded border-gray-300 text-blue-800 focus:ring-blue-600 cursor-pointer"
                              />
                              <span>{category}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2x3 Course Cards Grid */}
            {filteredCourses.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 py-14 px-6 text-center">
                <p className="text-base font-semibold text-blue-950">
                  No se encontraron cursos con los criterios seleccionados.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategories([]);
                  }}
                  className="mt-4 px-4 py-2 rounded-lg bg-blue-950 hover:bg-blue-800 text-white text-sm font-semibold transition-colors cursor-pointer"
                >
                  Ver todos los cursos
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredCourses.map((course) => (
                  <article
                    key={course.id}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col justify-between transition-colors hover:border-blue-300"
                  >
                    {/* 2:3 Portrait Course Cover */}
                    <div className="w-full aspect-[2/3] bg-blue-50 overflow-hidden">
                      {failedCourseImages[course.id] ? (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                          <BookOpen className="w-8 h-8 text-blue-700 mb-2" />
                          <span className="text-xs font-semibold text-blue-950">
                            {course.name}
                          </span>
                        </div>
                      ) : (
                        <img
                          src={course.image}
                          alt={course.name}
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setFailedCourseImages((prev) => ({ ...prev, [course.id]: true }))
                          }
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                      )}
                    </div>

                    {/* Course Name + Inscribirme Button */}
                    <div className="p-5 flex flex-col flex-1 justify-between gap-4">
                      <h3 className="text-base font-bold text-blue-950 leading-snug">
                        {course.name}
                      </h3>
                      <button
                        type="button"
                        onClick={() => openEnrollModal(course)}
                        className="w-full py-2.5 px-4 rounded-lg bg-blue-950 hover:bg-blue-800 text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      >
                        Inscribirme
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Course Pre-Registration Modal */}
        {enrollingCourse && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Formulario de inscripción"
            className="fixed inset-0 z-50 bg-blue-950/50 flex items-center justify-center p-4"
            onClick={closeEnrollModal}
          >
            <div
              className="bg-white rounded-2xl border border-gray-200 max-w-md w-full p-6 sm:p-7 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={closeEnrollModal}
                  aria-label="Cerrar ventana"
                  className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {enrollSuccess ? (
                <div className="pt-6 space-y-4 text-center">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-blue-950">
                      Solicitud de inscripción recibida
                    </h4>
                    <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
                      Gracias, <strong className="text-gray-900">{studentName}</strong>. Te
                      enviaremos los pasos de matrícula al correo{' '}
                      <span className="font-medium text-blue-900">{studentEmail}</span>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeEnrollModal}
                    className="w-full py-2.5 px-4 rounded-lg bg-blue-950 hover:bg-blue-800 text-white text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Aceptar
                  </button>
                </div>
              ) : (
                <form
                  action={sanitizeFormAction(org.formAction)}
                  method="POST"
                  target="_blank"
                  rel="noopener noreferrer"
                  onSubmit={handleEnrollSubmit}
                  className="pt-3 space-y-4"
                  noValidate
                >
                  <input type="hidden" name="curso" value={enrollingCourse.name} />
                  <input
                    type="hidden"
                    name="_subject"
                    value={`Nueva inscripción al curso: ${enrollingCourse.name} - Fundación ULEP`}
                  />
                  <input type="hidden" name="_template" value="table" />
                  <input
                    type="text"
                    name="_honey"
                    className="hidden"
                    tabIndex={-1}
                    autoComplete="off"
                  />

                  {enrollError && (
                    <p
                      role="alert"
                      className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800"
                    >
                      {enrollError}
                    </p>
                  )}
                  <div>
                    <label
                      htmlFor="studentName"
                      className="block text-xs font-semibold text-gray-700 mb-1"
                    >
                      Nombre completo *
                    </label>
                    <input
                      id="studentName"
                      name="nombre"
                      type="text"
                      required
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="Tu nombre completo"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="studentEmail"
                      className="block text-xs font-semibold text-gray-700 mb-1"
                    >
                      Correo electrónico *
                    </label>
                    <input
                      id="studentEmail"
                      name="correo"
                      type="email"
                      required
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="studentPhone"
                      className="block text-xs font-semibold text-gray-700 mb-1"
                    >
                      Teléfono / WhatsApp *
                    </label>
                    <input
                      id="studentPhone"
                      name="telefono"
                      type="tel"
                      required
                      value={studentPhone}
                      onChange={(e) => setStudentPhone(e.target.value)}
                      placeholder={org.phonePlaceholder}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 tabular-nums focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-lg bg-blue-950 hover:bg-blue-800 text-white text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Confirmar inscripción
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
    </SiteLayout>
  );
}
