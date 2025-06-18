// src/app/shared/interfaces/approval-requests.interface.ts

export interface ApprovalRequest {
  id: number;
  proposed_changes_id: number;
  approval_id: number;
  current_auth_id: number;
  new_auth_id: number;
  reason: string;
  urgent: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'approved' | 'rejected';
  created_date: string;
  admin_decision?: string;
  processed_date?: string;
  processed_by?: string;
  is_deleted: boolean;
  
  // Relations
  tr_proposed_changes: ProposedChangesInfo;
  mst_authorization_tr_approver_change_request_current_auth_idTomst_authorization: EmployeeInfo;
  mst_authorization_tr_approver_change_request_new_auth_idTomst_authorization: EmployeeInfo;
  mst_authorization_tr_approver_change_request_requester_auth_idTomst_authorization: EmployeeInfo;
  tr_proposed_changes_approval_tr_approver_change_request_approval_idTotr_proposed_changes_approval: ApprovalInfo;
}

export interface ProposedChangesInfo {
  project_name: string;
  item_changes: string;
  status: string;
  progress: string;
  department: {
    department_name: string;
  };
  plant: {
    plant_name: string;
  };
}

export interface EmployeeInfo {
  employee_name: string;
  employee_code: string;
  email: string;
}

export interface ApprovalInfo {
  step: number;
  actor: string;
  status: string;
}

export interface PaginationData {
  current_page: number;
  total_pages: number;
  total_count: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ApprovalRequestResponse {
  message: string;
  data: ApprovalRequest[];
  pagination: PaginationData;
}

export interface ApprovalRequestStats {
  pending: number;
  approved: number;
  rejected: number;
  urgent: number;
  recent_requests: number;
  total: number;
}

export interface ApprovalRequestStatsResponse {
  message: string;
  data: ApprovalRequestStats;
}

export interface ProcessRequestData {
  status: 'approved' | 'rejected';
  admin_decision: string;
}

export interface BypassApprovalData {
  proposed_changes_id: number;
  target_status: 'approved' | 'done';
  reason: string;
  bypass_type?: string;
}

export interface FilterOptions {
  search?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent' | '';
  status?: 'pending' | 'approved' | 'rejected' | '';
  page?: number;
  limit?: number;
}