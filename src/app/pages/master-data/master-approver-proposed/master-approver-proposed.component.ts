import { Component, OnInit, OnDestroy, TemplateRef, ViewChild, HostListener } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { AppService } from 'src/app/shared/service/app.service';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
    selector: 'app-template-approval',
    templateUrl: './master-approver-proposed.component.html',
    styleUrl: './master-approver-proposed.component.scss'
})
export class MasterApproverProposedComponent implements OnInit, OnDestroy {
    // Properties
    pageSize = 10;
    page = 1;
    searchTerm = '';
    sortColumn = 'id';
    sortDirection: 'asc' | 'desc' = 'asc';
    GodocUser: any;

    listData: any[] = [];
    allData: any[] = [];
    filteredData: any[] = [];
    totalRecords = 0;
    breadCrumbItems!: Array<{}>;
    statusForm!: string;
    idEdit!: number;
    maxSize = 5;
    loading = false;
    
    // Search and filter subjects for debouncing
    private searchSubject = new Subject<string>();
    private filterSubject = new Subject<void>();

    // Filter properties
    filterIsActive: boolean | undefined = undefined;
    filterLineCode = '';
    filterModelType = '';

    // Model types dropdown
    modelTypes = [
        { value: 'department', label: 'Department' },
        { value: 'section', label: 'Section' }
    ];

    @ViewChild('modalForm') modalForm!: TemplateRef<any>;

    public formData = this.fb.group({
        template_name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
        line_code: ['', [Validators.maxLength(50)]],
        need_engineering_approval: [false],
        need_production_approval: [false],
        step_order: [1, [Validators.required, Validators.min(0)]],
        actor_name: ['', [Validators.required, Validators.maxLength(255)]],
        model_type: ['', [Validators.required]],
        section_id: [null],
        use_dynamic_section: [false],
        use_line_section: [false],
        is_active: [true],
        priority: [0, [Validators.min(0)]],
        description: ['', [Validators.maxLength(500)]]
    });

    constructor(
        private service: AppService,
        private fb: FormBuilder,
        private modal: NgbModal,
        private tokenStorage: TokenStorageService,
    ) { }

    get form() {
        return this.formData.controls;
    }

    @HostListener('window:resize', ['$event'])
    onResize(event: any) {
        this.setMaxSize();
    }

    ngOnInit(): void {
        this.GodocUser = this.tokenStorage.getUser();
        console.log("Current User: ", this.GodocUser);

        this.initBreadcrumbs();
        this.setMaxSize();
        this.setupSearchDebounce();
        this.loadAllData();
    }

    ngOnDestroy(): void {
        this.searchSubject.complete();
        this.filterSubject.complete();
    }

    initBreadcrumbs() {
        this.breadCrumbItems = [
            { label: 'Master Data' }, 
            { label: 'Template Approval Management', active: true }
        ];
    }

    setupSearchDebounce() {
        // Setup search debouncing
        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged()
        ).subscribe(searchTerm => {
            this.searchTerm = searchTerm;
            this.page = 1;
            this.applyFiltersAndSearch();
        });

