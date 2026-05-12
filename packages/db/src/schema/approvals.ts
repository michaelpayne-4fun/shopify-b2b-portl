import {
  pgTable, text, timestamp, integer, boolean,
} from 'drizzle-orm/pg-core';

/**
 * Tables exist even when FEATURE_APPROVALS=false so flipping the flag
 * in a later release requires no migration.
 */
export const approvalRules = pgTable('approval_rules', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  subjectType: text('subject_type').notNull(), // 'order' | 'quote'
  thresholdCents: integer('threshold_cents'),
  currency: text('currency'),
  requiredPermission: text('required_permission').notNull(),
  active: boolean('active').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const approvals = pgTable('approvals', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  subjectType: text('subject_type').notNull(),
  subjectId: text('subject_id').notNull(),
  state: text('state').notNull(), // 'pending' | 'approved' | 'rejected'
  requestedBy: text('requested_by').notNull(),
  requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
  decidedBy: text('decided_by'),
  decidedAt: timestamp('decided_at', { withTimezone: true }),
  notes: text('notes'),
});
