export interface AuditEntry {
  id: string;
  companyId: string;
  actorId: string;
  action: string;
  subjectType: string;
  subjectId: string;
  before: unknown;
  after: unknown;
  at: string;
}
