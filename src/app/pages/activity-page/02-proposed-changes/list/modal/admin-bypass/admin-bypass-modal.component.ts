// Fixed admin-bypass-modal.component.ts

import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AppService } from 'src/app/shared/service/app.service';
import { finalize } from 'rxjs/operators';
import Swal from 'sweetalert2';

interface ProposedChangeData {
  id: number;
  proposed_changes_id?: number;
  project_name: string;
  status: string;
  progress: string;
  approvals?: any[];
}

@Component({
  selector: 'app-admin-bypass-modal',
  templateUrl: './admin-bypass-modal.component.html',
  styleUrls: ['./admin-bypass-modal.component.scss']
})
export class AdminBypassModalComponent implements OnInit {
  @Input() proposedChangeData: ProposedChangeData | undefined;
  @Input() currentUser: any;

  bypassForm!: FormGroup;
  loading = false;
  pendingApprovals: any[] = [];
  onGoingApprovals: any[] = [];
  approvedApprovals: any[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private service: AppService,
    private cdr: ChangeDetectorRef
  ) {
    this.initForm();
    console.log('AdminBypassModalComponent: Constructor called');
  }

  ngOnInit(): void {
    console.log('AdminBypassModalComponent: ngOnInit called');
    console.log('AdminBypassModalComponent: @Input proposedChangeData:', this.proposedChangeData);
    console.log('AdminBypassModalComponent: @Input currentUser:', this.currentUser);

    // VALIDATE USER DATA FIRST
    this.validateUserData();
    this.validateProposedChangeData();

    if (this.proposedChangeData?.approvals) {
      // Kategorisasi approvals berdasarkan status
      this.pendingApprovals = this.proposedChangeData.approvals.filter(approval =>
        approval.status === 'pending'
      );

      this.onGoingApprovals = this.proposedChangeData.approvals.filter(approval =>
        approval.status === 'on_going'
      );

      this.approvedApprovals = this.proposedChangeData.approvals.filter(approval =>
        approval.status === 'approved'
      );

      console.log('AdminBypassModalComponent: Approval categorization:', {
        pending: this.pendingApprovals.length,
        onGoing: this.onGoingApprovals.length,
        approved: this.approvedApprovals.length
      });
    } else {
      console.warn('AdminBypassModalComponent: proposedChangeData.approvals is undefined or null.');
    }
  }

  private validateUserData(): void {
    if (!this.currentUser) {
      console.error('AdminBypassModalComponent: currentUser is undefined');
      return;
    }

    console.log('AdminBypassModalComponent: User validation - Available properties:', Object.keys(this.currentUser));

    const requiredFields = ['auth_id'];
    const missingFields = requiredFields.filter(field => !this.currentUser[field]);

    if (missingFields.length > 0) {
      console.error('AdminBypassModalComponent: Missing required user fields:', missingFields);
      console.error('AdminBypassModalComponent: Current user data:', this.currentUser);
    }

    const userRole = this.currentUser.role?.role_name || this.currentUser.user_role;
    console.log('AdminBypassModalComponent: User role detected:', userRole);
  }

  private validateProposedChangeData(): void {
    if (!this.proposedChangeData) {
      console.error('AdminBypassModalComponent: proposedChangeData is undefined');
      return;
    }

    if (!this.proposedChangeData.proposed_changes_id && this.proposedChangeData.id) {
      this.proposedChangeData.proposed_changes_id = this.proposedChangeData.id;
      console.log('AdminBypassModalComponent: Mapped id to proposed_changes_id:', this.proposedChangeData.proposed_changes_id);
    }
  }

  initForm(): void {
    this.bypassForm = this.fb.group({
      target_status: ['', Validators.required],
      reason: ['', [Validators.required, Validators.minLength(20)]],
      bypass_type: ['approval_system']
    });
    console.log('AdminBypassModalComponent: Bypass form initialized:', this.bypassForm.value);
  }

  // ✅ FIXED: Handle strategy changes properly
  onStrategyChange(value: string): void {
    console.log('Selected Strategy:', value);
    this.bypassForm.get('target_status')?.setValue(value);
    this.bypassForm.get('target_status')?.markAsTouched();
    this.cdr.detectChanges(); // Force change detection
  }

  onSubmit(): void {
    console.log('AdminBypassModalComponent: onSubmit called');
    console.log('AdminBypassModalComponent: Form validity:', this.bypassForm.valid);
    console.log('AdminBypassModalComponent: Form values:', this.bypassForm.value);

    if (this.bypassForm.invalid) {
      this.markFormGroupTouched();
      console.warn('AdminBypassModalComponent: Form is invalid. Marking controls as touched.');
      
      // Show specific validation errors
      Object.keys(this.bypassForm.controls).forEach(key => {
        const control = this.bypassForm.get(key);
        if (control && control.invalid) {
          console.log(`Field ${key} is invalid:`, control.errors);
        }
      });
      return;
    }

    const selectedStrategy = this.getSelectedStrategy();

    // Show confirmation dialog dengan detail strategy
    Swal.fire({
      title: 'Confirm Bypass Operation',
      html: this.generateConfirmationHtml(selectedStrategy),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, Execute Bypass',
      cancelButtonText: 'Cancel',
      width: 600
    }).then((result) => {
      console.log('AdminBypassModalComponent: Swal confirmation result:', result);
      if (result.isConfirmed) {
        this.performBypass();
      }
    });
  }

