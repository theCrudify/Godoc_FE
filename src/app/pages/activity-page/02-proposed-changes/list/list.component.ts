// src/app/pages/activity-page/02-proposed-changes/list/list.component.ts

import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { AppService } from 'src/app/shared/service/app.service';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';

// Import komponen modal
import { ApprovalModalComponent } from './modal/approval/approval-modal.component';
import { HistoryModalComponent } from './modal/history/history-modal.component';
import { ApproverChangeModalComponent } from './modal/approver-change/approver-change-modal.component';
import { AdminBypassModalComponent } from './modal/admin-bypass/admin-bypass-modal.component';

@Component({
  selector: "app-list",
  templateUrl: "./list.component.html",
  styleUrls: ["./list.component.scss"],
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
export class ProposedChangesListComponent implements OnInit, OnDestroy {
    // Properti untuk tabel dan pagination
    pageSize = 10;
    page = 1;
    searchTerm = '';
    sortColumn = 'id';
    sortDirection: 'asc' | 'desc' = 'asc';
    totalRecords = 0;
    maxSize = 5;

    // Data
    listData: any[] = [];
    GodocUser: any;
    breadCrumbItems!: Array<{}>;

    // State
    loading = false;
    private searchSubscription?: Subscription;
    private searchSubject = new Subject<string>();

    constructor(
        private service: AppService,
        private tokenStorage: TokenStorageService,
        private router: Router,
        private modalService: NgbModal
    ) { }

    @HostListener('window:resize')
    onResize() {
        this.setMaxSize();
    }

    ngOnInit(): void {
        this.GodocUser = this.tokenStorage.getUser();
        console.log('GodocUser:', this.GodocUser);
        this.initBreadcrumbs();
        this.setupSearchDebounce();
        this.setMaxSize();
        this.loadedProposedChanges();
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
            this.loadedProposedChanges();
        });
    }

    initBreadcrumbs(): void {
        this.breadCrumbItems = [
            { label: 'Activity' },
            { label: 'Proposed Changes', active: true }
        ];
    }

    loadedProposedChanges(): void {
        this.loading = true;
        const url = `/proposedchanges?auth_id=${this.GodocUser.auth_id}&page=${this.page}&limit=${this.pageSize}&search=${this.searchTerm}&sort=${this.sortColumn}&direction=${this.sortDirection}`;

        this.service.get(url).pipe(
            finalize(() => this.loading = false)
        ).subscribe({
            next: (result: any) => {
                this.listData = result.data;
                this.totalRecords = result.pagination.totalCount;
                this.setMaxSize(result.pagination.totalPages);
                console.log(result.data);
            },
            error: (error) => this.handleError(error, 'Error fetching proposed changes')
        });
    }

    onSearch(): void {
        this.searchSubject.next(this.searchTerm);
    }

    onSort(column: string): void {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }
        this.loadedProposedChanges();
    }

    getSortIcon(column: string): string {
        if (this.sortColumn !== column) {
            return 'ri-arrow-up-down-line';
        }
        return this.sortDirection === 'asc' ? 'ri-arrow-up-line' : 'ri-arrow-down-line';
    }

    onNavigate(): void {
        this.router.navigate(['activity-page/proposedchanges-form']);
    }

    onDelete(id: number): void {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                this.loading = true;
                this.service.delete(`/proposedchanges/${id}`).pipe(
                    finalize(() => this.loading = false)
                ).subscribe({
                    next: () => {
                        Swal.fire('Deleted!', 'Your data has been deleted.', 'success');
                        this.loadedProposedChanges();
                    },
                    error: (error) => this.handleError(error, 'Error deleting data')
                });
            }
        });
    }

    AdditionalNav(id: number): void {
        console.log(`View item with ID: ${id}`);
        this.router.navigate(['activity-page/create-add-number/', id]);
    }

    onView(id: number): void {
        console.log(`View item with ID: ${id}`);
        this.router.navigate(['activity-page/proposedchanges-detail/', id]);
    }

    onEdit(id: number): void {
        console.log(`Edit item with ID: ${id}`);
        this.router.navigate(['activity-page/proposedchanges-edit/', id]);
    }

    onAssign(id: number): void {
        console.log(`Assign for item with ID: ${id}`);
    }

    openHistoryModal(id: number): void {
        const modalRef = this.modalService.open(HistoryModalComponent, {
            size: 'lg',
            centered: true,
            scrollable: true
        });
        
        modalRef.componentInstance.id = id;
    }

    openApprovalModal(id: number): void {
        const modalRef = this.modalService.open(ApprovalModalComponent, {
            size: 'lg',
            centered: true, 
            scrollable: true
        });
        
        modalRef.componentInstance.id = id;
    }

    // ===============================
    // NEW APPROVER CHANGE FUNCTIONALITY
    // ===============================

    /**
     * Open Approver Change Modal for creator to request approver changes
     */
    openApproverChangeModal(proposedChange: any): void {
        // Only creator can request approver changes
        if (proposedChange.auth_id !== this.GodocUser?.auth_id) {
            Swal.fire({
                title: 'Access Denied',
                text: 'Only the creator of this proposed change can request approver changes.',
                icon: 'warning'
            });
            return;
        }

        // Check if the status allows approver changes
        if (!['submitted', 'pending', 'on_going'].includes(proposedChange.status)) {
            Swal.fire({
                title: 'Cannot Change Approver',
                text: 'Approver changes are only allowed for submitted or pending proposed changes.',
                icon: 'info'
            });
            return;
        }

        // First, get approval data for this proposed change
        this.loading = true;
        this.service.get(`/approval-byID-proposed-changes/${proposedChange.id}`).pipe(
            finalize(() => this.loading = false)
        ).subscribe({
            next: (response: any) => {
                const approvalData = response.data || [];
                
                // Filter only pending/on_going approvals
                const changeableApprovals = approvalData.filter((approval: any) =>
                    ['pending', 'on_going'].includes(approval.status)
                );

                if (changeableApprovals.length === 0) {
                    Swal.fire({
                        title: 'No Changeable Approvals',
                        text: 'There are no pending or ongoing approvals that can be changed.',
                        icon: 'info'
                    });
                    return;
                }

                // Open modal with approval data
                const modalRef = this.modalService.open(ApproverChangeModalComponent, {
                    size: 'lg',
                    centered: true,
                    scrollable: true,
                    backdrop: 'static'
                });
                
                modalRef.componentInstance.proposedChangeId = proposedChange.id;
                modalRef.componentInstance.approvalData = changeableApprovals;
                modalRef.componentInstance.currentUser = this.GodocUser;

                // Handle modal result
                modalRef.result.then(
                    (result) => {
                        if (result === 'submitted') {
                            // Refresh the list to show any status changes
                            this.loadedProposedChanges();
                        }
                    },
                    () => {
                        // Modal dismissed
                    }
                );
            },
            error: (error) => {
                this.handleError(error, 'Error fetching approval data');
            }
        });
    }

    /**
     * Open Admin Bypass Modal for super admin to bypass approval system
     * FIXED: Ensure proposed_changes_id is properly passed
     */
    openAdminBypassModal(proposedChange: any): void {
        console.log('openAdminBypassModal: Input proposedChange:', proposedChange);
        
        // Only super admin can bypass
        if (this.GodocUser.role.role_name !== 'Super Admin') {
            Swal.fire({
                title: 'Access Denied',
                text: 'Only Super Admins can perform bypass operations.',
                icon: 'error'
            });
            return;
        }

        // Check if bypass is applicable
        if (proposedChange.status === 'done') {
            Swal.fire({
                title: 'Cannot Bypass',
                text: 'This proposed change is already completed.',
                icon: 'info'
            });
            return;
        }

        // Get detailed proposed change data with approvals
        this.loading = true;
        this.service.get(`/proposedchanges/${proposedChange.id}`).pipe(
            finalize(() => this.loading = false)
        ).subscribe({
            next: (response: any) => {
                const detailedData = response.data;
                
                // FIXED: Ensure both id and proposed_changes_id are available
                detailedData.proposed_changes_id = detailedData.id || proposedChange.id;
                
                console.log('openAdminBypassModal: Detailed data with ID mapping:', detailedData);
                
                // Get approval data
                this.service.get(`/approval-byID-proposed-changes/${proposedChange.id}`).subscribe({
                    next: (approvalResponse: any) => {
                        detailedData.approvals = approvalResponse.data || [];
                        
                        console.log('openAdminBypassModal: Final data being passed to modal:', detailedData);
                        
                        const modalRef = this.modalService.open(AdminBypassModalComponent, {
                            size: 'lg',
                            centered: true,
                            scrollable: true,
                            backdrop: 'static'
                        });
                        
                        modalRef.componentInstance.proposedChangeData = detailedData;
                        modalRef.componentInstance.currentUser = this.GodocUser;

                        // Handle modal result
                        modalRef.result.then(
                            (result) => {
                                if (result === 'bypassed') {
                                    // Refresh the list to show updated status
                                    this.loadedProposedChanges();
                                }
                            },
                            () => {
                                // Modal dismissed
                            }
                        );
                    },
                    error: (error) => {
                        this.handleError(error, 'Error fetching approval data');
                    }
                });
            },
            error: (error) => {
                this.handleError(error, 'Error fetching proposed change details');
            }
        });
    }

    /**
     * Check if user can request approver changes for a specific proposed change
     */
    canRequestApproverChange(proposedChange: any): boolean {
        return proposedChange.auth_id === this.GodocUser?.auth_id && 
               ['submitted', 'pending', 'on_going'].includes(proposedChange.status);
    }

    /**
     * Check if user can bypass approval system
     */
    canBypassApproval(proposedChange: any): boolean {
        return this.GodocUser.role.role_name === 'Super Admin' && 
               proposedChange.status !== 'done';
    }

    /**
     * Get tooltip text for approver change button
     */
    getApproverChangeTooltip(proposedChange: any): string {
        if (proposedChange.auth_id !== this.GodocUser?.auth_id) {
            return 'Only the creator can request approver changes';
        }
        if (!['submitted', 'pending', 'on_going'].includes(proposedChange.status)) {
            return 'Approver changes not allowed for this status';
        }
        return 'Request to change approver for pending steps';
    }

    /**
     * Get tooltip text for bypass button
     */
    getBypassTooltip(proposedChange: any): string {
        if (this.GodocUser.role.role_name !== 'Super Admin') {
            return 'Only Super Admins can bypass approvals';
        }
        if (proposedChange.status === 'done') {
            return 'Cannot bypass completed proposed changes';
        }
        return 'Bypass approval system (Super Admin only)';
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

    onPageChange(newPage: number): void {
        this.page = newPage;
        this.loadedProposedChanges();
    }

    onPageSizeChange(): void {
        this.page = 1;
        this.loadedProposedChanges();
    }

    setMaxSize(totalPages?: number): void {
        let baseMaxSize = 5;

        if (window.innerWidth < 576) {
            baseMaxSize = 2;
        } else if (window.innerWidth < 768) {
            baseMaxSize = 3;
        }

        this.maxSize = totalPages !== undefined ? Math.min(totalPages, baseMaxSize) : baseMaxSize;
    }
}