// src/app/pages/activity-page/02-proposed-changes/admin/pending-requests/pending-requests.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AppService } from 'src/app/shared/service/app.service';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';
import Swal from 'sweetalert2';

interface PendingRequest {
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
  tr_proposed_changes: {
    project_name: string;
    status: string;
    progress: string;
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

@Component({
  selector: 'app-pending-requests',
  templateUrl: './pending-requests.component.html',
})
export class PendingRequestsComponent implements OnInit, OnDestroy {
  // Table and pagination properties
  pageSize = 10;
  page = 1;
  searchTerm = '';
  priorityFilter = '';
  totalRecords = 0;
  maxSize = 5;

  // Data
  pendingRequests: PendingRequest[] = [];
  currentUser: any;
  breadCrumbItems!: Array<{}>;

  // State
  loading = false;
  processingRequestId: number | null = null;
  
  // Form for processing requests
  processForm!: FormGroup;
  selectedRequest: PendingRequest | null = null;

  // Search and destroy subjects
  private searchSubscription?: Subscription;
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private service: AppService,
    private tokenStorage: TokenStorageService,
    private modalService: NgbModal,
    private fb: FormBuilder
  ) {
    this.initProcessForm();
  }

  ngOnInit(): void {
    this.currentUser = this.tokenStorage.getUser();
    this.initBreadcrumbs();
    this.setupSearchDebounce();
    this.checkAdminAccess();
    this.loadPendingRequests();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  private initProcessForm(): void {
    this.processForm = this.fb.group({
      status: ['', Validators.required],
      admin_decision: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  private setupSearchDebounce(): void {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.page = 1;
      this.loadPendingRequests();
    });
  }

  private checkAdminAccess(): void {
    if (!['admin', 'super_admin'].includes(this.currentUser?.user_role)) {
      Swal.fire({
        title: 'Access Denied',
        text: 'You do not have permission to view this page.',
        icon: 'error'
      }).then(() => {
        // Redirect to previous page or dashboard
        window.history.back();
      });
    }
  }

  initBreadcrumbs(): void {
    this.breadCrumbItems = [
      { label: 'Activity' },
      { label: 'Proposed Changes' },
      { label: 'Pending Approver Changes', active: true }
    ];
  }

  loadPendingRequests(): void {
    this.loading = true;
    
    let url = `/approver-change/pending?page=${this.page}&limit=${this.pageSize}`;
    
    if (this.searchTerm) {
      url += `&search=${encodeURIComponent(this.searchTerm)}`;
    }
    
    if (this.priorityFilter) {
      url += `&priority=${this.priorityFilter}`;
    }

    this.service.get(url).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: (response: any) => {
        this.pendingRequests = response.data || [];
        this.totalRecords = response.pagination?.total_count || 0;
        console.log('Pending requests loaded:', this.pendingRequests);
      },
      error: (error) => {
        this.handleError(error, 'Error fetching pending requests');
        this.pendingRequests = [];
      }
    });
  }

  onSearch(): void {
    this.searchSubject.next(this.searchTerm);
  }

  onPriorityFilterChange(): void {
    this.page = 1;
    this.loadPendingRequests();
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.loadPendingRequests();
  }

  onPageSizeChange(): void {
    this.page = 1;
    this.loadPendingRequests();
  }

  /**
   * Open process modal for approving/rejecting request
   */
  openProcessModal(request: PendingRequest, modal: any): void {
    this.selectedRequest = request;
    this.processForm.reset();
    
    this.modalService.open(modal, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  }

  /**
   * Process the approver change request
   */
  processRequest(status: 'approved' | 'rejected'): void {
    if (!this.selectedRequest) return;

    const decision = this.processForm.get('admin_decision')?.value?.trim();
    
    if (!decision || decision.length < 10) {
      Swal.fire({
        title: 'Invalid Input',
        text: 'Please provide a detailed decision (minimum 10 characters).',
        icon: 'warning'
      });
      return;
    }

    const confirmTitle = status === 'approved' ? 'Approve Request' : 'Reject Request';
    const confirmText = status === 'approved' 
      ? 'This will change the approver and update the approval system. Continue?'
      : 'This will reject the approver change request. Continue?';

    Swal.fire({
      title: confirmTitle,
      text: confirmText,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: status === 'approved' ? '#28a745' : '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: `Yes, ${status === 'approved' ? 'Approve' : 'Reject'}`,
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.executeProcessRequest(status, decision);
      }
    });
  }

  private executeProcessRequest(status: 'approved' | 'rejected', decision: string): void {
    if (!this.selectedRequest) return;

    this.processingRequestId = this.selectedRequest.id;
    
    const requestData = {
      status,
      admin_decision: decision
    };

    this.service.patch(`/approver-change/${this.selectedRequest.id}/process`, requestData).pipe(
      finalize(() => {
        this.processingRequestId = null;
      })
    ).subscribe({
      next: (response: any) => {
        const successTitle = status === 'approved' ? 'Request Approved!' : 'Request Rejected!';
        const successText = status === 'approved' 
          ? 'The approver has been successfully changed and the requester has been notified.'
          : 'The request has been rejected and the requester has been notified.';

        Swal.fire({
          title: successTitle,
          text: successText,
          icon: 'success'
        });

        // Close any open modals
        this.modalService.dismissAll();
        
        // Refresh the list
        this.loadPendingRequests();
        
        // Clear selected request
        this.selectedRequest = null;
      },
      error: (error) => {
        this.handleError(error, `Error ${status === 'approved' ? 'approving' : 'rejecting'} request`);
      }
    });
  }

  /**
   * View request details
   */
  viewRequestDetails(request: PendingRequest, modal: any): void {
    this.selectedRequest = request;
    this.modalService.open(modal, {
      size: 'lg',
      centered: true,
      scrollable: true
    });
  }

  /**
   * Get priority badge class
   */
  getPriorityBadgeClass(priority: string): string {
    const classes: { [key: string]: string } = {
      'urgent': 'bg-danger',
      'high': 'bg-warning',
      'normal': 'bg-info',
      'low': 'bg-secondary'
    };
    return classes[priority] || 'bg-secondary';
  }

  /**
   * Get status badge class
   */
  getStatusBadgeClass(status: string): string {
    const classes: { [key: string]: string } = {
      'pending': 'bg-warning text-dark',
      'approved': 'bg-success',
      'rejected': 'bg-danger'
    };
    return classes[status] || 'bg-secondary';
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Get showing text for pagination
   */
  getShowingText(): string {
    if (this.totalRecords === 0) return 'No entries found';

    const start = (this.page - 1) * this.pageSize + 1;
    const end = Math.min(this.page * this.pageSize, this.totalRecords);
    return `Showing ${start} to ${end} of ${this.totalRecords} entries`;
  }

  /**
   * Check if request is being processed
   */
  isProcessing(requestId: number): boolean {
    return this.processingRequestId === requestId;
  }

  /**
   * Handle errors
   */
  private handleError(error: any, defaultMessage: string): void {
    let errorMessage = defaultMessage;

    if (error.status === 0) {
      errorMessage = 'Cannot connect to server. Please ensure the server is running.';
    } else if (error.error) {
      if (error.error.message) {
        errorMessage = error.error.message;
      } else if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.error.error) {
        errorMessage = error.error.error;
      }
    }

    Swal.fire('Error', errorMessage, 'error');
  }

  /**
   * Get field error message
   */
  getFieldError(fieldName: string): string {
    const control = this.processForm.get(fieldName);
    if (control && control.errors && control.touched) {
      if (control.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (control.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} must be at least ${control.errors['minlength'].requiredLength} characters`;
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      'admin_decision': 'Decision'
    };
    return labels[fieldName] || fieldName;
  }
}