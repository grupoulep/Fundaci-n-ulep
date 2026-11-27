import { desc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import { adminCredentials, auditLogs, paymentQueries, pazYSalvos } from './schema.ts';

export interface PaymentUpsertInput {
  cedula: string;
  reference: string;
  amount: string;
  concept: string;
  isPaid: boolean;
  hasDueDate: boolean;
  dueDate: string;
  updatedBy: string;
}

export interface PazYSalvoInput {
  registrationNumber: string;
  name: string;
  description: string;
  downloadUrl: string;
  isPublished: boolean;
  createdBy?: string;
}

export interface AuditLogInput {
  action:
    | 'CREAR'
    | 'EDITAR'
    | 'CAMBIAR_ESTADO'
    | 'ELIMINAR'
    | 'CARGA_MASIVA'
    | 'EXPORTAR'
    | 'INICIO_SESION'
    | 'CIERRE_SESION';
  module: 'PAGOS' | 'PAZ_Y_SALVO' | 'ACCESO' | 'AUDITORIA';
  targetKey: string;
  actor: string;
  summary: string;
  details?: string;
  ipAddress?: string;
  location?: string;
  deviceInfo?: string;
  userAgent?: string;
  timezone?: string;
  locale?: string;
  screenInfo?: string;
  requestMethod?: string;
}

export async function recordAuditLog(input: AuditLogInput) {
  try {
    const rows = await db
      .insert(auditLogs)
      .values({
        action: input.action,
        module: input.module,
        targetKey: input.targetKey.slice(0, 120),
        actor: (input.actor || 'admin').slice(0, 120),
        summary: input.summary.slice(0, 300),
        details: (input.details ?? '').slice(0, 1000),
        ipAddress: (input.ipAddress ?? '').slice(0, 80),
        location: (input.location ?? '').slice(0, 200),
        deviceInfo: (input.deviceInfo ?? '').slice(0, 160),
        userAgent: (input.userAgent ?? '').slice(0, 300),
        timezone: (input.timezone ?? '').slice(0, 80),
        locale: (input.locale ?? '').slice(0, 40),
        screenInfo: (input.screenInfo ?? '').slice(0, 40),
        requestMethod: (input.requestMethod ?? '').slice(0, 120),
      })
      .returning();
    return rows[0] ?? null;
  } catch (error) {
    console.error('Database mutation failed (recordAuditLog):', error);
    return null;
  }
}

export async function listAuditLogs(limitCount = 200) {
  try {
    const safeLimit = Math.min(Math.max(1, limitCount), 500);
    return await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
      .limit(safeLimit);
  } catch (error) {
    console.error('Database query failed (listAuditLogs):', error);
    throw new Error('No se pudo cargar el historial de auditoría.', { cause: error });
  }
}

export async function getPaymentByCedula(cedula: string) {
  try {
    const rows = await db
      .select()
      .from(paymentQueries)
      .where(eq(paymentQueries.cedula, cedula))
      .limit(1);
    return rows[0] ?? null;
  } catch (error) {
    console.error('Database query failed (getPaymentByCedula):', error);
    throw new Error('No se pudo consultar el estado de pago. Intenta nuevamente.', {
      cause: error,
    });
  }
}

export async function listPayments() {
  try {
    return await db
      .select()
      .from(paymentQueries)
      .orderBy(desc(paymentQueries.updatedAt));
  } catch (error) {
    console.error('Database query failed (listPayments):', error);
    throw new Error('No se pudieron cargar los pagos registrados.', { cause: error });
  }
}

export async function upsertPayment(input: PaymentUpsertInput) {
  try {
    const now = new Date();
    const rows = await db
      .insert(paymentQueries)
      .values({
        cedula: input.cedula,
        reference: input.reference,
        amount: input.amount,
        concept: input.concept,
        isPaid: input.isPaid,
        hasDueDate: input.hasDueDate,
        dueDate: input.dueDate,
        updatedBy: input.updatedBy,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: paymentQueries.cedula,
        set: {
          reference: input.reference,
          amount: input.amount,
          concept: input.concept,
          isPaid: input.isPaid,
          hasDueDate: input.hasDueDate,
          dueDate: input.dueDate,
          updatedBy: input.updatedBy,
          updatedAt: now,
        },
      })
      .returning();

    return rows[0];
  } catch (error) {
    console.error('Database mutation failed (upsertPayment):', error);
    throw new Error('No se pudo guardar el registro de pago.', { cause: error });
  }
}

export async function togglePaymentPaid(cedula: string, updatedBy: string) {
  try {
    const existing = await getPaymentByCedula(cedula);
    if (!existing) return null;

    const rows = await db
      .update(paymentQueries)
      .set({
        isPaid: !existing.isPaid,
        updatedBy,
        updatedAt: new Date(),
      })
      .where(eq(paymentQueries.cedula, cedula))
      .returning();

    return rows[0] ? { previous: existing, updated: rows[0] } : null;
  } catch (error) {
    console.error('Database mutation failed (togglePaymentPaid):', error);
    throw new Error('No se pudo actualizar el estado del pago.', { cause: error });
  }
}

export async function deletePaymentByCedula(cedula: string) {
  try {
    const rows = await db
      .delete(paymentQueries)
      .where(eq(paymentQueries.cedula, cedula))
      .returning();
    return rows[0] ?? null;
  } catch (error) {
    console.error('Database mutation failed (deletePaymentByCedula):', error);
    throw new Error('No se pudo eliminar el registro de pago.', { cause: error });
  }
}

export async function getPazYSalvoById(id: number) {
  try {
    const rows = await db
      .select()
      .from(pazYSalvos)
      .where(eq(pazYSalvos.id, id))
      .limit(1);
    return rows[0] ?? null;
  } catch (error) {
    console.error('Database query failed (getPazYSalvoById):', error);
    throw new Error('No se pudo consultar el Paz y Salvo.', { cause: error });
  }
}

export async function listPublishedPazYSalvos() {
  try {
    return await db
      .select()
      .from(pazYSalvos)
      .where(eq(pazYSalvos.isPublished, true))
      .orderBy(desc(pazYSalvos.createdAt));
  } catch (error) {
    console.error('Database query failed (listPublishedPazYSalvos):', error);
    throw new Error('No se pudo cargar el listado de Paz y Salvo.', { cause: error });
  }
}

export async function listAllPazYSalvos() {
  try {
    return await db
      .select()
      .from(pazYSalvos)
      .orderBy(desc(pazYSalvos.createdAt));
  } catch (error) {
    console.error('Database query failed (listAllPazYSalvos):', error);
    throw new Error('No se pudo cargar los registros de Paz y Salvo.', { cause: error });
  }
}

export async function createPazYSalvo(input: PazYSalvoInput) {
  try {
    const now = new Date();
    const rows = await db
      .insert(pazYSalvos)
      .values({
        registrationNumber: input.registrationNumber,
        name: input.name,
        description: input.description,
        downloadUrl: input.downloadUrl,
        isPublished: input.isPublished,
        createdBy: input.createdBy || 'admin',
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return rows[0];
  } catch (error) {
    console.error('Database mutation failed (createPazYSalvo):', error);
    throw new Error('No se pudo registrar el Paz y Salvo.', { cause: error });
  }
}

export async function updatePazYSalvo(id: number, input: PazYSalvoInput) {
  try {
    const rows = await db
      .update(pazYSalvos)
      .set({
        registrationNumber: input.registrationNumber,
        name: input.name,
        description: input.description,
        downloadUrl: input.downloadUrl,
        isPublished: input.isPublished,
        updatedAt: new Date(),
      })
      .where(eq(pazYSalvos.id, id))
      .returning();
    return rows[0] ?? null;
  } catch (error) {
    console.error('Database mutation failed (updatePazYSalvo):', error);
    throw new Error('No se pudo actualizar el Paz y Salvo.', { cause: error });
  }
}

export async function deletePazYSalvoById(id: number) {
  try {
    const rows = await db
      .delete(pazYSalvos)
      .where(eq(pazYSalvos.id, id))
      .returning();
    return rows[0] ?? null;
  } catch (error) {
    console.error('Database mutation failed (deletePazYSalvoById):', error);
    throw new Error('No se pudo eliminar el Paz y Salvo.', { cause: error });
  }
}

const PRIMARY_CREDENTIAL_SLOT = 'primary_admin';

export async function getStoredAdminCredentials() {
  try {
    const rows = await db
      .select()
      .from(adminCredentials)
      .where(eq(adminCredentials.slotKey, PRIMARY_CREDENTIAL_SLOT))
      .limit(1);
    return rows[0] ?? null;
  } catch (error) {
    console.error('Database query failed (getStoredAdminCredentials):', error);
    throw new Error('Error al consultar la configuración de acceso.', { cause: error });
  }
}

export async function claimAdminCredentialsOnce(
  salt: string,
  usernameHash: string,
  passwordHash: string
): Promise<boolean> {
  try {
    const inserted = await db
      .insert(adminCredentials)
      .values({
        slotKey: PRIMARY_CREDENTIAL_SLOT,
        salt,
        usernameHash,
        passwordHash,
      })
      .onConflictDoNothing({ target: adminCredentials.slotKey })
      .returning();

    return inserted.length > 0;
  } catch (error) {
    console.error('Database mutation failed (claimAdminCredentialsOnce):', error);
    throw new Error('No se pudieron guardar las credenciales iniciales.', { cause: error });
  }
}
