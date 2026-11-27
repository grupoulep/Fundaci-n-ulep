import { db } from './index.ts';
import { users } from './schema.ts';

export const PRIMARY_ADMIN_EMAIL = 'grupoulep@gmail.com';

export async function getOrCreateUser(uid: string, email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const role = normalizedEmail === PRIMARY_ADMIN_EMAIL ? 'admin' : 'user';
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email: normalizedEmail,
        role,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: normalizedEmail,
          role,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Failed to synchronize user record:', error);
    throw new Error('No se pudo sincronizar el usuario. Intenta nuevamente.', { cause: error });
  }
}
