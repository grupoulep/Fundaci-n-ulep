import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Briefcase,
  Building2,
  CalendarClock,
  Download,
  Mail,
  Phone,
  Search,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import type { EmpresaSubmissionRecord } from '../security/firestoreForms';

interface AdminEmpresaSectionProps {
  items: EmpresaSubmissionRecord[];
  loading: boolean;
  error: string;
  isFirebaseAdmin: boolean;
  deletingId: string | null;
  onDelete: (record: EmpresaSubmissionRecord) => void;
  onExportCsv: (rows: EmpresaSubmissionRecord[]) => void;
  formatDateTime: (isoStr: string) => string;
}

export default function AdminEmpresaSection({
  items,
  loading,
  error,
  isFirebaseAdmin,
  deletingId,
  onDelete,
  onExportCsv,
  formatDateTime,
}: AdminEmpresaSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.companyName.toLowerCase().includes(q) ||
        item.nit.toLowerCase().includes(q) ||
        item.contactName.toLowerCase().includes(q) ||
        item.role.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.phone.toLowerCase().includes(q) ||
        item.requestType.toLowerCase().includes(q) ||
        item.details.toLowerCase().includes(q)
    );
  }, [items, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h3 className="text-lg sm:text-xl font-extrabold text-blue-950">
            Formularios de Empresas ({items.length})
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Encuestas y solicitudes de vinculación enviadas por empresas con fecha y hora exacta de
            registro.
          </p>
        </div>

        <button
          type="button"
          disabled={filteredItems.length === 0}
          onClick={() => onExportCsv(filteredItems)}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-blue-700" />
          <span>Exportar CSV</span>
        </button>
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

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por empresa, NIT, persona de contacto, correo o tipo de convenio..."
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-700"
        />
      </div>

      {/* Submissions List */}
      {!isFirebaseAdmin ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 py-10 px-4 text-center text-sm text-slate-500">
          Conecta tu cuenta Google autorizada en la parte superior para visualizar los formularios
          enviados por empresas.
        </div>
      ) : loading ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 py-10 px-4 text-center text-sm text-slate-500">
          Cargando formularios empresariales...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 py-10 px-4 text-center text-sm text-slate-500">
          {items.length === 0
            ? 'Aún no hay formularios registrados por empresas.'
            : 'No se encontraron formularios que coincidan con la búsqueda.'}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((record) => {
            const isDeleting = deletingId === record.id;
            return (
              <article
                key={record.id}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden"
              >
                {/* Date & Time Header Strip */}
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-blue-950">
                    <Building2 className="w-4 h-4 text-blue-700 shrink-0" />
                    <span>{record.companyName}</span>
                    {record.nit && (
                      <>
                        <span className="text-slate-300" aria-hidden="true">
                          ·
                        </span>
                        <span className="font-semibold text-slate-600 tabular-nums">
                          NIT {record.nit}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 font-semibold text-blue-800 tabular-nums">
                    <CalendarClock className="w-3.5 h-3.5 shrink-0" />
                    <span>Enviado: {formatDateTime(record.createdAt)}</span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        Tipo de alianza, convenio o proyecto
                      </p>
                      <h4 className="text-sm sm:text-base font-bold text-blue-950 mt-0.5">
                        {record.requestType}
                      </h4>
                    </div>

                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => onDelete(record)}
                      aria-label={`Eliminar formulario de ${record.companyName}`}
                      className="self-start sm:self-center p-2 rounded-lg border border-slate-200 hover:bg-red-50 disabled:opacity-50 text-red-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Contact Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 rounded-lg bg-slate-50 border border-slate-200/80 p-3 text-xs">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                        <UserIcon className="w-3 h-3 shrink-0" />
                        <span>Contacto</span>
                      </p>
                      <p className="font-semibold text-slate-900 mt-0.5 truncate">
                        {record.contactName}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                        <Briefcase className="w-3 h-3 shrink-0" />
                        <span>Cargo o área</span>
                      </p>
                      <p className="font-semibold text-slate-900 mt-0.5 truncate">
                        {record.role || 'No especificado'}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                        <Mail className="w-3 h-3 shrink-0" />
                        <span>Correo corporativo</span>
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

                  {record.details && (
                    <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-white rounded-lg border border-slate-100 p-3">
                      {record.details}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
