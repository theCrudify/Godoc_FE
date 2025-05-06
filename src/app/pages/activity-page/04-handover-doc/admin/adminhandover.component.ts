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
import { ApprovalHandoverComponent } from '../handover-list/modal/approval/handover-modal.component';
import { HistoryHandoverModalComponent } from '../handover-list/modal/history/historyhandover-modal.component';

@Component({
    selector: 'app-handover-list',
    templateUrl: './adminhandover-list.component.html',
    styleUrl: './adminhandover-list.component.scss',
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
export class AdminhandoverListComponent implements OnInit, OnDestroy {
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
        const roleName = this.GodocUser?.role?.role_name;
    
        if (roleName === 'Admin' || roleName === 'Super Admin') {
            this.initBreadcrumbs();
            this.setupSearchDebounce();
            this.setMaxSize();
            this.loadedProposedChanges();
        } else {
            this.router.navigate(['/activity-page/notfound']);
        }
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

    loadedProposedChanges(): void {
        this.loading = true;
        const roleName = this.GodocUser?.role?.role_name;
    
        let url = `/handover?`;
    
        if (roleName === 'Admin') {
            url += `department_id=${this.GodocUser.department.id}&`;
        }
    
        url += `page=${this.page}&limit=${this.pageSize}&search=${this.searchTerm}&sort=${this.sortColumn}&direction=${this.sortDirection}`;
    
        this.service.get(url).pipe(
            finalize(() => this.loading = false)
        ).subscribe({
            next: (result: any) => {
                this.listData = result.data;
                this.totalRecords = result.pagination.totalCount;
                this.setMaxSize(result.pagination.totalPages);
                console.log(result.data);
            },
            error: (error) => this.handleError(error, 'Error fetching handover data')
        });
    }
    

    initBreadcrumbs(): void {
        this.breadCrumbItems = [
            { label: 'Activity' },
            { label: 'Handover Doc', active: true }
        ];
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


    onView(id: number): void {
        // Navigate to view page or open view modal
        console.log(`View item with ID: ${id}`);
        // Contoh implementasi
        this.router.navigate(['activity-page/handover-detail/', id]);
    }


    onAssign(id: number): void {
        // Implementasi assign
        console.log(`Assign for item with ID: ${id}`);
    }

    openHistoryModal(id: number): void {
        const modalRef = this.modalService.open(HistoryHandoverModalComponent, {
            size: 'lg',
            centered: true,
            scrollable: true
        });

        // Passing data ke modal
        modalRef.componentInstance.id = id;
    }

    openApprovalModal(id: number): void {
        const modalRef = this.modalService.open(ApprovalHandoverComponent, {
            size: 'lg',
            centered: true,
            scrollable: true
        });

        // Passing data ke modal
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