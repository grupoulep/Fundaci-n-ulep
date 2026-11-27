import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Mail,
  Phone,
  RotateCcw,
  Search,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import type { PqrsStatus, PqrsSubmissionRecord } from '../security/firestoreForms';

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const PQRS_DEADLINE_DAYS = 15;
const PQRS_DEADLINE_MS = PQRS_DEADLINE_DAYS * DAY_MS;
const EXPIRING_SOON_THRESHOLD_MS = 3 * DAY_MS;

type PqrsFilter = 'TODOS' | 'VENCIDOS' | 'POR_VENCER' | 'EN_TIEMPO' | 'PENDIENTES' | 'HECHOS';
type PqrsUrgency = 'VENCIDO' | 'POR_VENCER' | 'EN_TIEMPO' | 'HECHO';

interface ComputedPqrsItem {
  record: PqrsSubmissionRecord;
  deadlineMs: number;
  remainingMs: number;
  urgency: PqrsUrgency;
  countdownLabel: string;
}

interface AdminPqrsSectionProps {
  items: PqrsSubmissionRecord[];
  loading: boolean;
  error: string;
  isFirebaseAdmin: boolean;
  updatingId: string | null;
  onToggleStatus: (record: PqrsSubmissionRecord, nextStatus: PqrsStatus) => void;
  onDelete: (record: PqrsSubmissionRecord) => void;
  onExportCsv: (rows: PqrsSubmissionRecord[]) => void;
  formatDateTime: (isoStr: string) => string;
}

function formatCountdown(remainingMs: number): string {
  const absMs = Math.abs(remainingMs);
  const days = Math.floor(absMs / DAY_MS);
  const hours = Math.floor((absMs % DAY_MS) / HOUR_MS);
  const minutes = Math.floor((absMs % HOUR_MS) / MINUTE_MS);

  const parts: string[] = [];
  if (days > 0) {
    parts.push(`${days} ${days === 1 ? 'día' : 'días'}`);
  }
  if (hours > 0 || days > 0) {
    parts.push(`${hours} h`);
  } else {
    parts.push(`${Math.max(1, minutes)} min`);
  }

  if (remainingMs <= 0) {
    return `Vencido hace ${parts.join(' y ')}`;
  }
  return `Faltan ${parts.join(' y ')}`;
}

