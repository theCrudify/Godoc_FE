import { Component, OnInit, TemplateRef, ViewChild, HostListener } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { AppService } from 'src/app/shared/service/app.service';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

@Component({
    selector: 'app-master-subdocument',
    templateUrl: './master-subdocument.component.html',
    styleUrl: './master-subdocument.component.scss'
})
export class MasterSubdocumentComponent implements OnInit {
    // Properti
    pageSize = 10;
    page = 1;
    searchTerm = '';
    sortColumn = 'id'; // Kolom default untuk sorting
    sortDirection: 'asc' | 'desc' = 'asc'; // Arah default
    GodocUser: any;

    listData: any[] = [];
    totalRecords = 0;
    breadCrumbItems!: Array<{}>;
    statusForm!: string;
    idEdit!: number | null;
    departments: any[] = []; // Array untuk menyimpan data departments
    maxSize = 5; // Untuk pagination
    loading = false; // Untuk preloader
    public search$ = new Subject<string>();
    lines: any[] = []; // ✅ Tambahkan property lines

    @ViewChild('modalForm') modalForm!: TemplateRef<any>;


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
        this.setMaxSize(); // Set maxSize untuk pagination
        this.loadedSupportDoc(); // Memuat data awal
        this.loadedLines(); // Memuat 10 data awal

        // Observasi search untuk load data dinamis
        this.search$
            .pipe(
                debounceTime(300),
                distinctUntilChanged(),
                switchMap((searchTerm) => {
                    this.loadedLines(searchTerm); // Muat ulang data berdasarkan input
                    return [];
                })
            )
            .subscribe();
    }


    initBreadcrumbs() {
        this.breadCrumbItems = [{ label: 'Master Data' }, { label: 'Area', active: true }];
    }

    loadedLines(searchTerm: string = '') {
        this.loading = true; // Aktifkan preloader
        this.service.get(`/lines?search=${searchTerm}`).subscribe({
            next: (result: any) => {
                this.lines = result.data.map((item: any) => ({
                    id: item.id, // ID untuk dikirim saat submit
                    line_display: `${item.line} - ${item.code_line}` // Gabungan line + code_line untuk ditampilkan
                }));
                this.loading = false; // Nonaktifkan preloader
            },
            error: (error) => {
                this.handleError(error, 'Error fetching lines data');
                this.loading = false; // Nonaktifkan preloader jika error
            }
        });
    }




    loadedSupportDoc() {
        this.loading = true;
        const url = `/subdocument?page=${this.page}&limit=${this.pageSize}&search=${this.searchTerm}&sort=${this.sortColumn}&direction=${this.sortDirection}`; // Sertakan sort dan direction
        console.log('Fetching URL:', url);

        this.service.get(url).subscribe({
            next: (result: any) => {
                console.log('API Response:', result); // Tambahkan console.log untuk respons API
                this.listData = result.data;
                this.totalRecords = result.pagination.totalCount;
                this.setMaxSize(result.pagination.totalPages);
                this.loading = false;
            },
            error: (error) => {
                this.handleError(error, 'Error fetching department data');
                this.loading = false;
            },
        });
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
            return 'ri-arrow-up-down-line'; // Ikon default jika tidak di-sort
        }
        return this.sortDirection === 'asc' ? 'ri-arrow-up-line' : 'ri-arrow-down-line'; // Ikon up/down
    }

    onSort(column: string) {
        if (this.sortColumn === column) {
            // Jika kolom sama, balik arah
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            // Jika kolom berbeda, set kolom dan arah ke 'asc'
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }
        //  Setelah mengubah sortColumn dan sortDirection, panggil loadedSupportDoc()
        this.loadedSupportDoc();
    }


    public formData = this.fb.group({
        desc: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
        code: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(10)]]
    });

    onAction(status: string, data?: any) {
        this.statusForm = status;

        const formData = status === 'edit' && data
            ? {
                desc: data.desc || '',
                code: data.code || ''
            }
            : {
                desc: '',
                code: ''
            };

        this.formData.reset(formData);

        if (status === 'edit' && data) {
            this.idEdit = data.id;
        } else {
            this.idEdit = null;
        }
        this.modal.open(this.modalForm, { size: 'md', backdrop: 'static', centered: true });
    }

    onSubmit() {
        if (this.formData.invalid) {
            this.formData.markAllAsTouched();
            return;
        }

        const payload: {
            desc?: string | null;
            code?: string | null;
            created_by?: string | null;
            updated_by?: string | null;
        } = {
            desc: this.formData.value.desc,
            code: this.formData.value.code
        };

        console.log('Payload:', payload);

        this.loading = true;
        if (this.statusForm === 'add') {
            payload.created_by = this.GodocUser.nik;
            this.service.post('/subdocument', payload).subscribe({
                next: () => {
                    Swal.fire('Success', 'Report added successfully!', 'success');
                    this.modal.dismissAll();
                    this.loadedSupportDoc();
                    this.loading = false;
                },
                error: (error) => {
                    this.handleError(error, 'Error adding report');
                    this.loading = false;
                }
            });
        } else {
            payload.updated_by = this.GodocUser.nik;

            this.service.put(`/subdocument/${this.idEdit}`, payload).subscribe({
                next: () => {
                    Swal.fire('Success', 'Report updated successfully!', 'success');
                    this.modal.dismissAll();
                    this.loadedSupportDoc();
                    this.loading = false;
                },
                error: (error) => {
                    this.handleError(error, 'Error updating report');
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
                this.service.delete(`/subdocument/${id}`).subscribe({
                    next: () => {
                        Swal.fire(
                            'Deleted!',
                            'Your data has been deleted.',
                            'success'
                        );
                        this.loadedSupportDoc();
                        this.loading = false;
                    },
                    error: (error) => {
                        this.handleError(error, 'Error deleting data');
                        this.loading = false;
                    }
                });
            }
        })
    }

    handleError(error: any, defaultMessage: string) {
        let errorMessage = defaultMessage;

        if (error.status === 0) {
            errorMessage = 'Tidak dapat terhubung ke server. Pastikan server berjalan.';
        } else if (error.error) { // Cek dulu apakah ada error.error

            if (error.error.message) { // Cek apakah ada error.error.message
                errorMessage = error.error.message;  // Ambil dari error.error.message
            } else if (typeof error.error === 'string') {
                errorMessage = error.error;  // Jika error.error adalah string, gunakan itu
            } else if (error.error.errors) { // Contoh:  { errors: { section_name: ["..."], ... } }
                // Jika error.error adalah objek dengan property 'errors' (misalnya, dari validasi Joi)
                const validationErrors = error.error.errors;
                errorMessage = '';
                for (const field in validationErrors) {
                    errorMessage += `${field}: ${validationErrors[field].join(', ')}\n`; // Gabungkan pesan error
                }
            }
        } else if (error.message) { // error.message untuk error HTTP standar
            errorMessage = error.message;
        }

        Swal.fire('Error', errorMessage, 'error');
    }


    onSearch() {
        this.page = 1;
        this.loadedSupportDoc();
    }


    getShowingText(): string {
        const start = (this.page - 1) * this.pageSize + 1;
        const end = Math.min(this.page * this.pageSize, this.totalRecords);  // Gunakan this.totalRecords
        return `Showing ${start} to ${end} of ${this.totalRecords} entries`; // Gunakan this.totalRecords
    }

    onPageChange(newPage: number): void {
        this.page = newPage;
        this.loadedSupportDoc();
    }

    onPageSizeChange() {
        this.page = 1;
        this.loadedSupportDoc();
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
}