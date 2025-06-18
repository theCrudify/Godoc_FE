// src/app/pages/activity-page/02-proposed-changes/admin/approval-requests-detail/approval-requests-detail.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { AppService } from 'src/app/shared/service/app.service';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';
import { of, Subject, Subscription } from 'rxjs';
import { catchError, finalize, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { trigger, transition, style, animate } from '@angular/animations';

interface ApprovalRequest {
  id: number;
  proposed_changes_id: number;
  approval_id: number;
  current_auth_id: number;
  new_auth_id: number;
  reason: string;
  urgent: boolean;
  priority: string;
  status: string;
  created_date: string;
  processed_date?: string;
  processed_by?: string;
  admin_decision?: string;
  tr_proposed_changes?: any;
  mst_authorization_tr_approver_change_request_current_auth_idTomst_authorization?: any;
  mst_authorization_tr_approver_change_request_new_auth_idTomst_authorization?: any;
  mst_authorization_tr_approver_change_request_requester_auth_idTomst_authorization?: any;
  tr_proposed_changes_approval_tr_approver_change_request_approval_idTotr_proposed_changes_approval?: any;
}

interface ProjectSummary {
  proposed_changes_id: number;
  project_info: any;
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  total_count: number;
}

@Component({
  selector: 'app-approval-requests-detail',
  templateUrl: './approval-requests-detail.component.html',
  styleUrls: ['./approval-requests-detail.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-in', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(-10%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 })),
      ]),
    ]),
    trigger('cardHover', [
      transition(':enter', [
        style({ transform: 'scale(0.95)', opacity: 0 }),
        animate('200ms ease-out', style({ transform: 'scale(1)', opacity: 1 })),
      ]),
    ]),
  ],
})
export class ApprovalRequestsDetailComponent implements OnInit, OnDestroy {
  // Route params
  proposedChangesId: number = 0;
  
  // Data
  requestList: ApprovalRequest[] = [];
  proposedChangesData: any = null;
  summary: ProjectSummary = {
    proposed_changes_id: 0,
    project_info: null,
    pending_count: 0,
    approved_count: 0,
    rejected_count: 0,
    total_count: 0
  };
  
  GodocUser: any;
  breadCrumbItems!: Array<{}>;

  // Filter and Search
  statusFilter = 'pending';
  searchTerm = '';
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  // State Management
  loading = false;
  processingRequestId: number | null = null;
  showProcessedRequests = false;
  
  // Subscriptions
  private routeSubscription?: Subscription;

  // Pagination (for future use)
  currentPage = 1;
  itemsPerPage = 10;

