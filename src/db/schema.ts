import { boolean, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Authenticated Firebase users synchronized with PostgreSQL
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  role: text('role').notNull().default('user'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Payment consultation records indexed by unique cedula
export const paymentQueries = pgTable('payment_queries', {
  id: serial('id').primaryKey(),
  cedula: text('cedula').notNull().unique(),
  reference: text('reference').notNull(),
  amount: text('amount').notNull().default(''),
  concept: text('concept').notNull().default(''),
  isPaid: boolean('is_paid').notNull().default(false),
  hasDueDate: boolean('has_due_date').notNull().default(false),
  dueDate: text('due_date').notNull().default(''),
  updatedBy: text('updated_by').notNull().default('admin'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Published Paz y Salvo certificates with download link and expandable description
export const pazYSalvos = pgTable('paz_y_salvos', {
  id: serial('id').primaryKey(),
  registrationNumber: text('registration_number').notNull(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  downloadUrl: text('download_url').notNull(),
  isPublished: boolean('is_published').notNull().default(true),
  createdBy: text('created_by').notNull().default('admin'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Optional first-run hashed admin credentials (overridden when env vars are configured)
export const adminCredentials = pgTable('admin_credentials', {
  id: serial('id').primaryKey(),
  slotKey: text('slot_key').notNull().unique(),
  salt: text('salt').notNull(),
  usernameHash: text('username_hash').notNull(),
  passwordHash: text('password_hash').notNull(),
  claimedAt: timestamp('claimed_at').defaultNow().notNull(),
});

// Immutable audit log tracking every create, edit, status change, delete, bulk import, and session event
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  action: text('action').notNull(),
  module: text('module').notNull(),
  targetKey: text('target_key').notNull(),
  actor: text('actor').notNull().default('admin'),
  summary: text('summary').notNull(),
  details: text('details').notNull().default(''),
  ipAddress: text('ip_address').notNull().default(''),
  location: text('location').notNull().default(''),
  deviceInfo: text('device_info').notNull().default(''),
  userAgent: text('user_agent').notNull().default(''),
  timezone: text('timezone').notNull().default(''),
  locale: text('locale').notNull().default(''),
  screenInfo: text('screen_info').notNull().default(''),
  requestMethod: text('request_method').notNull().default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
