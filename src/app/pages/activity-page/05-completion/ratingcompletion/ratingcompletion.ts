import { CommonModule } from '@angular/common';

import { Component, OnInit, OnDestroy, HostListener, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { AppService } from 'src/app/shared/service/app.service';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { RatingModalComponent } from './rating-modal.component'

// Import components
import { ApprovalCompletionComponent } from '../completion-list/modal/approval/completionapproval-modal.component';
import { HistoryCompletionModalComponent } from '../completion-list/modal/history/completionhandover-modal.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-completion-list',
    templateUrl: './ratingcompletion.html',
    styleUrl: './ratingcompletion.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        trigger('fadeIn', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate('300ms ease-in', style({ opacity: 1 })),
            ]),
        ]),
        trigger('listAnimation', [
            transition(':enter', [
                style({ transform: 'translateY(5%)', opacity: 0 }),
                animate('150ms ease-out', style({ transform: 'translateY(0)', opacity: 1 })),
            ]),
        ]),
    ],
})
export class ratingcompletionComponent implements OnInit, OnDestroy {
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

    // Performance optimization: Pre-calculated data
    progressData: Map<number, any> = new Map();

    // State
    loading = false;
    private searchSubscription?: Subscription;
    private searchSubject = new Subject<string>();

    // Data caching
    private dataCache: Map<string, any> = new Map();

    // Debug mode
    debugMode = false;

    constructor(
        private service: AppService,
        private tokenStorage: TokenStorageService,
        private router: Router,
        private modalService: NgbModal,
        private _snackBar: MatSnackBar,
        private cdr: ChangeDetectorRef
    ) { }

    @HostListener('window:resize')
    onResize() {
        this.setMaxSize();
        this.cdr.markForCheck();
    }

    ngOnInit(): void {
        this.GodocUser = this.tokenStorage.getUser();
        this.initBreadcrumbs();
        this.setupSearchDebounce();
        this.setMaxSize();
        this.loadRatingList();
    }

    ngOnDestroy(): void {
        if (this.searchSubscription) {
            this.searchSubscription.unsubscribe();
        }
        this.progressData.clear();
        this.dataCache.clear();
    }