function formatDeadlineDate(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminPqrsSection({
  items,
  loading,
  error,
  isFirebaseAdmin,
  updatingId,
  onToggleStatus,
  onDelete,
  onExportCsv,
  formatDateTime,
}: AdminPqrsSectionProps) {
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<PqrsFilter>('TODOS');

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const computedSorted = useMemo<ComputedPqrsItem[]>(() => {
    return items
      .map((record) => {
        const deadlineMs = record.createdAtMs + PQRS_DEADLINE_MS;
        const remainingMs = deadlineMs - nowMs;
        let urgency: PqrsUrgency;
        if (record.status === 'HECHO') {
          urgency = 'HECHO';
        } else if (remainingMs <= 0) {
          urgency = 'VENCIDO';
        } else if (remainingMs <= EXPIRING_SOON_THRESHOLD_MS) {
          urgency = 'POR_VENCER';
        } else {
          urgency = 'EN_TIEMPO';
        }

        return {
          record,
          deadlineMs,
          remainingMs,
          urgency,
          countdownLabel:
            record.status === 'HECHO' ? 'Atendido · Hecho' : formatCountdown(remainingMs),
        };
      })
      .sort((a, b) => {
        // Hechos ALWAYS go to the very bottom of the list
        const aDone = a.record.status === 'HECHO';
        const bDone = b.record.status === 'HECHO';
        if (aDone !== bDone) {
          return aDone ? 1 : -1;
        }
        if (!aDone && !bDone) {
          // Ascending remaining time: most overdue (vencidos) first, then por vencer, then en tiempo
          return a.remainingMs - b.remainingMs;
        }
        // Among Hechos at the end, keep most recently updated first
        return Date.parse(b.record.updatedAt) - Date.parse(a.record.updatedAt);
      });
  }, [items, nowMs]);

  const counts = useMemo(() => {
    let vencidos = 0;
    let porVencer = 0;
    let enTiempo = 0;
    let hechos = 0;
    for (const entry of computedSorted) {
      if (entry.urgency === 'VENCIDO') vencidos += 1;
      else if (entry.urgency === 'POR_VENCER') porVencer += 1;
      else if (entry.urgency === 'EN_TIEMPO') enTiempo += 1;
      else hechos += 1;
    }
    return { vencidos, porVencer, enTiempo, hechos };
  }, [computedSorted]);

  const filteredItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return computedSorted.filter((entry) => {
      if (filterMode === 'VENCIDOS' && entry.urgency !== 'VENCIDO') return false;
      if (filterMode === 'POR_VENCER' && entry.urgency !== 'POR_VENCER') return false;
      if (filterMode === 'EN_TIEMPO' && entry.urgency !== 'EN_TIEMPO') return false;
      if (filterMode === 'PENDIENTES' && entry.record.status !== 'PENDIENTE') return false;
      if (filterMode === 'HECHOS' && entry.record.status !== 'HECHO') return false;

      if (!q) return true;
      const r = entry.record;
      return (
        r.radicado.toLowerCase().includes(q) ||
        r.fullName.toLowerCase().includes(q) ||
        r.documentNumber.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q) ||
        r.pqrsType.toLowerCase().includes(q) ||
        r.area.toLowerCase().includes(q) ||
        r.subject.toLowerCase().includes(q) ||
        r.message.toLowerCase().includes(q)
      );
    });
  }, [computedSorted, searchTerm, filterMode]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h3 className="text-lg sm:text-xl font-extrabold text-blue-950">
            Solicitudes PQRS ({items.length})
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Control de radicados ciudadanos con cuenta regresiva de 15 días. Se ordenan primero los
            vencidos, luego los próximos a vencer y al final los marcados como hechos.
          </p>
        </div>

        <button
          type="button"
          disabled={filteredItems.length === 0}
          onClick={() => onExportCsv(filteredItems.map((entry) => entry.record))}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-blue-700" />
          <span>Exportar CSV</span>
        </button>
      </div>

      {/* Summary Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-red-200 bg-red-50/70 p-3.5">
          <p className="text-xs font-semibold text-red-700">Vencidos</p>
          <p className="text-2xl font-extrabold text-red-900 tabular-nums mt-0.5">
            {counts.vencidos}
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5">
          <p className="text-xs font-semibold text-amber-800">Por vencer (≤ 3 días)</p>
          <p className="text-2xl font-extrabold text-amber-950 tabular-nums mt-0.5">
            {counts.porVencer}
          </p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5">
          <p className="text-xs font-semibold text-blue-700">En tiempo</p>
          <p className="text-2xl font-extrabold text-blue-950 tabular-nums mt-0.5">
            {counts.enTiempo}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5">
          <p className="text-xs font-semibold text-emerald-700">Hechos</p>
          <p className="text-2xl font-extrabold text-emerald-950 tabular-nums mt-0.5">
            {counts.hechos}
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por radicado, nombre, documento, correo, asunto o tipo..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-700"
          />
        </div>
        <select
          aria-label="Filtrar PQRS por estado"
          value={filterMode}
          onChange={(e) => setFilterMode(e.target.value as PqrsFilter)}
          className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-700"
        >
          <option value="TODOS">Todos ({items.length})</option>
          <option value="VENCIDOS">Vencidos ({counts.vencidos})</option>
          <option value="POR_VENCER">Por vencer ({counts.porVencer})</option>
          <option value="EN_TIEMPO">En tiempo ({counts.enTiempo})</option>
          <option value="PENDIENTES">
            Pendientes ({counts.vencidos + counts.porVencer + counts.enTiempo})
          </option>
          <option value="HECHOS">Hechos ({counts.hechos})</option>
        </select>
      </div>

      {/* PQRS List */}
      {!isFirebaseAdmin ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 py-10 px-4 text-center text-sm text-slate-500">
          Conecta tu cuenta Google autorizada en la parte superior para visualizar y gestionar las
          PQRS registradas.
        </div>
      ) : loading ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 py-10 px-4 text-center text-sm text-slate-500">
          Cargando solicitudes PQRS...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 py-10 px-4 text-center text-sm text-slate-500">
          {items.length === 0
            ? 'Aún no se han radicado solicitudes PQRS.'
            : 'No hay solicitudes que coincidan con el filtro aplicado.'}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map(({ record, deadlineMs, urgency, countdownLabel }) => {
            const isDone = record.status === 'HECHO';
            const isBusy = updatingId === record.id;

            const cardBorder =
              urgency === 'VENCIDO'
                ? 'border-red-300 bg-white'
                : urgency === 'POR_VENCER'
                ? 'border-amber-300 bg-white'
                : urgency === 'HECHO'
                ? 'border-slate-200 bg-slate-50/70'
                : 'border-slate-200 bg-white';

            const bannerStyle =
              urgency === 'VENCIDO'
                ? 'bg-red-50 border-b border-red-200 text-red-900'
                : urgency === 'POR_VENCER'
                ? 'bg-amber-50 border-b border-amber-200 text-amber-950'
                : urgency === 'HECHO'
                ? 'bg-emerald-50/70 border-b border-emerald-200 text-emerald-900'
                : 'bg-blue-50/60 border-b border-blue-100 text-blue-950';

            return (
              <article
                key={record.id}
                className={`rounded-xl border overflow-hidden transition-colors ${cardBorder}`}
              >
                {/* Top Status & Countdown Strip */}
                <div
                  className={`px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs ${bannerStyle}`}
                >
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <span className="inline-flex items-center gap-1.5 font-bold tabular-nums">
                      {urgency === 'VENCIDO' ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      ) : urgency === 'POR_VENCER' ? (
                        <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      ) : urgency === 'HECHO' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                      )}
                      <span>{countdownLabel}</span>
                    </span>
                    <span className="opacity-40" aria-hidden="true">
                      ·
                    </span>
                    <span className="font-bold tabular-nums">{record.radicado}</span>
                    <span className="opacity-40" aria-hidden="true">
                      ·
                    </span>
                    <span className="font-semibold">{record.pqrsType}</span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] font-medium tabular-nums">
                    <CalendarClock className="w-3.5 h-3.5 shrink-0 opacity-75" />
                    <span>
                      {isDone
                        ? `Marcado hecho: ${formatDateTime(record.updatedAt)}`
                        : `Vence: ${formatDeadlineDate(deadlineMs)}`}
                    </span>
                  </div>
                </div>

                {/* Body: Citizen Data & Details */}
                <div className={`p-4 sm:p-5 space-y-4 ${isDone ? 'opacity-80' : ''}`}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <h4 className="text-sm sm:text-base font-bold text-blue-950 leading-snug">
                        {record.subject}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Área: <strong className="text-slate-700">{record.area}</strong> · Radicado
                        el{' '}
                        <span className="tabular-nums font-medium text-slate-700">
                          {formatDateTime(record.createdAt)}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!isDone ? (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => onToggleStatus(record, 'HECHO')}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <Check className="w-4 h-4" />
                          <span>{isBusy ? 'Guardando...' : 'Hecho'}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => onToggleStatus(record, 'PENDIENTE')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{isBusy ? 'Actualizando...' : 'Reabrir'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => onDelete(record)}
                        aria-label={`Eliminar PQRS ${record.radicado}`}
                        className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-red-50 disabled:opacity-50 text-red-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Citizen Contact Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 rounded-lg bg-slate-50 border border-slate-200/80 p-3 text-xs">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                        <UserIcon className="w-3 h-3 shrink-0" />
                        <span>Persona</span>
                      </p>
                      <p className="font-semibold text-slate-900 mt-0.5 truncate">
                        {record.fullName}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-slate-500">Documento</p>
                      <p className="font-semibold text-slate-900 tabular-nums mt-0.5">
                        {record.documentNumber || 'No suministrado'}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                        <Mail className="w-3 h-3 shrink-0" />
                        <span>Correo</span>
                      </p>
                      <a
                        href={`mailto:${record.email}`}
                        className="font-medium text-blue-700 hover:underline mt-0.5 block truncate"
                      >
                        {record.email}
                      </a>
                    </div>

                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3 shrink-0" />
                        <span>Teléfono / WhatsApp</span>
                      </p>
                      <p className="font-semibold text-slate-900 tabular-nums mt-0.5">
                        {record.phone}
                      </p>
                    </div>
                  </div>

                  {/* Detailed Description */}
                  <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-white rounded-lg border border-slate-100 p-3">
                    {record.message}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
