import type { Money } from './money';

export type ApprovalState = 'pending' | 'approved' | 'rejected';
export type ApprovalSubjectType = 'order' | 'quote';

export interface Approval {
  id: string;
  companyId: string;
  subjectType: ApprovalSubjectType;
  subjectId: string;
  state: ApprovalState;
  requestedBy: string;
  requestedAt: string;
  decidedBy?: string;
  decidedAt?: string;
  notes?: string;
}

export interface ApprovalRule {
  id: string;
  companyId: string;
  subjectType: ApprovalSubjectType;
  thresholdMoney?: Money;
  requiredPermission: 'approvals.act';
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
