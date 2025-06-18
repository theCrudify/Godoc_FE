// src/app/pages/activity-page/02-proposed-changes/admin/approval-requests/approval-requests.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { AppService } from 'src/app/shared/service/app.service';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';
import { of, Subject, Subscription } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-approval-requests',
  templateUrl: './approval-requests.component.html',
  styleUrls: ['./approval-requests.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in', style({ opacity: 1 })),
      ]),
    ]),
    trigger('listAnimation', [
      transition(':enter', [
        style({ transform: 'translateY(10%)', opacity: 0 }),
        animate('200ms ease-out', style({ transform: 'translateY(0)', opacity: 1 })),
      ]),
    ]),
  ],
})
export class ApprovalRequestsComponent implements OnInit, OnDestroy {
  // Properti untuk tabel dan pagination
  pageSize = 10;
  page = 1;
  searchTerm = '';
  sortColumn = 'created_date';
  sortDirection: 'asc' | 'desc' = 'desc';
  totalRecords = 0;
  maxSize = 5;

  // Data
  requestList: any[] = [];
  GodocUser: any;
  breadCrumbItems!: Array<{}>;

  // Filter
  statusFilter = 'pending'; // Default show pending requests
  priorityFilter = '';

  // State
  loading = false;
  processingRequestId: number | null = null;
  private searchSubscription?: Subscription;
  private searchSubject = new Subject<string>();

  // Stats
  stats = {
    pending: 0,
    approved: 0,
    rejected: 0,
    urgent: 0,
    total: 0
  };

  constructor(
    private service: AppService,
    private tokenStorage: TokenStorageService,
    private router: Router,
    private route: ActivatedRoute,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.GodocUser = this.tokenStorage.getUser();
    const roleName = this.GodocUser?.role?.role_name;

    // Validate admin access
    if (!['Admin', 'Super Admin'].includes(roleName)) {
      this.router.navigate(['/activity-page/notfound']);
      return;
    }

    this.initBreadcrumbs();
    this.setupSearchDebounce();
    this.loadStats();
    this.loadApprovalRequests();
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  private setupSearchDebounce(): void {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.page = 1;
      this.loadApprovalRequests();
    });
  }

  initBreadcrumbs(): void {
    this.breadCrumbItems = [
      { label: 'Admin Panel' },
      { label: 'Proposed Changes' },
      { label: 'Approval Requests', active: true }
    ];
  }

  loadStats(): void {
    this.service.get('/proposedchanges/approver-change/stats')
      .pipe(
        catchError(error => {
          console.error('Error loading stats:', error);
          return of({ data: { pending: 0, approved: 0, rejected: 0, urgent: 0, total: 0 } });
        })
      )
      .subscribe(response => {
        if (response && response.data) {
          this.stats = response.data;
        }
      });
  }

  loadApprovalRequests(): void {
    this.loading = true;
    
    let url = `/proposedchanges/approver-change/all?page=${this.page}&limit=${this.pageSize}&search=${this.searchTerm}`;
    
    if (this.statusFilter) {
      url += `&status=${this.statusFilter}`;
    }
    
    if (this.priorityFilter) {
      url += `&priority=${this.priorityFilter}`;
    }

    this.service.get(url).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: (result: any) => {
        this.requestList = result.data || [];
        this.totalRecords = result.pagination?.total_count || 0;
        console.log('Approval requests loaded:', this.requestList);
      },
      error: (error) => this.handleError(error, 'Error fetching approval requests')
    });
  }

  onSearch(): void {
    this.searchSubject.next(this.searchTerm);
  }

  onStatusFilterChange(): void {
    this.page = 1;
    this.loadApprovalRequests();
  }

  onPriorityFilterChange(): void {
    this.page = 1;
    this.loadApprovalRequests();
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.loadApprovalRequests();
  }

  onPageSizeChange(): void {
    this.page = 1;
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
        <div class="text-start">
          <p><strong>Project:</strong> ${request.tr_proposed_changes?.project_name}</p>
          <p><strong>From:</strong> ${request.mst_authorization_tr_approver_change_request_current_auth_idTomst_authorization?.employee_name}</p>
          <p><strong>To:</strong> ${request.mst_authorization_tr_approver_change_request_new_auth_idTomst_authorization?.employee_name}</p>
          <p><strong>Reason:</strong> ${request.reason}</p>
        </div>
        <div class="mt-3">
          <label for="adminDecision" class="form-label"><strong>Admin Decision:</strong></label>
          <textarea id="adminDecision" class="form-control" rows="3" placeholder="Masukkan keputusan admin..."></textarea>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: confirmButtonColor,
      cancelButtonColor: '#6c757d',
      confirmButtonText: confirmButtonText,
      cancelButtonText: 'Batal',
      preConfirm: () => {
        const adminDecision = (document.getElementById('adminDecision') as HTMLTextAreaElement)?.value;
        if (!adminDecision || adminDecision.trim() === '') {
          Swal.showValidationMessage('Admin decision wajib diisi!');
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

    this.service.patch(`/proposedchanges/approver-change/${requestId}/process`, payload).pipe(
      finalize(() => this.processingRequestId = null)
    ).subscribe({
      next: (response: any) => {
        const successMessage = status === 'approved' 
          ? 'Request berhasil disetujui!' 
          : 'Request berhasil ditolak!';
        
        Swal.fire('Success!', successMessage, 'success');
        this.loadApprovalRequests();
        this.loadStats(); // Refresh stats
      },
      error: (error) => this.handleError(error, `Error ${status === 'approved' ? 'approving' : 'rejecting'} request`)
    });
  }

  viewProposedChangesDetail(proposedChangesId: number): void {
    this.router.navigate(['/activity-page/proposedchanges-detail', proposedChangesId]);
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

  getPriorityBadgeClass(priority: string): string {
    switch (priority) {
      case 'urgent':
        return 'bg-danger text-white';
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

  goBack(): void {
    this.router.navigate(['/activity-page/proposed-changes/admin']);
  }

  refreshData(): void {
    this.loadApprovalRequests();
    this.loadStats();
  }

  handleError(error: any, defaultMessage: string): void {
    let errorMessage = defaultMessage;

    if (error.status === 0) {
      errorMessage = 'Cannot connect to server. Please ensure the server is running.';
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

    Swal.fire('Error', errorMessage, 'error');
  }

  getShowingText(): string {
    if (this.totalRecords === 0) return 'No entries found';

    const start = (this.page - 1) * this.pageSize + 1;
    const end = Math.min(this.page * this.pageSize, this.totalRecords);
    return `Showing ${start} to ${end} of ${this.totalRecords} entries`;
  }
}