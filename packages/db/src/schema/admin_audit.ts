import { pgTable, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

/**
 * Append-only. Every admin write goes through withAudit(...) and lands
 * one row here. Reads are gated by `portal.admin`.
 */
export const adminAuditLog = pgTable('admin_audit_log', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  actorId: text('actor_id').notNull(),
  action: text('action').notNull(),
  subjectType: text('subject_type').notNull(),
  subjectId: text('subject_id').notNull(),
  before: jsonb('before'),
  after: jsonb('after'),
  at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
});
