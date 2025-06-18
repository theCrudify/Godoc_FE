// src/app/pages/activity-page/02-proposed-changes/list/modal/approver-change/approver-change-modal.component.ts

import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AppService } from 'src/app/shared/service/app.service';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';
import { finalize, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';
import Swal from 'sweetalert2';

interface ApprovalData {
  id: number;
  step: number;
  actor: string;
  status: string;
  auth_id: number;
  authorization: {
    id: number;
    employee_name: string;
    employee_code: string;
    email: string;
  };
}

interface User {
  id: number;
  employee_name: string;
  employee_code: string;
  email: string;
  department_name: string;
  section_name: string;
  plant_code: string;
  status: boolean;
}

interface UserApiResponse {
  data: User[];
  pagination: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

@Component({
  selector: 'app-approver-change-modal',
  templateUrl: './approver-change-modal.component.html',
  styleUrls: ['./approver-change-modal.component.scss']
})
export class ApproverChangeModalComponent implements OnInit, OnDestroy {
  @Input() proposedChangeId: number | undefined;
  @Input() approvalData: ApprovalData[] = [];
  @Input() currentUser: any;
  
  changeForm!: FormGroup;
  availableUsers: User[] = [];
  selectedApproval: ApprovalData | null = null;
  
  // Loading states
  loading = false;
  loadingUsers = false;
  loadingMoreUsers = false;
  
  // Search and pagination
  searchTerm = '';
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;
  currentPage = 1;
  pageSize = 10;
  totalUsers = 0;
  totalPages = 0;
  hasMoreUsers = false;

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private service: AppService,
    private tokenStorage: TokenStorageService
  ) {
    this.initForm();
    this.setupSearchDebounce();
  }

  ngOnInit(): void {
    // Filter only pending/on_going approvals that can be changed
    this.approvalData = this.approvalData.filter(approval => 
      ['pending', 'on_going'].includes(approval.status)
    );
    
    this.loadAvailableUsers();
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
    ).subscribe((searchTerm: string) => {
      this.searchTerm = searchTerm;
      this.currentPage = 1;
      this.availableUsers = []; // Clear existing users when searching
      this.loadAvailableUsers();
    });
  }

  initForm(): void {
    this.changeForm = this.fb.group({
      approval_id: [null, Validators.required],
      new_auth_id: [null, Validators.required],
      reason: ['', [Validators.required, Validators.minLength(10)]],
      urgent: [false]
    });
  }

  onApprovalSelect(approval: ApprovalData): void {
    this.selectedApproval = approval;
    this.changeForm.patchValue({
      approval_id: approval.id
    });
    
    // Clear new approver selection when approval changes
    this.changeForm.patchValue({
      new_auth_id: null
    });
  }

  loadAvailableUsers(loadMore = false): void {
    if (!loadMore) {
      this.loadingUsers = true;
      this.currentPage = 1;
    } else {
      this.loadingMoreUsers = true;
      this.currentPage++;
    }
    
    const params = new URLSearchParams({
      page: this.currentPage.toString(),
      limit: this.pageSize.toString(),
      status: 'true' // Only load active users
    });

    if (this.searchTerm.trim()) {
      params.append('search', this.searchTerm.trim());
    }

    this.service.get(`/userGodoc?${params.toString()}`).pipe(
      finalize(() => {
        this.loadingUsers = false;
        this.loadingMoreUsers = false;
      })
    ).subscribe({
      next: (response: UserApiResponse) => {
        const newUsers = response.data || [];
        
        if (loadMore) {
          // Append new users to existing list
          this.availableUsers = [...this.availableUsers, ...newUsers];
        } else {
          // Replace existing users
          this.availableUsers = newUsers;
        }
        
        // Update pagination info
        this.totalUsers = response.pagination.totalCount;
        this.totalPages = response.pagination.totalPages;
        this.hasMoreUsers = response.pagination.hasNextPage;
        
        console.log('Loaded users:', this.availableUsers.length, 'of', this.totalUsers);
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.handleError(error, 'Failed to load users');
        
        // Reset on error
        if (!loadMore) {
          this.availableUsers = [];
        }
      }
    });
  }

  onUserSearch(event: any): void {
    const term = event.target.value;
    this.searchSubject.next(term);
  }

  loadMoreUsers(): void {
    if (this.hasMoreUsers && !this.loadingMoreUsers) {
      this.loadAvailableUsers(true);
    }
  }

  onSubmit(): void {
    if (this.changeForm.invalid || !this.selectedApproval) {
      this.markFormGroupTouched();
      return;
    }

    const formValue = this.changeForm.value;
    
    // Validate that new approver is different from current
    if (Number(formValue.new_auth_id) === Number(this.selectedApproval.auth_id)) {
      Swal.fire({
        title: 'Invalid Selection',
        text: 'Please select a different approver than the current one.',
        icon: 'warning'
      });
      return;
    }

    this.loading = true;

    const requestData = {
      proposed_changes_id: Number(this.proposedChangeId),
      approval_id: Number(formValue.approval_id),
      current_auth_id: Number(this.selectedApproval.auth_id),
      new_auth_id: Number(formValue.new_auth_id),
      reason: formValue.reason.trim(),
      urgent: Boolean(formValue.urgent),
      requested_by: this.currentUser?.employee_code || this.currentUser?.nik || 'system'
    };

    this.service.post('/approver-change/request', requestData).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: (response: any) => {
        Swal.fire({
          title: 'Success!',
          text: 'Approver change request has been submitted successfully.',
          icon: 'success'
        });
        this.activeModal.close('submitted');
      },
      error: (error) => {
        this.handleError(error, 'Failed to submit approver change request');
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.changeForm.controls).forEach(key => {
      const control = this.changeForm.get(key);
      control?.markAsTouched();
    });
  }

  private handleError(error: any, defaultMessage: string): void {
    let errorMessage = defaultMessage;

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.error?.error) {
      errorMessage = error.error.error;
    }

    Swal.fire({
      title: 'Error',
      text: errorMessage,
      icon: 'error'
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.changeForm.get(fieldName);
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
      'approval_id': 'Approval Step',
      'new_auth_id': 'New Approver',
      'reason': 'Reason'
    };
    return labels[fieldName] || fieldName;
  }

  getUserDisplayName(userId: number): string {
    const user = this.availableUsers.find(u => u.id === userId);
    return user ? `${user.employee_name} (${user.employee_code})` : '';
  }

  getUserFullDisplayName(user: User): string {
    return `${user.employee_name} (${user.employee_code}) - ${user.email}`;
  }

  getCurrentApproverName(): string {
    return this.selectedApproval?.authorization?.employee_name || '';
  }

  isUserCurrentApprover(userId: number): boolean {
    return this.selectedApproval ? Number(userId) === Number(this.selectedApproval.auth_id) : false;
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchSubject.next('');
  }

  refreshUsers(): void {
    this.currentPage = 1;
    this.availableUsers = [];
    this.loadAvailableUsers();
  }
}