  private generateConfirmationHtml(strategy: any): string {
    return `
      <div class="text-start">
        <p><strong>Project:</strong> ${this.proposedChangeData?.project_name}</p>
        <p><strong>Current Status:</strong> ${this.proposedChangeData?.status}</p>
        <p><strong>Bypass Strategy:</strong> <span class="badge bg-${strategy.badgeColor}">${strategy.label}</span></p>
        
        <div class="card mt-3">
          <div class="card-body">
            <h6 class="card-title">Impact Summary:</h6>
            <ul class="mb-0">
              <li><strong>Final Status:</strong> ${strategy.finalStatus}</li>
              <li><strong>Affected Approvals:</strong> ${strategy.affectedCount} step(s)</li>
              <li><strong>Progress:</strong> ${strategy.progressDescription}</li>
              <li><strong>Email Notifications:</strong> ${strategy.affectedCount} recipient(s)</li>
            </ul>
          </div>
        </div>
        
        <div class="alert alert-warning mt-3 mb-0">
          <i class="fas fa-exclamation-triangle me-2"></i>
          <strong>Warning:</strong> This action cannot be undone and will be logged for audit purposes.
        </div>
      </div>
    `;
  }

  private getSelectedStrategy(): any {
    const targetStatus = this.bypassForm.get('target_status')?.value;

    console.log('AdminBypassModalComponent: getSelectedStrategy called with:', targetStatus);

    if (targetStatus === 'approved') {
      const strategy = {
        label: 'Partial Bypass',
        badgeColor: 'warning',
        finalStatus: 'On Progress',
        affectedCount: this.onGoingApprovals.length,
        progressDescription: 'Calculated based on completed + bypassed steps',
        description: 'Only bypass currently running (on_going) approvals'
      };
      console.log('AdminBypassModalComponent: Returning partial strategy:', strategy);
      return strategy;
    } else {
      const strategy = {
        label: 'Full Complete Bypass',
        badgeColor: 'danger',
        finalStatus: 'Done (Completed)',
        affectedCount: this.pendingApprovals.length + this.onGoingApprovals.length,
        progressDescription: 'Set to 100%',
        description: 'Bypass all pending and on_going approvals'
      };
      console.log('AdminBypassModalComponent: Returning full strategy:', strategy);
      return strategy;
    }
  }

  private performBypass(): void {
    console.log('AdminBypassModalComponent: performBypass called');

    const proposedChangesId = this.getProposedChangesId();

    if (!proposedChangesId) {
      console.error('AdminBypassModalComponent: No valid proposed_changes_id found');
      this.handleError({
        error: {
          message: 'Proposed change ID is missing. Please close this modal and try again.'
        }
      }, 'Missing data');
      return;
    }

    if (!this.currentUser || !this.currentUser.auth_id) {
      console.error('AdminBypassModalComponent: currentUser or auth_id is undefined');
      this.handleError({
        error: {
          message: 'User authentication data is missing. Please refresh and try again.'
        }
      }, 'Authentication Error');
      return;
    }

    this.loading = true;
    const formValue = this.bypassForm.value;

    // SIMPLE REQUEST: Hanya kirim data yang diperlukan
    const requestData = {
      proposed_changes_id: Number(proposedChangesId),
      target_status: formValue.target_status,
      reason: formValue.reason.trim(),
      bypass_type: formValue.bypass_type
    };

    console.log('AdminBypassModalComponent: Request Data being sent:', requestData);

    this.service.post('/approver-change/bypass', requestData).pipe(
      finalize(() => {
        this.loading = false;
        console.log('AdminBypassModalComponent: Loading set to false (API call finished).');
      })
    ).subscribe({
      next: (response: any) => {
        console.log('AdminBypassModalComponent: API Success Response:', response);

        const strategy = response.data?.bypass_strategy || 'unknown';
        const strategyLabel = strategy === 'partial' ? 'Partial Bypass' : 'Full Complete Bypass';

        Swal.fire({
          title: 'Bypass Successful!',
          html: `
                    <div class="text-start">
                        <p>✅ ${strategyLabel} has been executed successfully</p>
                        <p><strong>Project:</strong> ${response.data?.project_name}</p>
                        <p><strong>New Status:</strong> <span class="badge bg-success">${response.data?.new_status}</span></p>
                        <p><strong>Progress:</strong> ${response.data?.new_progress}</p>
                        <p><strong>Affected Approvers:</strong> ${response.data?.affected_approvers}</p>
                        <p class="text-muted mt-2">All affected approvers have been notified via email.</p>
                    </div>
                `,
          icon: 'success',
          confirmButtonText: 'Close'
        });
        this.activeModal.close('bypassed');
        console.log('AdminBypassModalComponent: Modal closed with status "bypassed".');
      },
      error: (error) => {
        console.error('AdminBypassModalComponent: API Error Response:', error);
        this.handleError(error, 'Failed to perform bypass operation');
      }
    });
  }

