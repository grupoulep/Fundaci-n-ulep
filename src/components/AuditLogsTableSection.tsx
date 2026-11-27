import React, { useMemo, useState } from 'react';
import {
  Search,
  MapPin,
  Globe,
  Download,
  RefreshCw,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
  User,
  Monitor,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import type { FirestoreAuditLogRecord } from '../security/firestoreAudit';

interface AuditLogsTableSectionProps {
  logs: FirestoreAuditLogRecord[];
  loading: boolean;
  error: string;
  isFirebaseAdmin: boolean;
  connectingGoogle: boolean;
  geoStatus: 'idle' | 'requesting' | 'active' | 'denied';
  onConnectGoogle: () => void;
  onRequestGps: () => void;
  onRefresh: () => void;
  onExportCsv: (filteredLogs: FirestoreAuditLogRecord[]) => void;
  formatDateTime: (isoStr: string) => string;
  getActionMeta: (action: string) => { label: string; colorClass: string };
  getModuleLabel: (moduleName: string) => string;
}

const PAGE_SIZE = 15;

function toLocalDateKey(isoStr: string): string {
  const date = new Date(isoStr);
  if (Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function AuditLogsTableSection({
  logs,
  loading,
  error,
  isFirebaseAdmin,
  connectingGoogle,
  geoStatus,
  onConnectGoogle,
  onRequestGps,
  onRefresh,
  onExportCsv,
  formatDateTime,
  getActionMeta,
  getModuleLabel,
}: AuditLogsTableSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [userFilter, setUserFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortDesc, setSortDesc] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const uniqueUsers = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((entry) => {
      if (entry.actor) set.add(entry.actor);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const result = logs.filter((entry) => {
      if (actionFilter !== 'ALL' && entry.action !== actionFilter) return false;
      if (userFilter !== 'ALL' && entry.actor !== userFilter) return false;

      if (dateFrom || dateTo) {
        const entryDay = toLocalDateKey(entry.createdAt);
        if (!entryDay) return false;
        if (dateFrom && entryDay < dateFrom) return false;
        if (dateTo && entryDay > dateTo) return false;
      }

      if (!q) return true;
      return (
        entry.ipAddress.toLowerCase().includes(q) ||
        entry.location.toLowerCase().includes(q) ||
        entry.actor.toLowerCase().includes(q) ||
        entry.summary.toLowerCase().includes(q) ||
        entry.details.toLowerCase().includes(q) ||
        entry.targetKey.toLowerCase().includes(q) ||
        getActionMeta(entry.action).label.toLowerCase().includes(q) ||
        getModuleLabel(entry.module).toLowerCase().includes(q)
      );
    });

    result.sort((a, b) => {
      const ta = new Date(a.createdAt).getTime() || 0;
      const tb = new Date(b.createdAt).getTime() || 0;
      return sortDesc ? tb - ta : ta - tb;
    });

    return result;
  }, [logs, searchTerm, actionFilter, userFilter, dateFrom, dateTo, sortDesc, getActionMeta, getModuleLabel]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredLogs.slice(start, start + PAGE_SIZE);
  }, [filteredLogs, currentPage]);

  const hasActiveFilters = Boolean(
    searchTerm.trim() || actionFilter !== 'ALL' || userFilter !== 'ALL' || dateFrom || dateTo
  );

  const clearAllFilters = () => {
    setSearchTerm('');
    setActionFilter('ALL');
    setUserFilter('ALL');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h3 className="text-lg sm:text-xl font-extrabold text-blue-950">
            Auditoría de movimientos
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Tabla de registros almacenados en Firestore con fecha, acción realizada, dirección IP,
            ubicación aproximada y usuario responsable.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={geoStatus === 'requesting'}
            onClick={onRequestGps}
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              geoStatus === 'active'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>
              {geoStatus === 'active'
                ? 'GPS activo'
                : geoStatus === 'requesting'
                ? 'Ubicando...'
                : 'Activar GPS'}
            </span>
          </button>

          <button
            type="button"
            disabled={!isFirebaseAdmin || filteredLogs.length === 0}
            onClick={() => onExportCsv(filteredLogs)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-blue-700" />
            <span>Exportar CSV</span>
          </button>

          <button
            type="button"
            disabled={!isFirebaseAdmin || loading}
            onClick={onRefresh}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-60 text-slate-700 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Firebase Admin Auth Prompt when signed in only with local credentials */}
      {!isFirebaseAdmin ? (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-blue-950">
                Conecta tu cuenta administradora para consultar Firestore
              </h4>
              <p className="text-xs text-slate-700 mt-1 leading-relaxed max-w-xl">
                Por seguridad, los registros de auditoría en Firestore (direcciones IP, ubicación
                aproximada y usuarios) solo son visibles al verificar la sesión con la cuenta Google
                autorizada.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={connectingGoogle}
            onClick={onConnectGoogle}
            className="px-4 py-2.5 rounded-lg bg-blue-950 hover:bg-blue-800 disabled:opacity-60 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {connectingGoogle ? 'Conectando...' : 'Conectar con Google'}
          </button>
        </div>
      ) : (
        <>
          {error && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Filter Bar */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {/* General Search */}
              <div className="relative lg:col-span-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  aria-label="Buscar en auditoría"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Buscar por IP, ubicación, usuario o acción..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-700"
                />
              </div>

              {/* Action Filter */}
              <select
                aria-label="Filtrar por acción"
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-700"
              >
                <option value="ALL">Todas las acciones</option>
                <option value="CREAR">Registro</option>
                <option value="EDITAR">Edición</option>
                <option value="CAMBIAR_ESTADO">Cambio de estado</option>
                <option value="ELIMINAR">Eliminación</option>
                <option value="CARGA_MASIVA">Carga masiva</option>
                <option value="EXPORTAR">Exportación CSV</option>
                <option value="INICIO_SESION">Inicio de sesión</option>
                <option value="CIERRE_SESION">Cierre de sesión</option>
              </select>

              {/* User Filter */}
              <select
                aria-label="Filtrar por usuario"
                value={userFilter}
                onChange={(e) => {
                  setUserFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-700"
              >
                <option value="ALL">Todos los usuarios</option>
                {uniqueUsers.map((actor) => (
                  <option key={actor} value={actor}>
                    {actor}
                  </option>
                ))}
              </select>

              {/* Date Range compact pair */}
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="date"
                  aria-label="Fecha desde"
                  title="Fecha desde"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-2 py-2 rounded-lg bg-white border border-slate-300 text-[11px] text-slate-800 focus:outline-none focus:border-blue-700"
                />
                <input
                  type="date"
                  aria-label="Fecha hasta"
                  title="Fecha hasta"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-2 py-2 rounded-lg bg-white border border-slate-300 text-[11px] text-slate-800 focus:outline-none focus:border-blue-700"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 pt-0.5">
              <span>
                Mostrando <strong className="text-blue-950">{filteredLogs.length}</strong> de{' '}
                <strong className="text-blue-950">{logs.length}</strong> registros en Firestore
              </span>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-950 font-semibold cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Limpiar filtros</span>
                </button>
              )}
            </div>
          </div>

          {/* Audit Table */}
          {loading && logs.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 py-12 px-4 text-center text-sm text-slate-500">
              Cargando registros de auditoría desde Firestore...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 py-12 px-4 text-center text-sm text-slate-500">
              {logs.length === 0
                ? 'Aún no hay eventos registrados en Firestore. Las acciones realizadas en el panel aparecerán aquí automáticamente.'
                : 'No se encontraron registros que coincidan con los filtros seleccionados.'}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[780px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      <th scope="col" className="py-3 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSortDesc((prev) => !prev)}
                          className="inline-flex items-center gap-1.5 hover:text-blue-950 transition-colors cursor-pointer uppercase"
                        >
                          <span>Fecha</span>
                          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      </th>
                      <th scope="col" className="py-3 px-4">
                        Acción realizada
                      </th>
                      <th scope="col" className="py-3 px-4 whitespace-nowrap">
                        Dirección IP
                      </th>
                      <th scope="col" className="py-3 px-4">
                        Ubicación aproximada
                      </th>
                      <th scope="col" className="py-3 px-4">
                        Usuario
                      </th>
                      <th scope="col" className="py-3 px-3 text-right w-10">
                        <span className="sr-only">Detalles</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {paginatedLogs.map((entry) => {
                      const meta = getActionMeta(entry.action);
                      const moduleLabel = getModuleLabel(entry.module);
                      const isExpanded = expandedId === entry.id;

                      return (
                        <React.Fragment key={entry.id}>
                          <tr
                            onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                            className={`transition-colors cursor-pointer ${
                              isExpanded ? 'bg-blue-50/40' : 'hover:bg-slate-50/90'
                            }`}
                          >
                            {/* Fecha */}
                            <td className="py-3 px-4 text-slate-600 whitespace-nowrap tabular-nums align-top">
                              {formatDateTime(entry.createdAt)}
                            </td>

                            {/* Acción realizada */}
                            <td className="py-3 px-4 align-top max-w-xs">
                              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                                <span className={`font-bold ${meta.colorClass}`}>{meta.label}</span>
                                <span className="text-slate-300" aria-hidden="true">
                                  ·
                                </span>
                                <span className="font-semibold text-blue-950">{moduleLabel}</span>
                              </div>
                              <p className="text-slate-800 mt-0.5 leading-snug">{entry.summary}</p>
                            </td>

                            {/* Dirección IP */}
                            <td className="py-3 px-4 whitespace-nowrap align-top">
                              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-slate-700 tabular-nums">
                                <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{entry.ipAddress || 'No disponible'}</span>
                              </span>
                            </td>

                            {/* Ubicación aproximada */}
                            <td className="py-3 px-4 text-slate-700 align-top max-w-[220px]">
                              <span className="inline-flex items-start gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                <span className="leading-snug">
                                  {entry.location || 'No determinada'}
                                </span>
                              </span>
                            </td>

                            {/* Usuario */}
                            <td className="py-3 px-4 text-slate-700 align-top whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5 font-medium">
                                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{entry.actor || 'Administrador'}</span>
                              </span>
                            </td>

                            {/* Expand Chevron */}
                            <td className="py-3 px-3 text-right align-top">
                              <button
                                type="button"
                                aria-label={
                                  isExpanded
                                    ? 'Ocultar detalles del movimiento'
                                    : 'Ver detalles del movimiento'
                                }
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedId(isExpanded ? null : entry.id);
                                }}
                                className="p-1 rounded-md text-slate-400 hover:text-blue-950 hover:bg-slate-100 transition-colors cursor-pointer"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                            </td>
                          </tr>

                          {/* Expanded Forensic Metadata Row */}
                          {isExpanded && (
                            <tr className="bg-slate-50/80">
                              <td colSpan={6} className="px-4 py-3.5 border-t border-slate-100">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-2 text-[11px] text-slate-600">
                                  {entry.targetKey && (
                                    <div>
                                      <strong className="text-slate-800">Objetivo / Ref:</strong>{' '}
                                      <span className="tabular-nums">{entry.targetKey}</span>
                                    </div>
                                  )}
                                  {entry.deviceInfo && (
                                    <div className="flex items-center gap-1.5">
                                      <Monitor className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                      <span>
                                        <strong className="text-slate-800">Equipo:</strong>{' '}
                                        {entry.deviceInfo}
                                      </span>
                                    </div>
                                  )}
                                  <div>
                                    <strong className="text-slate-800">Zona / Idioma:</strong>{' '}
                                    {entry.timezone || '—'} · {entry.locale || '—'}
                                  </div>
                                  <div>
                                    <strong className="text-slate-800">Pantalla / Ruta:</strong>{' '}
                                    <span className="tabular-nums">
                                      {entry.screenInfo || '—'} · {entry.requestMethod || '—'}
                                    </span>
                                  </div>
                                  {entry.details && (
                                    <div className="sm:col-span-2 lg:col-span-3 pt-1 border-t border-slate-200/70">
                                      <strong className="text-slate-800">Detalle completo:</strong>{' '}
                                      <span>{entry.details}</span>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              {totalPages > 1 && (
                <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs text-slate-600">
                  <span>
                    Página <strong className="text-blue-950">{currentPage}</strong> de{' '}
                    <strong className="text-blue-950">{totalPages}</strong>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-45 text-slate-700 font-semibold transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Anterior</span>
                    </button>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-45 text-slate-700 font-semibold transition-colors cursor-pointer"
                    >
                      <span>Siguiente</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
