export type ApprovalState = 'pending' | 'approved' | 'rejected';

export interface Approval {
  id: string;
  subjectType: 'order' | 'quote';
  subjectId: string;
  state: ApprovalState;
  requestedBy: string;
  requestedAt: string;
  decidedBy?: string;
  decidedAt?: string;
  notes?: string;
}