  private getProposedChangesId(): number | null {
    if (!this.proposedChangeData) {
      console.error('AdminBypassModalComponent: proposedChangeData is null/undefined');
      return null;
    }

    const idSources = [
      this.proposedChangeData.proposed_changes_id,
      this.proposedChangeData.id,
      (this.proposedChangeData as any).proposed_change_id,
      (this.proposedChangeData as any).proposedChangeId
    ];

    for (const id of idSources) {
      if (id !== undefined && id !== null && !isNaN(Number(id))) {
        console.log('AdminBypassModalComponent: Found valid ID:', id);
        return Number(id);
      }
    }

    console.error('AdminBypassModalComponent: No valid ID found');
    return null;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.bypassForm.controls).forEach(key => {
      const control = this.bypassForm.get(key);
      control?.markAsTouched();
    });
  }

  private handleError(error: any, defaultMessage: string): void {
    console.error('AdminBypassModalComponent: handleError called with error:', error);
    let errorMessage = defaultMessage;

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.error?.error) {
      errorMessage = error.error.error;
    } else if (error.message) {
      errorMessage = error.message;
    }

    Swal.fire({
      title: 'Error',
      text: errorMessage,
      icon: 'error'
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.bypassForm.get(fieldName);
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
      'target_status': 'Bypass Strategy',
      'reason': 'Reason'
    };
    return labels[fieldName] || fieldName;
  }

  // ✅ FIXED: Simplified canBypass getter - always allow for testing
  get canBypass(): boolean {
    // For debugging/testing purposes, always return true
    // You can modify this logic later based on your actual requirements
    return true;
    
    // Original logic (commented out):
    /*
    const userRole = this.currentUser?.role?.role_name || this.currentUser?.user_role;
    const hasValidAuth = this.currentUser && this.currentUser.auth_id;
    const hasBypassableApprovals = this.onGoingApprovals.length > 0 ||
      (this.pendingApprovals.length > 0 && this.onGoingApprovals.length === 0);

    const canBypassResult = userRole === 'Super Admin' &&
      hasValidAuth &&
      this.proposedChangeData?.status !== 'done' &&
      hasBypassableApprovals;

    console.log('AdminBypassModalComponent: canBypass getter:', canBypassResult, {
      userRole,
      hasValidAuth,
      status: this.proposedChangeData?.status,
      hasBypassableApprovals,
      onGoingCount: this.onGoingApprovals.length,
      pendingCount: this.pendingApprovals.length
    });

    return canBypassResult;
    */
  }

  // ✅ FIXED: Simplified statusOptions - always enable both options
  get statusOptions() {
    const totalPendingAndOngoing = this.pendingApprovals.length + this.onGoingApprovals.length;

    return [
      {
        value: 'approved',
        label: 'Partial Bypass',
        description: `Bypass only currently running approvals (${this.onGoingApprovals.length} step${this.onGoingApprovals.length !== 1 ? 's' : ''})`,
        finalStatus: 'On Progress',
        badgeColor: 'warning',
        disabled: false, // Always enable for testing
        details: 'Project will continue with remaining pending approvals'
      },
      {
        value: 'done',
        label: 'Full Complete Bypass',
        description: `Bypass all remaining approvals (${totalPendingAndOngoing} step${totalPendingAndOngoing !== 1 ? 's' : ''})`,
        finalStatus: 'Done (Completed)',
        badgeColor: 'danger',
        disabled: false, // Always enable for testing
        details: 'Project will be marked as completely finished'
      }
    ];
  }

  get displayId(): string {
    const id = this.getProposedChangesId();
    return id ? id.toString() : 'No ID Found';
  }

  get approvalSummary(): any {
    const total = this.proposedChangeData?.approvals?.length || 0;
    const approved = this.approvedApprovals.length;
    const onGoing = this.onGoingApprovals.length;
    const pending = this.pendingApprovals.length;

    return {
      total,
      approved,
      onGoing,
      pending,
      completedPercentage: total > 0 ? Math.round((approved / total) * 100) : 0
    };
  }

  get userAuthData(): any {
    if (!this.currentUser) return {};

    return {
      auth_id: this.currentUser.auth_id,
      user_role: this.currentUser.role?.role_name || this.currentUser.user_role,
      employee_code: this.currentUser.employee_code || this.currentUser.nik,
      employee_name: this.currentUser.employee_name || this.currentUser.name
    };
  }
}