  constructor(
    private service: AppService,
    private tokenStorage: TokenStorageService,
    private router: Router,
    private route: ActivatedRoute,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    // ============ ENHANCED DEBUGGING ============
    console.log('🔍 [COMPONENT] Starting ApprovalRequestsDetailComponent ngOnInit');
    
    // Debug storage - periksa semua kemungkinan lokasi data
    
    // Debug manual storage check
    console.log('🔍 [STORAGE] Manual check:', {
      localStorage_token: localStorage.getItem('token'),
      localStorage_user: localStorage.getItem('user'),
      sessionStorage_token: sessionStorage.getItem('auth-token'),
      sessionStorage_user: sessionStorage.getItem('auth-user'),
      // Check berbagai kemungkinan key
      alt_keys: {
        'authToken': localStorage.getItem('authToken'),
        'currentUser': localStorage.getItem('currentUser'),
        'userData': localStorage.getItem('userData')
      }
    });

    // Get user data
    this.GodocUser = this.tokenStorage.getUser();
    
    console.log('🔍 [USER] Current user data:', this.GodocUser);
    console.log('🔍 [USER] User type check:', {
      isNull: this.GodocUser === null,
      isUndefined: this.GodocUser === undefined,
      type: typeof this.GodocUser,
      keys: this.GodocUser ? Object.keys(this.GodocUser) : null
    });

    // ============ ROLE DETECTION WITH FALLBACKS ============
    let roleName = null;
    
    if (this.GodocUser) {
      // Try multiple possible role field locations
      roleName = this.GodocUser?.role?.role_name || 
                 this.GodocUser?.user_role || 
                 this.GodocUser?.role_name ||
                 this.GodocUser?.userRole ||
                 this.GodocUser?.roleInfo?.name;
    }
    
    console.log('🔍 [ROLE] Role detection:', {
      'role?.role_name': this.GodocUser?.role?.role_name,
      'user_role': this.GodocUser?.user_role,
      'role_name': this.GodocUser?.role_name,
      'userRole': this.GodocUser?.userRole,
      'roleInfo?.name': this.GodocUser?.roleInfo?.name,
      'final_role': roleName
    });

    // ============ ADMIN ACCESS VALIDATION ============
    if (!roleName || !['Admin', 'Super Admin', 'admin'].includes(roleName)) {
      console.warn('❌ [ACCESS] Access denied. Details:', {
        roleName: roleName,
        userObject: this.GodocUser,
        allowedRoles: ['Admin', 'Super Admin', 'admin']
      });
      
      // Show error message before redirecting
      Swal.fire({
        title: 'Access Denied',
        text: 'You do not have admin privileges to access this page.',
        icon: 'error',
        confirmButtonText: 'OK'
      }).then(() => {
        this.router.navigate(['/activity-page/notfound']);
      });
      return;
    }

    console.log('✅ [ACCESS] Admin access granted for role:', roleName);

    // ============ CONTINUE WITH COMPONENT INITIALIZATION ============
    this.setupSearchDebounce();

    // Get proposed changes ID from route
    this.routeSubscription = this.route.params.subscribe(params => {
      this.proposedChangesId = Number(params['id']);
      console.log('🔍 [ROUTE] Proposed Changes ID:', this.proposedChangesId);
      
      if (this.proposedChangesId && !isNaN(this.proposedChangesId)) {
        this.initBreadcrumbs();
        this.loadApprovalRequests();
      } else {
        console.warn('❌ [ROUTE] Invalid proposed changes ID:', params['id']);
        this.router.navigate(['/activity-page/admin-proposed']);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  private setupSearchDebounce(): void {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.loadApprovalRequests();
    });
  }

  initBreadcrumbs(): void {
    this.breadCrumbItems = [
      { label: 'Admin Panel' },
      { label: 'Proposed Changes', link: '/activity-page/admin-proposed' },
      { label: 'Approval Requests', link: '/activity-page/proposed-changes/admin/approval-requests' },
      { label: `Request Details`, active: true }
    ];
  }

  loadApprovalRequests(): void {
    this.loading = true;
    
    // FIXED: Gunakan endpoint yang benar sesuai dengan backend
    let url = `/approver-change/by-proposed/${this.proposedChangesId}`;
    
    const params: string[] = [];
    
    if (this.statusFilter) {
      params.push(`status=${this.statusFilter}`);
    }
    
    if (this.searchTerm.trim()) {
      params.push(`search=${encodeURIComponent(this.searchTerm.trim())}`);
    }
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    console.log('🔍 [API] Loading approval requests from URL:', url);

    // Debug: Check if token is being sent
    const token = this.tokenStorage.getToken();
    console.log('🔍 [API] Token for request:', {
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'No token'
    });

    this.service.get(url).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: (result: any) => {
        this.requestList = result.data || [];
        this.summary = result.summary || this.summary;
        this.proposedChangesData = result.summary?.project_info || null;
        
        console.log('✅ [API] Approval requests by proposed ID loaded:', {
          requests: this.requestList,
          summary: this.summary,
          projectData: this.proposedChangesData
        });
      },
      error: (error) => {
        console.error('❌ [API] Error loading approval requests:', error);
        
        // Enhanced error logging
        console.error('❌ [API] Error details:', {
          status: error.status,
          message: error.message,
          error: error.error,
          url: url,
          hasToken: !!this.tokenStorage.getToken()
        });
        
        this.handleError(error, 'Error fetching approval requests');
      }
    });
  }

  onSearch(): void {
    this.searchSubject.next(this.searchTerm);
  }

  onStatusFilterChange(): void {
    this.loadApprovalRequests();
  }

  toggleProcessedRequests(): void {
    this.showProcessedRequests = !this.showProcessedRequests;
    this.statusFilter = this.showProcessedRequests ? '' : 'pending';
    this.loadApprovalRequests();
  }

