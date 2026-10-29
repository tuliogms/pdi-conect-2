import { pgTable, text, timestamp, uuid, jsonb, unique } from 'drizzle-orm/pg-core'

export const pdiWorkspaces = pgTable('pdi_workspaces', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentName: text('student_name').notNull().default('João da Silva'),
  roleOrder: jsonb('role_order').notNull().default(['Aluno', 'Professor', 'Família', 'Profissional da saúde']),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const pdiEntries = pgTable('pdi_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  area: text('area').notNull(),
  sectionKey: text('section_key').notNull(),
  content: text('content').notNull().default(''),
  format: text('format').notNull().default('descritivo'),
  authorName: text('author_name').notNull().default('João da Silva'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({ entryKey: unique().on(table.workspaceId, table.area, table.sectionKey, table.authorName) }))