    private setupSearchDebounce(): void {
        this.searchSubscription = this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged()
        ).subscribe(() => {
            this.page = 1;
            this.loadRatingList();
        });
    }

    initBreadcrumbs(): void {
        this.breadCrumbItems = [
            { label: 'Activity' },
            { label: 'Completion All', active: true }
        ];
    }

    // Track by function for optimized rendering
    trackByItemId(index: number, item: any): number {
        return item.id;
    }

    loadRatingList(): void {
        this.loading = true;

        // Create cache key based on current filter/sort/pagination state
        const cacheKey = `${this.page}_${this.pageSize}_${this.searchTerm}_${this.sortColumn}_${this.sortDirection}`;

        // Check if we already have this data cached
        if (this.dataCache.has(cacheKey)) {
            const cachedResult = this.dataCache.get(cacheKey);
            this.listData = cachedResult.data;
            this.totalRecords = cachedResult.totalCount;
            this.processDataForDisplay(this.listData);
            this.loading = false;
            this.cdr.markForCheck();
            return;
        }

        const url = `/completionapprover/${this.GodocUser.auth_id}?&page=${this.page}&limit=${this.pageSize}&search=${this.searchTerm}&sort=${this.sortColumn}&direction=${this.sortDirection}`;

        this.service.get(url).pipe(
            finalize(() => {
                this.loading = false;
                this.cdr.markForCheck();
            })
        ).subscribe({
            next: (result: any) => {
                // Cache the result
                this.dataCache.set(cacheKey, {
                    data: result.data,
                    totalCount: result.pagination.totalCount
                });

                this.listData = result.data;
                this.totalRecords = result.pagination.totalCount;
                this.setMaxSize(result.pagination.totalPages);

                // Process data for display optimization
                this.processDataForDisplay(this.listData);
            },
            error: (error) => this.handleError(error, 'Error fetching proposed changes')
        });
    }

    // Process data for optimized display - FIXED
    private processDataForDisplay(data: any[]): void {
        if (!data || !Array.isArray(data)) {
            console.error('Invalid data passed to processDataForDisplay:', data);
            return;
        }

        // Reset progress cache
        this.progressData.clear();

        // Pre-calculate all needed values
        for (const item of data) {
            if (!item || typeof item !== 'object' || !item.id) {
                console.warn('Invalid item in data array:', item);
                continue;
            }

            try {
                // Extract all progress values once - pastikan tidak ada nilai undefined/null
                const mainProgress = this.parseProgressValue(item.progress || '0%');
                const supportProgress = this.parseProgressValue(item.progresssupport || '0%');

                const authProgress = item.authorization_doc_progress &&
                    Array.isArray(item.authorization_doc_progress) &&
                    item.authorization_doc_progress.length > 0 &&
                    item.authorization_doc_progress[0] &&
                    item.authorization_doc_progress[0].progress
                    ? this.parseProgressValue(item.authorization_doc_progress[0].progress)
                    : 0;

                const handoverProgress = item.handover_progress &&
                    Array.isArray(item.handover_progress) &&
                    item.handover_progress.length > 0 &&
                    item.handover_progress[0] &&
                    item.handover_progress[0].progress
                    ? this.parseProgressValue(item.handover_progress[0].progress)
                    : 0;

                // Calculate total once
                const totalProgress = Math.round((mainProgress + supportProgress + authProgress + handoverProgress) / 4);

                if (this.debugMode) {
                    console.log(`Item ${item.id} Progress:`, {
                        main: mainProgress,
                        support: supportProgress,
                        auth: authProgress,
                        handover: handoverProgress,
                        total: totalProgress
                    });
                }

                // Handle star rating - ensure it's a number
                let starRating = 0;
                if (item.all_handover_data && item.all_handover_data.star !== undefined) {
                    // Convert string to number and handle NaN
                    const parsedStar = parseFloat(item.all_handover_data.star);
                    starRating = isNaN(parsedStar) ? 0 : parsedStar;
                }

                // Store all pre-calculated values
                this.progressData.set(item.id, {
                    mainProgress,
                    supportProgress,
                    authProgress,
                    handoverProgress,
                    totalProgress,
                    mainWidth: this.calculateProgressWidth(mainProgress),
                    supportWidth: this.calculateProgressWidth(supportProgress),
                    authWidth: this.calculateProgressWidth(authProgress),
                    handoverWidth: this.calculateProgressWidth(handoverProgress),
                    showMainPercent: mainProgress >= 30,
                    showSupportPercent: supportProgress >= 30,
                    showAuthPercent: authProgress >= 30,
                    showHandoverPercent: handoverProgress >= 30,
                    isFinished: item.all_handover_data?.is_finished === true,
                    starRating: starRating,
                    formattedRating: starRating.toFixed(1),
                    starTypes: this.calculateStarTypes(starRating)
                });
            } catch (err) {
                console.error(`Error processing item ${item.id}:`, err);
                // Add fallback data
                this.progressData.set(item.id, this.getEmptyProgressData());
            }
        }
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
        this.loadRatingList();
    }

    getSortIcon(column: string): string {
        if (this.sortColumn !== column) {
            return 'ri-arrow-up-down-line';
        }
        return this.sortDirection === 'asc' ? 'ri-arrow-up-line' : 'ri-arrow-down-line';
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
                    finalize(() => {
                        this.loading = false;
                        this.cdr.markForCheck();
                    })
                ).subscribe({
                    next: () => {
                        Swal.fire('Deleted!', 'Your data has been deleted.', 'success');
                        this.dataCache.clear();
                        this.loadRatingList();
                    },
                    error: (error) => this.handleError(error, 'Error deleting data')
                });
            }
        });
    }

    onView(id: number): void {
        this.router.navigate(['activity-page/handover-detail/', id]);
    }

    openHistoryModal(id: number): void {
        const modalRef = this.modalService.open(HistoryCompletionModalComponent, {
            size: 'lg',
            centered: true,
            scrollable: true
        });
        modalRef.componentInstance.id = id;
    }

    openApprovalModal(id: number): void {
        const modalRef = this.modalService.open(ApprovalCompletionComponent, {
            size: 'lg',
            centered: true,
            scrollable: true
        });
        modalRef.componentInstance.id = id;
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
        this.loadRatingList();
    }

    onPageSizeChange(): void {
        this.page = 1;
        this.dataCache.clear();
        this.loadRatingList();
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

    // OPTIMIZED METHODS FOR PROGRESS BAR CALCULATIONS

    // Get pre-calculated progress data for an item - FIXED
    getProgressData(item: any): any {
        if (!item || !item.id) {
            return this.getEmptyProgressData();
        }

        const data = this.progressData.get(item.id);

        if (!data) {
            // Re-process this single item if data missing
            try {
                this.processDataForDisplay([item]);
                const reprocessedData = this.progressData.get(item.id);
                return reprocessedData || this.getEmptyProgressData();
            } catch (e) {
                console.error(`Error getting progress data for item ${item.id}:`, e);
                return this.getEmptyProgressData();
            }
        }

        return data;
    }

    // Fallback for missing or invalid data
    getEmptyProgressData(): any {
        return {
            mainProgress: 0,
            supportProgress: 0,
            authProgress: 0,
            handoverProgress: 0,
            totalProgress: 0,
            mainWidth: '0%',
            supportWidth: '0%',
            authWidth: '0%',
            handoverWidth: '0%',
            showMainPercent: false,
            showSupportPercent: false,
            showAuthPercent: false,
            showHandoverPercent: false,
            isFinished: false,
            starRating: 0,
            formattedRating: '0.0',
            starTypes: Array(5).fill(0).map((_, i) => ({ position: i + 1, type: 'empty' }))
        };
    }

    // Parse progress value - FIXED
    parseProgressValue(progressString: string): number {
        if (!progressString) return 0;

        try {
            // Handle both string and number inputs
            let stringValue = String(progressString);

            // Remove non-numeric characters (except decimal point)
            stringValue = stringValue.replace(/[^\d.]/g, '');

            // Parse to float untuk mendukung nilai desimal
            const numericValue = parseFloat(stringValue);

            // Return 0 if NaN
            return isNaN(numericValue) ? 0 : numericValue;
        } catch (e) {
            console.error('Error parsing progress value:', e, progressString);
            return 0;
        }
    }

    // Calculate width for progress bar - FIXED
    calculateProgressWidth(value: number): string {
        if (value === 0) return '0%';
        if (value < 5) return '5%'; // Minimum visible width
        return `${value}%`; // Return percentage directly
    }

    // Calculate star types for all 5 stars at once - FIXED
    calculateStarTypes(rating: number): any[] {
        if (typeof rating !== 'number') {
            console.warn('Invalid rating passed to calculateStarTypes:', rating);
            rating = 0;
        }

        const stars = [];
        for (let i = 1; i <= 5; i++) {
            let type: 'full' | 'half' | 'empty';

            if (i <= Math.floor(rating)) {
                type = 'full';
            } else if (i === Math.ceil(rating) && rating % 1 !== 0) {
                type = 'half';
            } else {
                type = 'empty';
            }

            stars.push({ position: i, type });
        }
        return stars;
    }

    // Navigation methods
    goToProposedChanges(data: any): void {
        if (data && data.id) {
            this.router.navigate([`/activity-page/proposedchanges-detail/${data.id}`]);
        } else {
            this.showNotification('Proposed Changes ID tidak tersedia');
        }
    }

    goToAdditionalDocs(data: any): void {
        if (data && data.id) {
            this.router.navigate([`/activity-page/create-add-number/${data.id}`]);
        } else {
            this.showNotification('Dokumen ID tidak tersedia');
        }
    }

    goToAuthDocs(data: any): void {
        if (data && data.authorization_doc_ids && data.authorization_doc_ids.length > 0) {
            this.router.navigate([`/activity-page/authorization-detail/${data.authorization_doc_ids[0]}`]);
        } else {
            this.showNotification('Dokumen Authorization belum tersedia');
        }
    }

    goToHandoverDocs(data: any): void {
        if (data && data.handover_ids && data.handover_ids.length > 0) {
            this.router.navigate([`/activity-page/handover-detail/${data.handover_ids[0]}`]);
        } else {
            this.showNotification('Dokumen Handover belum tersedia');
        }
    }

    // Simplified notifications
    showNotification(text: string): void {
        this._snackBar.open(text, '', {
            duration: 3000,
            verticalPosition: 'bottom',
            horizontalPosition: 'right',
        });
    }

    // Check if handover is finished (use pre-calculated value)
    isHandoverFinished(data: any): boolean {
        const progressData = this.getProgressData(data);
        return progressData ? progressData.isFinished : false;
    }

    // Finish handover functionality
    finishHandover(handoverId: number): void {
        if (!handoverId) {
            this.showNotification('Handover ID tidak tersedia');
            return;
        }

        // Cek apakah handover sudah selesai
        const selectedData = this.listData.find(data =>
            data.handover_progress &&
            data.handover_progress.length > 0 &&
            data.handover_progress[0].id === handoverId
        );

        if (selectedData && selectedData.all_handover_data && selectedData.all_handover_data.is_finished) {
            this.showNotification('Handover sudah ditandai sebagai selesai');
            return;
        }

        // Ambil data pengguna yang melakukan handover
        const user = this.GodocUser;
        const updatedBy = user?.nik;

        if (!updatedBy) {
            this.showNotification('User belum terautentikasi');
            return;
        }

        // Konfirmasi dengan pengguna sebelum melanjutkan
        Swal.fire({
            title: 'Konfirmasi',
            text: "Apakah Anda yakin ingin menandai handover ini sebagai selesai? Proses ini akan memulai sesi pemberian nilai untuk Handover.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#198754',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Ya, Selesaikan!',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                this.loading = true;
                this.cdr.markForCheck();

                const requestBody = {
                    updated_by: updatedBy
                };

                this.service.put(`/handover/${handoverId}/finish`, requestBody)
                    .pipe(finalize(() => {
                        this.loading = false;
                        this.cdr.markForCheck();
                    }))
                    .subscribe({
                        next: () => {
                            Swal.fire({
                                title: 'Berhasil!',
                                text: 'Handover berhasil ditandai sebagai selesai.',
                                icon: 'success',
                                timer: 2000,
                                timerProgressBar: true,
                                showConfirmButton: false
                            });

                            this.dataCache.clear();
                            this.loadRatingList();
                        },
                        error: (error) => {
                            this.handleError(error, 'Gagal menyelesaikan handover');
                        }
                    });
            }
        });
    }

    // Get star type for rating display - use pre-calculated values
    getStarType(data: any, position: number): 'full' | 'half' | 'empty' {
        const progressData = this.getProgressData(data);
        const star = progressData.starTypes.find((s: any) => s.position === position);
        return star ? star.type : 'empty';
    }

    // Format rating for display - use pre-calculated value
    formatRating(data: any): string {
        const progressData = this.getProgressData(data);
        return progressData.formattedRating;
    }

    // Debug method
    toggleDebugMode(): void {
        this.debugMode = !this.debugMode;
        console.log('Debug mode:', this.debugMode);

        if (this.debugMode) {
            console.group('Debug Data');
            console.log('Progress Data Map:', this.progressData);
            console.log('Current List Data:', this.listData);

            // Sample item check
            if (this.listData.length > 0) {
                const sampleItem = this.listData[0];
                console.log('Sample Item:', sampleItem);
                console.log('Item Processed Data:', this.getProgressData(sampleItem));

                console.log('Progress Values:');
                console.log('Main:', this.parseProgressValue(sampleItem.progress || '0%'));
                console.log('Support:', this.parseProgressValue(sampleItem.progresssupport || '0%'));

                // Auth & Handover
                if (sampleItem.authorization_doc_progress && sampleItem.authorization_doc_progress.length > 0) {
                    console.log('Auth:', this.parseProgressValue(sampleItem.authorization_doc_progress[0].progress || '0%'));
                }

                if (sampleItem.handover_progress && sampleItem.handover_progress.length > 0) {
                    console.log('Handover:', this.parseProgressValue(sampleItem.handover_progress[0].progress || '0%'));
                }
            }
            console.groupEnd();
        }
    }

    // Get tooltip text for rating button
    getTooltipText(data: any): string {
        if (!data || !data.handover_ids || data.handover_ids.length === 0) {
            return 'Handover document not available';
        }

        if (data.all_handover_data?.is_finished !== true) {
            return 'Document must be finished before rating';
        }

        if (!this.getUserApprovalId(data)) {
            return 'You are not authorized to rate this document';
        }

        if (this.hasUserRated(data)) {
            return 'You have already rated this document';
        }

        return 'Rate this document';
    }

    // Check if the current user has already rated the document
    hasUserRated(data: any): boolean {
        if (!data || !data.handovers_with_approvals || data.handovers_with_approvals.length === 0) {
            return false;
        }

        const user = this.tokenStorage.getUser();
        const userAuthId = user?.auth_id;

        if (!userAuthId) {
            return false;
        }

        // Check all handovers and their approvals
        for (const handover of data.handovers_with_approvals) {
            if (!handover.approvals || !Array.isArray(handover.approvals)) {
                continue;
            }

            // Find the approval for the current user
            const userApproval = handover.approvals.find((approval: { auth_id: number }) => approval.auth_id === userAuthId);

            // If found and has a rating, user has already rated
            if (userApproval && userApproval.rating) {
                return true;
            }
        }

        return false;
    }

    // Get the user's approval ID for a document
    getUserApprovalId(data: any): number | null {
        if (!data || !data.handovers_with_approvals || data.handovers_with_approvals.length === 0) {
            return null;
        }

        const user = this.tokenStorage.getUser();
        const userAuthId = user?.auth_id;

        if (!userAuthId) {
            return null;
        }

        // Check all handovers and their approvals
        for (const handover of data.handovers_with_approvals) {
            if (!handover.approvals || !Array.isArray(handover.approvals)) {
                continue;
            }

            // Find the approval for the current user
            const userApproval = handover.approvals.find((approval: { auth_id: number }) => approval.auth_id === userAuthId);

            // If found, return its ID
            if (userApproval) {
                return userApproval.id;
            }
        }

        return null;
    }

    // Add this method to open the rating modal
    openRatingModal(data: any): void {
        if (!data || !data.handover_ids || data.handover_ids.length === 0) {
            this.showNotification('Handover document not available');
            return;
        }

        // Check if the document is finished
        const isFinished = data.all_handover_data && data.all_handover_data.is_finished === true;
        if (!isFinished) {
            Swal.fire({
                title: 'Not Available',
                text: 'Document handover process must be marked as finished before rating',
                icon: 'info',
                confirmButtonColor: '#3085d6'
            });
            return;
        }

        // Check if current user has already rated
        const alreadyRated = this.hasUserRated(data);

        if (alreadyRated) {
            Swal.fire({
                title: 'Already Rated',
                text: 'You have already rated this document',
                icon: 'info',
                confirmButtonColor: '#3085d6'
            });
            return;
        }

        // Check if user has an approval entry for this document
        const approvalId = this.getUserApprovalId(data);
        if (!approvalId) {
            Swal.fire({
                title: 'Not Authorized',
                text: 'You are not authorized to rate this document',
                icon: 'warning',
                confirmButtonColor: '#3085d6'
            });
            return;
        }

        const handoverId = data.handover_ids[0];
        const docTitle = data.project_name || 'Document';

        const modalRef = this.modalService.open(RatingModalComponent, {
            size: 'md',
            centered: true,
            backdrop: 'static',
            keyboard: false
        });

        modalRef.componentInstance.handoverId = handoverId;
        modalRef.componentInstance.docTitle = docTitle;
        modalRef.componentInstance.approvalId = approvalId;

        modalRef.result.then(
            (result) => {
                if (result === 'success') {
                    Swal.fire({
                        title: 'Rating Submitted',
                        text: 'Thank you for providing your feedback!',
                        icon: 'success',
                        timer: 2000,
                        timerProgressBar: true,
                        showConfirmButton: false
                    });

                    // Refresh data to show the new rating
                    this.dataCache.clear();
                    this.loadRatingList();
                } else if (result === 'error') {
                    Swal.fire({
                        title: 'Error',
                        text: 'Failed to submit rating. Please try again.',
                        icon: 'error',
                        confirmButtonColor: '#3085d6'
                    });
                }
            },
            () => {
                // Modal dismissed
            }
        );
    }
}