  processRequest(requestId: number, status: 'approved' | 'rejected'): void {
    const request = this.requestList.find(r => r.id === requestId);
    if (!request) {
      Swal.fire('Error', 'Request tidak ditemukan', 'error');
      return;
    }

    const action = status === 'approved' ? 'menyetujui' : 'menolak';
    const title = status === 'approved' ? 'Approve Request' : 'Reject Request';
    const confirmButtonText = status === 'approved' ? 'Ya, Approve!' : 'Ya, Reject!';
    const confirmButtonColor = status === 'approved' ? '#28a745' : '#dc3545';

    Swal.fire({
      title: title,
      html: `
        <div class="text-start mb-3">
          <div class="card">
            <div class="card-header bg-light">
              <h6 class="mb-0 text-primary">${this.proposedChangesData?.project_name || 'N/A'}</h6>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <small class="text-muted">From Approver:</small>
                  <div class="fw-bold">${request.mst_authorization_tr_approver_change_request_current_auth_idTomst_authorization?.employee_name || 'N/A'}</div>
                  <small class="text-muted">(${request.mst_authorization_tr_approver_change_request_current_auth_idTomst_authorization?.employee_code || 'N/A'})</small>
                </div>
                <div class="col-md-6">
                  <small class="text-muted">To Approver:</small>
                  <div class="fw-bold text-success">${request.mst_authorization_tr_approver_change_request_new_auth_idTomst_authorization?.employee_name || 'N/A'}</div>
                  <small class="text-muted">(${request.mst_authorization_tr_approver_change_request_new_auth_idTomst_authorization?.employee_code || 'N/A'})</small>
                </div>
              </div>
              <div class="mt-2">
                <small class="text-muted">Approval Step:</small>
                <span class="badge bg-info ms-1">Step ${request.tr_proposed_changes_approval_tr_approver_change_request_approval_idTotr_proposed_changes_approval?.step || 'N/A'} (${request.tr_proposed_changes_approval_tr_approver_change_request_approval_idTotr_proposed_changes_approval?.actor || 'N/A'})</span>
              </div>
              <div class="mt-2">
                <small class="text-muted">Requested by:</small>
                <div class="fw-semibold">${request.mst_authorization_tr_approver_change_request_requester_auth_idTomst_authorization?.employee_name || 'N/A'}</div>
              </div>
              <div class="mt-2">
                <small class="text-muted">Reason:</small>
                <div class="border p-2 rounded bg-light">${request.reason || 'N/A'}</div>
              </div>
              ${request.urgent ? '<div class="mt-2"><span class="badge bg-danger">URGENT REQUEST</span></div>' : ''}
            </div>
          </div>
        </div>
        <div class="mt-3">
          <label for="adminDecision" class="form-label"><strong>Admin Decision:</strong></label>
          <textarea id="adminDecision" class="form-control" rows="3" placeholder="Masukkan keputusan admin dan alasan ${action} request ini..."></textarea>
          <small class="text-muted">Keputusan ini akan dikirim ke requester dan dicatat dalam sistem.</small>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: confirmButtonColor,
      cancelButtonColor: '#6c757d',
      confirmButtonText: confirmButtonText,
      cancelButtonText: 'Batal',
      width: '700px',
      customClass: {
        popup: 'swal-custom-popup'
      },
      preConfirm: () => {
        const adminDecision = (document.getElementById('adminDecision') as HTMLTextAreaElement)?.value;
        if (!adminDecision || adminDecision.trim() === '') {
          Swal.showValidationMessage('Admin decision wajib diisi!');
          return false;
        }
        if (adminDecision.trim().length < 10) {
          Swal.showValidationMessage('Admin decision minimal 10 karakter!');
          return false;
        }
        return adminDecision.trim();
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.submitProcessRequest(requestId, status, result.value);
      }
    });
  }

  private submitProcessRequest(requestId: number, status: 'approved' | 'rejected', adminDecision: string): void {
    this.processingRequestId = requestId;
    
    const payload = {
      status: status,
      admin_decision: adminDecision
    };

    // FIXED: Gunakan endpoint yang benar untuk processing
    const processUrl = `/approver-change/${requestId}/process`;
    console.log('🔧 [API] Processing request via URL:', processUrl);

    this.service.patch(processUrl, payload).pipe(
      finalize(() => this.processingRequestId = null)
    ).subscribe({
      next: (response: any) => {
        const successMessage = status === 'approved' 
          ? 'Request berhasil disetujui! Approver telah diubah.' 
          : 'Request berhasil ditolak! Approver tetap tidak berubah.';
        
        Swal.fire({
          title: 'Success!',
          text: successMessage,
          icon: 'success',
          timer: 3000,
          showConfirmButton: true
        });
        
        this.loadApprovalRequests(); // Refresh data
      },
      error: (error) => {
        console.error('❌ [API] Error processing request:', error);
        this.handleError(error, `Error ${status === 'approved' ? 'approving' : 'rejecting'} request`);
      }
    });
  }

  viewProposedChangesDetail(): void {
    this.router.navigate(['/activity-page/proposedchanges-detail', this.proposedChangesId]);
  }

  goBackToApprovalRequests(): void {
    this.router.navigate(['/activity-page/proposed-changes/admin/approval-requests']);
  }

  goBackToAdminList(): void {
    this.router.navigate(['/activity-page/admin-proposed']);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'bg-warning text-dark';
      case 'approved':
        return 'bg-success text-white';
      case 'rejected':
        return 'bg-danger text-white';
      default:
        return 'bg-secondary text-white';
    }
  }

  getPriorityBadgeClass(priority: string, urgent: boolean = false): string {
    if (urgent) return 'bg-danger text-white animate-pulse';
    
    switch (priority) {
      case 'high':
        return 'bg-warning text-dark';
      case 'normal':
        return 'bg-info text-white';
      case 'low':
        return 'bg-light text-dark';
      default:
        return 'bg-secondary text-white';
    }
  }

  getProjectStatusBadgeClass(status: string): string {
    switch (status) {
      case 'approved':
      case 'done':
        return 'bg-success text-white';
      case 'rejected':
        return 'bg-danger text-white';
      case 'pending':
        return 'bg-warning text-dark';
      case 'not_approved':
        return 'bg-orange text-white';
      case 'submitted':
        return 'bg-primary text-white';
      default:
        return 'bg-info text-white';
    }
  }

  formatDate(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDateShort(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  refreshData(): void {
    this.loadApprovalRequests();
  }

  exportData(): void {
    // Implementation for exporting data
    Swal.fire({
      title: 'Export Data',
      text: 'Fitur export akan segera tersedia',
      icon: 'info'
    });
  }

  getFilteredRequests(): ApprovalRequest[] {
    let filtered = [...this.requestList];
    
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(request => 
        request.reason?.toLowerCase().includes(term) ||
        request.mst_authorization_tr_approver_change_request_current_auth_idTomst_authorization?.employee_name?.toLowerCase().includes(term) ||
        request.mst_authorization_tr_approver_change_request_new_auth_idTomst_authorization?.employee_name?.toLowerCase().includes(term) ||
        request.mst_authorization_tr_approver_change_request_requester_auth_idTomst_authorization?.employee_name?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }

  getPaginatedRequests(): ApprovalRequest[] {
    const filtered = this.getFilteredRequests();
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return filtered.slice(startIndex, startIndex + this.itemsPerPage);
  }

  getTotalPages(): number {
    return Math.ceil(this.getFilteredRequests().length / this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
    }
  }

  handleError(error: any, defaultMessage: string): void {
    let errorMessage = defaultMessage;

    console.error('❌ [ERROR] Full error object:', error);

    if (error.status === 0) {
      errorMessage = 'Cannot connect to server. Please ensure the server is running.';
    } else if (error.status === 401) {
      errorMessage = 'Authentication failed. Please login again.';
      
      // Clear storage and redirect to login
      this.tokenStorage.signOut();
      setTimeout(() => {
        this.router.navigate(['/auth/login']);
      }, 2000);
      
    } else if (error.status === 403) {
      errorMessage = 'Access denied. You do not have permission to access this resource.';
      
      // Log debug info for 403 errors
      if (error.error?.debug) {
        console.error('❌ [ERROR] Auth Debug Info:', error.error.debug);
      }
      
      // Show detailed error for debugging
      console.error('❌ [ERROR] 403 Details:', {
        userRole: this.GodocUser?.role?.role_name,
        userObject: this.GodocUser,
        token: this.tokenStorage.getToken() ? 'Present' : 'Missing'
      });
      
      // Redirect to login if unauthorized
      setTimeout(() => {
        this.router.navigate(['/auth/login']);
      }, 2000);
      
    } else if (error.error) {
      if (error.error.message) {
        errorMessage = error.error.message;
      } else if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.error.errors) {
        errorMessage = Object.entries(error.error.errors)
          .map(([field, messages]) => {
            const messageArray = Array.isArray(messages) ? messages : [String(messages)];
            return `${field}: ${messageArray.join(', ')}`;
          })
          .join('\n');
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    Swal.fire({
      title: 'Error',
      text: errorMessage,
      icon: 'error',
      confirmButtonText: 'OK'
    });
  }
}