        // Setup filter debouncing
        this.filterSubject.pipe(
            debounceTime(100)
        ).subscribe(() => {
            this.page = 1;
            this.applyFiltersAndSearch();
        });
    }

    loadAllData() {
        this.loading = true;
        
        // Load all data without pagination for frontend filtering
        const url = `/approverproposed?page=1&limit=10000&sort=${this.sortColumn}&direction=${this.sortDirection}`;

        console.log('Loading all data:', url);

        this.service.get(url).subscribe({
            next: (result: any) => {
                console.log('API Response:', result);
                this.allData = result.data || [];
                this.applyFiltersAndSearch();
                this.loading = false;
            },
            error: (error) => {
                this.handleError(error, 'Error fetching template approval data');
                this.loading = false;
            },
        });
    }

    applyFiltersAndSearch() {
        console.log('Applying filters and search...');
        console.log('Search term:', this.searchTerm);
        console.log('Filters:', {
            isActive: this.filterIsActive,
            lineCode: this.filterLineCode,
            modelType: this.filterModelType
        });

        let filtered = [...this.allData];

        // 1. Apply status filter (Active/Inactive)
        if (this.filterIsActive !== undefined) {
            filtered = filtered.filter(item => item.is_active === this.filterIsActive);
            console.log(`After status filter (${this.filterIsActive}):`, filtered.length);
        }

        // 2. Apply model type filter
        if (this.filterModelType && this.filterModelType.trim()) {
            filtered = filtered.filter(item => 
                item.model_type && 
                item.model_type.toLowerCase() === this.filterModelType.toLowerCase()
            );
            console.log(`After model type filter (${this.filterModelType}):`, filtered.length);
        }

        // 3. Apply line code specific filter
        if (this.filterLineCode && this.filterLineCode.trim()) {
            const lineCodeSearch = this.filterLineCode.toLowerCase().trim();
            filtered = filtered.filter(item => 
                item.line_code && 
                item.line_code.toLowerCase().includes(lineCodeSearch)
            );
            console.log(`After line code filter (${this.filterLineCode}):`, filtered.length);
        }

        // 4. Apply general search across multiple fields
        if (this.searchTerm && this.searchTerm.trim()) {
            const searchLower = this.searchTerm.toLowerCase().trim();
            console.log('Applying general search:', searchLower);
            
            filtered = filtered.filter(item => {
                if (!item) return false;
                
                // Search in multiple fields
                const searchFields = [
                    item.template_name,
                    item.actor_name,
                    item.description,
                    item.model_type,
                    // Don't include line_code here since it has its own filter
                    item.step_order?.toString(),
                    item.priority?.toString()
                ];
                
                return searchFields.some(field => {
                    if (field === null || field === undefined) return false;
                    return String(field).toLowerCase().includes(searchLower);
                });
            });
            console.log(`After general search (${this.searchTerm}):`, filtered.length);
        }

        // Apply sorting
        this.applySorting(filtered);

        // Store filtered data
        this.filteredData = filtered;
        this.totalRecords = filtered.length;

        // Apply pagination
        this.applyPagination();

        console.log('Final results:', {
            total: this.totalRecords,
            displayed: this.listData.length,
            page: this.page,
            pageSize: this.pageSize
        });
    }

    applySorting(data: any[]) {
        data.sort((a, b) => {
            let aVal = a[this.sortColumn];
            let bVal = b[this.sortColumn];
            
            // Handle null/undefined values
            if (aVal === null || aVal === undefined) aVal = '';
            if (bVal === null || bVal === undefined) bVal = '';
            
            // Convert to string for comparison
            aVal = String(aVal).toLowerCase();
            bVal = String(bVal).toLowerCase();
            
            if (this.sortDirection === 'asc') {
                return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            } else {
                return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
            }
        });
    }

    applyPagination() {
        const startIndex = (this.page - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        this.listData = this.filteredData.slice(startIndex, endIndex);

        // Update pagination settings
        const totalPages = Math.ceil(this.totalRecords / this.pageSize);
        this.setMaxSize(totalPages);
    }

    // Event handlers
    onSearchInput(event: any) {
        const value = event.target.value || '';
        this.searchSubject.next(value);
    }

    onFilterChange() {
        this.filterSubject.next();
    }

    onLineCodeFilterChange() {
        // Immediate filter for line code since it's specific
        this.filterSubject.next();
    }

    clearFilters() {
        this.searchTerm = '';
        this.filterIsActive = undefined;
        this.filterLineCode = '';
        this.filterModelType = '';
        this.page = 1;
        
        // Clear the search input field
        const searchInput = document.querySelector('.search') as HTMLInputElement;
        if (searchInput) {
            searchInput.value = '';
        }
        
        this.applyFiltersAndSearch();
    }

    onSort(column: string) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }

        console.log(`Sorting by ${column} ${this.sortDirection}`);
        this.applyFiltersAndSearch();
    }

    onPageChange(newPage: number): void {
        this.page = newPage;
        this.applyPagination();
    }

    onPageSizeChange() {
        this.page = 1;
        this.applyPagination();
    }

    // Search methods for compatibility
    onSearch() {
        // Direct search trigger (for compatibility)
        this.page = 1;
        this.applyFiltersAndSearch();
    }

    performSearch() {
        this.applyFiltersAndSearch();
    }

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }) + ' ' + date.toLocaleTimeString('en-US');
    }

    getSortIcon(column: string): string {
        if (this.sortColumn !== column) {
            return 'ri-arrow-up-down-line';
        }
        return this.sortDirection === 'asc' ? 'ri-arrow-up-line' : 'ri-arrow-down-line';
    }

    onAction(status: string, data?: any) {
        this.statusForm = status;

        if (status === 'edit' && data) {
            this.formData.setValue({
                template_name: data.template_name || '',
                line_code: data.line_code || '',
                need_engineering_approval: data.need_engineering_approval ?? false,
                need_production_approval: data.need_production_approval ?? false,
                step_order: data.step_order || 1,
                actor_name: data.actor_name || '',
                model_type: data.model_type || '',
                section_id: data.section_id || null,
                use_dynamic_section: data.use_dynamic_section ?? false,
                use_line_section: data.use_line_section ?? false,
                is_active: data.is_active ?? true,
                priority: data.priority || 0,
                description: data.description || ''
            });
            this.idEdit = data.id;
        } else {
            this.formData.reset({
                template_name: '',
                line_code: '',
                need_engineering_approval: false,
                need_production_approval: false,
                step_order: 1,
                actor_name: '',
                model_type: '',
                section_id: null,
                use_dynamic_section: false,
                use_line_section: false,
                is_active: true,
                priority: 0,
                description: ''
            });
            this.idEdit = -1;
        }

        this.modal.open(this.modalForm, { size: 'lg', backdrop: 'static', centered: true });
    }

    onSubmit() {
        if (this.formData.invalid) {
            this.formData.markAllAsTouched();
            return;
        }

        const payload: any = {
            template_name: this.formData.value.template_name,
            line_code: this.formData.value.line_code || null,
            need_engineering_approval: this.formData.value.need_engineering_approval,
            need_production_approval: this.formData.value.need_production_approval,
            step_order: Number(this.formData.value.step_order),
            actor_name: this.formData.value.actor_name,
            model_type: this.formData.value.model_type,
            section_id: this.formData.value.section_id ? Number(this.formData.value.section_id) : null,
            use_dynamic_section: this.formData.value.use_dynamic_section,
            use_line_section: this.formData.value.use_line_section,
            is_active: this.formData.value.is_active,
            priority: Number(this.formData.value.priority),
            description: this.formData.value.description || null,
        };

        this.loading = true;
        if (this.statusForm === 'add') {
            payload.created_by = this.GodocUser.nik;
            this.service.post('/approverproposed', payload).subscribe({
                next: () => {
                    Swal.fire('Success', 'Template approval added successfully!', 'success');
                    this.modal.dismissAll();
                    this.refreshData();
                    this.loading = false;
                },
                error: (error: any) => {
                    this.handleError(error, 'Error adding template approval');
                    this.loading = false;
                }
            });
        } else {
            payload.created_by = this.GodocUser.nik;
            this.service.put(`/approverproposed/${this.idEdit}`, payload).subscribe({
                next: () => {
                    Swal.fire('Success', 'Template approval updated successfully!', 'success');
                    this.modal.dismissAll();
                    this.refreshData();
                    this.loading = false;
                },
                error: (error: any) => {
                    this.handleError(error, 'Error updating template approval');
                    this.loading = false;
                }
            });
        }
    }

    onDelete(id: number) {
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
                this.service.delete(`/approverproposed/${id}`).subscribe({
                    next: () => {
                        Swal.fire(
                            'Deleted!',
                            'Template approval has been deleted.',
                            'success'
                        );
                        this.refreshData();
                        this.loading = false;
                    },
                    error: (error) => {
                        this.handleError(error, 'Error deleting template approval');
                        this.loading = false;
                    }
                });
            }
        });
    }

    onToggleStatus(id: number) {
        Swal.fire({
            title: 'Toggle Status',
            text: "Are you sure you want to change the status?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, toggle it!'
        }).then((result) => {
            if (result.isConfirmed) {
                this.loading = true;
                const payload = { updated_by: this.GodocUser.nik };
                this.service.patch(`/approverproposed/${id}/toggle-status`, payload).subscribe({
                    next: (response: any) => {
                        Swal.fire('Success', response.message, 'success');
                        this.refreshData();
                        this.loading = false;
                    },
                    error: (error: any) => {
                        this.handleError(error, 'Error toggling status');
                        this.loading = false;
                    }
                });
            }
        });
    }

    handleError(error: any, defaultMessage: string) {
        let errorMessage = defaultMessage;

        if (error.status === 0) {
            errorMessage = 'Tidak dapat terhubung ke server. Pastikan server berjalan.';
        } else if (error.error) {
            if (error.error.message) {
                errorMessage = error.error.message;
            } else if (typeof error.error === 'string') {
                errorMessage = error.error;
            } else if (error.error.errors) {
                const validationErrors = error.error.errors;
                errorMessage = '';
                for (const field in validationErrors) {
                    errorMessage += `${field}: ${validationErrors[field].join(', ')}\n`;
                }
            }
        } else if (error.message) {
            errorMessage = error.message;
        }

        Swal.fire('Error', errorMessage, 'error');
    }

    refreshData() {
        this.loadAllData();
    }

    getShowingText(): string {
        const start = this.totalRecords > 0 ? (this.page - 1) * this.pageSize + 1 : 0;
        const end = Math.min(this.page * this.pageSize, this.totalRecords);
        
        let filterText = '';
        const activeFilters = [];
        
        if (this.searchTerm) activeFilters.push(`search: "${this.searchTerm}"`);
        if (this.filterIsActive !== undefined) activeFilters.push(`status: ${this.filterIsActive ? 'Active' : 'Inactive'}`);
        if (this.filterModelType) activeFilters.push(`model: ${this.filterModelType}`);
        if (this.filterLineCode) activeFilters.push(`line code: "${this.filterLineCode}"`);
        
        if (activeFilters.length > 0) {
            filterText = ` (filtered by ${activeFilters.join(', ')})`;
        }
        
        return `Showing ${start} to ${end} of ${this.totalRecords} entries${filterText}`;
    }

    setMaxSize(totalPages?: number) {
        let baseMaxSize = 5;

        if (window.innerWidth < 576) {
            baseMaxSize = 2;
        } else if (window.innerWidth < 768) {
            baseMaxSize = 3;
        } else if (window.innerWidth < 992) {
            baseMaxSize = 5;
        } else {
            baseMaxSize = 5;
        }

        if (totalPages !== undefined) {
            this.maxSize = Math.min(totalPages, baseMaxSize);
        } else {
            this.maxSize = baseMaxSize;
        }
    }

    getModelTypeLabel(value: string): string {
        const found = this.modelTypes.find(mt => mt.value === value);
        return found ? found.label : value;
    }
}