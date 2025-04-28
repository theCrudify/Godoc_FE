import { Component, OnInit, TemplateRef, ViewChild, HostListener } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { AppService } from 'src/app/shared/service/app.service';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';

@Component({
    selector: 'app-department',
    templateUrl: './department.component.html',
    styleUrls: ['./department.component.scss']
})
export class DepartmentComponent implements OnInit {
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
    idEdit!: number;
    plants: any[] = []; // Array untuk menyimpan data plants
    maxSize = 5; // Untuk pagination
    loading = false; // Untuk preloader

    @ViewChild('modalForm') modalForm!: TemplateRef<any>;


    // Di dalam DepartmentComponent
    public formData = this.fb.group({
        department_name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
        department_code: ['', [Validators.required, Validators.pattern('^[A-Z0-9_]+$')]],
        plant_id: [null, [Validators.required]],
        status: [true] // Tambahkan ini. Default-nya true (aktif).
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
        this.setMaxSize(); // Set maxSize untuk pagination
        this.loadPlants();
        this.loadDepartment(); // Panggil tanpa parameter, gunakan nilai default
    }


    initBreadcrumbs() {
        this.breadCrumbItems = [{ label: 'Master Data' }, { label: 'Department Management', active: true }];
    }

    loadPlants() {
        this.loading = true; // Aktifkan preloader
        this.service.get('/plants').subscribe({
            next: (result: any) => {
                this.plants = result.data;
                console.log("Plants Data:", this.plants);
                this.loading = false; // Nonaktifkan preloader
            },
            error: (error) => {
                this.handleError(error, 'Error fetching plant data');
                this.loading = false; // Nonaktifkan preloader jika error
            }
        });
    }


    loadDepartment() {
        this.loading = true;
        const url = `/departments?page=${this.page}&limit=${this.pageSize}&search=${this.searchTerm}&sort=${this.sortColumn}&direction=${this.sortDirection}`; //Sertakan sort dan direction

        this.service.get(url).subscribe({
            next: (result: any) => {
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
        //  Setelah mengubah sortColumn dan sortDirection, panggil loadDepartment()
        this.loadDepartment();
    }

    onAction(status: string, data?: any) {
        this.statusForm = status;

        if (status === 'edit' && data) {
            this.formData.setValue({
                department_code: data.department_code || '',
                department_name: data.department_name || '',
                plant_id: data.plant_id || null,
                status: data.status ?? true
            });
            this.idEdit = data.id;
        } else {
            this.formData.reset({
                department_code: '',
                department_name: '',
                plant_id: null,
                status: true
            });
            this.idEdit = -1;
        }

        // Buka modal setelah data benar-benar di-set
        this.modal.open(this.modalForm, { size: 'md', backdrop: 'static', centered: true });
    }



    onSubmit() {
        if (this.formData.invalid) {
            this.formData.markAllAsTouched();
            return;
        }

        const plantId = this.formData.value.plant_id;
        if (plantId === null || plantId === undefined || isNaN(Number(plantId))) {
            Swal.fire('Error', 'Please select a valid plant.', 'error');
            return;
        }
        console.log('plant_id sebelum konversi:', this.formData.value.plant_id);

        //  Perbaiki tipe data di sini:
        const payload: {
            department_name?: string | null; // Boleh null
            department_code?: string | null; // Boleh null
            plant_id: number; // TIDAK boleh null (karena sudah divalidasi)
            created_by?: string | null;      // String, bukan number
            updated_by?: string | null;      // String, bukan number
            status?: boolean | null;
        } = {
            department_name: this.formData.value.department_name,
            department_code: this.formData.value.department_code,
            plant_id: Number(plantId),
            status: this.formData.value.status, // Ambil nilai status
        };

        console.log('Payload:', payload); // Log payload

        this.loading = true; // Aktifkan preloader
        if (this.statusForm === 'add') {
            payload.created_by = this.GodocUser.nik; // String, JANGAN konversi
            this.service.post('/departments', payload).subscribe({
                next: () => {
                    Swal.fire('Success', 'Data added successfully!', 'success');
                    this.modal.dismissAll();
                    this.loadDepartment();
                    this.loading = false;
                },
                error: (error) => {
                    this.handleError(error, 'Error adding data');
                    this.loading = false; // Nonaktifkan preloader jika ada error
                }
            });
        } else {
            payload.updated_by = this.GodocUser.nik; // String, JANGAN konversi
            this.service.put(`/departments/${this.idEdit}`, payload).subscribe({
                next: () => {
                    Swal.fire('Success', 'Data updated successfully!', 'success');
                    this.modal.dismissAll();
                    this.loadDepartment();
                    this.loading = false; // Nonaktifkan preloader
                },
                error: (error) => {
                    this.handleError(error, 'Error updating data');
                    this.loading = false; // Nonaktifkan preloader jika ada error
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
                this.service.delete(`/departments/${id}`).subscribe({
                    next: () => {
                        Swal.fire(
                            'Deleted!',
                            'Your data has been deleted.',
                            'success'
                        );
                        this.loadDepartment();
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
            } else if (error.error.errors) { // Contoh:  { errors: { department_name: ["..."], ... } }
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
        this.loadDepartment();
    }


    getShowingText(): string {
        const start = (this.page - 1) * this.pageSize + 1;
        const end = Math.min(this.page * this.pageSize, this.totalRecords);  // Gunakan this.totalRecords
        return `Showing ${start} to ${end} of ${this.totalRecords} entries`; // Gunakan this.totalRecords
    }

    onPageChange(newPage: number): void {
        this.page = newPage;
        this.loadDepartment();
    }

    onPageSizeChange() {
        this.page = 1;
        this.loadDepartment();
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