// src/app/pages/activity-page/02-proposed-changes/admin/approval-requests/approval-requests.component.ts

import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { AppService } from 'src/app/shared/service/app.service';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

interface ApprovalRequest {
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
  
  // Relations
  tr_proposed_changes: {
    project_name: string;
    item_changes: string;
    status: string;
    progress: string;
    department: { department_name: string };
    plant: { plant_name: string };
  };
  
  mst_authorization_tr_approver_change_request_current_auth_idTomst_authorization: {
    employee_name: string;
    employee_code: string;
    email: string;
  };
  
  mst_authorization_tr_approver_change_request_new_auth_idTomst_authorization: {
    employee_name: string;
    employee_code: string;
    email: string;
  };
  
  mst_authorization_tr_approver_change_request_requester_auth_idTomst_authorization: {
    employee_name: string;
    employee_code: string;
    email: string;
  };
  
  tr_proposed_changes_approval_tr_approver_change_request_approval_idTotr_proposed_changes_approval: {
    step: number;
    actor: string;
    status: string;
  };
}

interface PaginationData {
  current_page: number;
  total_pages: number;
  total_count: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
}

@Component({
  selector: 'app-approval-requests',
  templateUrl: './approval-requests.component.html',
  styleUrls: ['./approval-requests.component.scss']
})
export class ApprovalRequestsComponent implements OnInit {
  @ViewChild('processModal', { static: false }) processModal!: TemplateRef<any>;
  @ViewChild('detailModal', { static: false }) detailModal!: TemplateRef<any>;

  // Properties
  loading = true;
  requests: ApprovalRequest[] = [];
  pagination: PaginationData = {
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    limit: 10,
    has_next: false,
    has_prev: false
  };

  // Form dan Modal
  processForm!: FormGroup;
  selectedRequest: ApprovalRequest | null = null;
  currentUser: any;

  // Filter dan Search
  searchTerm = '';
  priorityFilter = '';
  statusFilter = 'pending';

  // Priority dan Status options
  priorityOptions = [
    { value: '', label: 'Semua Priority' },
    { value: 'low', label: 'Low' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: '', label: 'Semua Status' }
  ];

  // Expose Math to template
  Math = Math;

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private service: AppService,
    private tokenService: TokenStorageService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.currentUser = this.tokenService.getUser();
    this.checkAdminAccess();
    this.loadRequests();
  }

  initializeForm(): void {
    this.processForm = this.fb.group({
      status: ['', Validators.required],
      admin_decision: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  checkAdminAccess(): void {
    const userRole = this.currentUser?.user_role || this.currentUser?.role?.role_name;
    if (!['admin', 'Admin', 'Super Admin'].includes(userRole)) {
      Swal.fire({
        icon: 'error',
        title: 'Akses Ditolak',
        text: 'Anda tidak memiliki akses ke halaman ini',
        confirmButtonText: 'OK'
      }).then(() => {
        window.history.back();
      });
    }
  }

  loadRequests(page: number = 1): void {
    this.loading = true;
    
    const params: any = {
      page: page.toString(),
      limit: this.pagination.limit.toString()
    };

    if (this.searchTerm) {
      params.search = this.searchTerm;
    }

    if (this.priorityFilter) {
      params.priority = this.priorityFilter;
    }

    // Hanya tambahkan status filter jika bukan "semua"
    if (this.statusFilter && this.statusFilter !== '') {
      params.status = this.statusFilter;
    }

    this.service.get('/approver-change/pending', params)
      .pipe(
        catchError(error => {
          console.error('Error loading requests:', error);
          this.showToast('Error memuat data request', 'error');
          return of({ data: [], pagination: this.pagination });
        }),
        finalize(() => this.loading = false)
      )
      .subscribe(response => {
        if (response && response.data) {
          this.requests = response.data;
          this.pagination = response.pagination || this.pagination;
        }
      });
  }

  onSearch(): void {
    this.pagination.current_page = 1;
    this.loadRequests(1);
  }

  onFilterChange(): void {
    this.pagination.current_page = 1;
    this.loadRequests(1);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.pagination.total_pages) {
      this.loadRequests(page);
    }
  }

  viewDetail(request: ApprovalRequest): void {
    this.selectedRequest = request;
    this.modalService.open(this.detailModal, { size: 'xl', centered: true });
  }

  // Method untuk format perbandingan data
  getChangeComparison(request: ApprovalRequest) {
    return {
      before: {
        approver_name: request.mst_authorization_tr_approver_change_request_current_auth_idTomst_authorization.employee_name,
        approver_code: request.mst_authorization_tr_approver_change_request_current_auth_idTomst_authorization.employee_code,
        approver_email: request.mst_authorization_tr_approver_change_request_current_auth_idTomst_authorization.email
      },
      after: {
        approver_name: request.mst_authorization_tr_approver_change_request_new_auth_idTomst_authorization.employee_name,
        approver_code: request.mst_authorization_tr_approver_change_request_new_auth_idTomst_authorization.employee_code,
        approver_email: request.mst_authorization_tr_approver_change_request_new_auth_idTomst_authorization.email
      },
      step_info: {
        step_number: request.tr_proposed_changes_approval_tr_approver_change_request_approval_idTotr_proposed_changes_approval.step,
        step_actor: request.tr_proposed_changes_approval_tr_approver_change_request_approval_idTotr_proposed_changes_approval.actor,
        current_status: request.tr_proposed_changes_approval_tr_approver_change_request_approval_idTotr_proposed_changes_approval.status
      }
    };
  }

  processRequest(request: ApprovalRequest): void {
    this.selectedRequest = request;
    this.processForm.reset();
    this.modalService.open(this.processModal, { size: 'lg', centered: true });
  }

  onSubmitProcess(): void {
    if (this.processForm.valid && this.selectedRequest) {
      const formData = this.processForm.value;
      
      Swal.fire({
        title: 'Konfirmasi',
        text: `Apakah Anda yakin ingin ${formData.status === 'approved' ? 'menyetujui' : 'menolak'} request ini?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Ya, Proses',
        cancelButtonText: 'Batal',
        confirmButtonColor: formData.status === 'approved' ? '#28a745' : '#dc3545'
      }).then((result) => {
        if (result.isConfirmed) {
          this.submitProcessRequest(formData);
        }
      });
    } else {
      this.markFormGroupTouched(this.processForm);
    }
  }

  private submitProcessRequest(formData: any): void {
    this.loading = true;
    
    this.service.patch(`/approver-change/${this.selectedRequest!.id}/process`, formData)
      .pipe(
        catchError(error => {
          console.error('Error processing request:', error);
          this.showToast('Error memproses request', 'error');
          return of(null);
        }),
        finalize(() => this.loading = false)
      )
      .subscribe(response => {
        if (response) {
          const status = formData.status === 'approved' ? 'disetujui' : 'ditolak';
          this.showToast(`Request berhasil ${status}`, 'success');
          this.modalService.dismissAll();
          this.loadRequests(this.pagination.current_page);
        }
      });
  }

  bypassApproval(request: ApprovalRequest, targetStatus: 'approved' | 'done'): void {
    Swal.fire({
      title: 'Admin Bypass',
      text: `Masukkan alasan untuk bypass ${targetStatus === 'approved' ? 'parsial' : 'lengkap'}:`,
      input: 'textarea',
      inputPlaceholder: 'Alasan bypass...',
      inputValidator: (value) => {
        if (!value || value.length < 10) {
          return 'Alasan harus diisi minimal 10 karakter';
        }
        return null;
      },
      showCancelButton: true,
      confirmButtonText: 'Bypass',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#dc3545'
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.submitBypass(request.proposed_changes_id, targetStatus, result.value);
      }
    });
  }

  private submitBypass(proposedChangesId: number, targetStatus: 'approved' | 'done', reason: string): void {
    this.loading = true;
    
    const bypassData = {
      proposed_changes_id: proposedChangesId,
      target_status: targetStatus,
      reason: reason,
      bypass_type: 'approval_system'
    };

    this.service.post('/approver-change/bypass', bypassData)
      .pipe(
        catchError(error => {
          console.error('Error bypassing approval:', error);
          this.showToast('Error melakukan bypass', 'error');
          return of(null);
        }),
        finalize(() => this.loading = false)
      )
      .subscribe(response => {
        if (response) {
          this.showToast(`Bypass ${targetStatus} berhasil dilakukan`, 'success');
          this.loadRequests(this.pagination.current_page);
        }
      });
  }

  getPriorityClass(priority: string): string {
    const classes = {
      'low': 'badge-secondary',
      'normal': 'badge-primary',
      'high': 'badge-warning',
      'urgent': 'badge-danger'
    };
    return classes[priority as keyof typeof classes] || 'badge-secondary';
  }

  getStatusClass(status: string): string {
    const classes = {
      'pending': 'badge-warning',
      'approved': 'badge-success',
      'rejected': 'badge-danger'
    };
    return classes[status as keyof typeof classes] || 'badge-secondary';
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  private showToast(message: string, type: 'success' | 'error' | 'warning' = 'success'): void {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true
    });

    Toast.fire({
      icon: type,
      title: message
    });
  }

  // Utility methods
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.processForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
}