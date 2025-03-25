import { Component, OnInit, TemplateRef, ViewChild, HostListener } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms'; // Import FormGroup
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { AppService } from 'src/app/shared/service/app.service';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';
import { Subject, of } from 'rxjs'; // Import 'of'
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

// --- INTERFACES (Sangat disarankan) ---
// --- INTERFACES ---
interface UserAuthorization {
  id: number;
  id_authorization: number | null;
  employee_code: string | null;
  employee_name: string | null;
  authorization_status: boolean | null;
  id_section_department: number | null;
  department_id: number | null;
  department_name: string | null;
  section_name: string | null;
  created_by: string;
  is_deleted: boolean;
}

interface Employee {
  id: string;
  employee_name: string;
  employee_display: string;
}

interface SectionDepartment {
  id: number;
  section_display: string;
  department_id: number;
  plant_id: number;
}

interface Role {
  id: number;
  name: string;
}

@Component({
    selector: 'app-department',
  templateUrl: './master-head-department.component.html',
  styleUrl: './master-head-department.component.scss'
})
export class MasterHeadDepartmentComponent implements OnInit {
    pageSize = 10;
    page = 1;
    searchTerm = '';
    sortColumn = 'id';
    sortDirection: 'asc' | 'desc' = 'asc';
    currentUser: any;

    listData: UserAuthorization[] = []; // Gunakan interface
    totalRecords = 0;
    breadCrumbItems!: Array<{}>;
    statusForm!: string;
    idEdit!: number | null;
    employees: Employee[] = []; // Gunakan interface
    sections: SectionDepartment[] = [];  // Gunakan interface
    roles: Role[] = [];      // Gunakan interface
    maxSize = 5;
    loading = false;
    public search$ = new Subject<string>();

    @ViewChild('modalForm') modalForm!: TemplateRef<any>;

    formData!: FormGroup; // Deklarasikan sebagai FormGroup
    searchEmployees$: any;

    constructor(
        private service: AppService,
        private fb: FormBuilder,
        private modal: NgbModal,
        private tokenStorage: TokenStorageService,
    ) {
        // Inisialisasi formData di constructor
        this.formData = this.fb.group({
          // authorization_id
          section_id: [null, [Validators.required]],
          authorization_id: [null, [Validators.required]],
          updated_by: ['']   // Akan diisi saat submit
        });
    }


    get form() {
        return this.formData.controls;
    }

    @HostListener('window:resize', ['$event'])
    onResize(event: any) {
        this.setMaxSize();
    }

    initBreadcrumbs() {
      this.breadCrumbItems = [{ label: 'Master Data' }, { label: 'Authorization', active: true }];
  }


// --- COMPONENT CODE ---
ngOnInit(): void {
  this.currentUser = this.tokenStorage.getUser();
  this.initBreadcrumbs();
  this.setMaxSize();
  this.setupSearch();
  this.loadInitialData();
}

setupSearch(): void {
  this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((searchTerm) => {
          this.searchTerm = searchTerm;
          this.page = 1;
          return this.service.get(`/headDepartments?page=1&limit=${this.pageSize}&search=${searchTerm}`);
      })
  ).subscribe({
      next: (result: any) => {
          this.listData = result.data;
          this.totalRecords = result.pagination.totalCount;
          this.setMaxSize(result.pagination.totalPages);
      },
      error: (error) => this.handleError(error, "Error during search"),
  });
}

loadInitialData(): void {
  this.loadheadDepartments();
  this.loadSections();
  this.loadEmployees();
  this.loadRoles();
}

loadSections(searchTerm: string = '') {
  this.service.get(`/sectiondepartments?search=${searchTerm}`).subscribe({
      next: (result: any) => {
          this.sections = result.data.map((item: any) => ({
              id: item.id,
              section_display: `${item.section_name} - ${item.department_name} (${item.plant_name})`,
              department_id: item.department_id,
              plant_id: item.plant_id,
          }));
      },
      error: (error) => this.handleError(error, 'Error fetching section departments data')
  });
}

loadEmployees(searchTerm: string = '') {
  this.service.get(`/userGodoc?search=${searchTerm}`).subscribe({
      next: (result: any) => {
          this.employees = result.data.map((item: any) => ({
              id: item.id,
              employee_name: item.employee_name,
              employee_display: `${item.employee_code} - ${item.employee_name}`
          }));
      },
      error: (error) => this.handleError(error, 'Error fetching employee data')
  });
}

loadRoles(searchTerm: string = '') {
  this.service.get(`/getAllRoles?search=${searchTerm}`).subscribe({
      next: (result: any) => {
          this.roles = result.data.map((item: any) => ({ id: item.id, name: item.role_name }));
      },
      error: (error) => this.handleError(error, 'Error fetching roles data')
  });
}

loadheadDepartments() {
  this.service.get(`/headDepartments?page=${this.page}&limit=${this.pageSize}&search=${this.searchTerm}`)
      .subscribe({
          next: (result: any) => {
              this.listData = result.data;
              this.totalRecords = result.pagination.totalCount;
              this.setMaxSize(result.pagination.totalPages);
          },
          error: (error) => this.handleError(error, 'Error fetching user data')
      });
}

onEmployeeChange(selectedEmployee: any) {
  if (selectedEmployee) {
    this.formData.patchValue({ 
      employee_code: selectedEmployee.id, 
      employee_name: selectedEmployee.employee_name 
    });
  }
}


onAction(status: string, data?: UserAuthorization) {
  this.statusForm = status;
  this.idEdit = status === 'edit' ? (data?.id ?? null) : null;

  if (status === 'edit' && data) {
      // Pre-populate the form with existing data
      this.formData.patchValue({
          section_id: data.id_section_department,  //  Perbaiki di sini!
          authorization_id: data.id_authorization, // Perbaiki di sini!
          updated_by: this.currentUser.nik
      });
    this.modal.open(this.modalForm, { size: 'md', backdrop: 'static', centered: true }); // Pindahkan!

  } else { // Jika statusForm adalah 'add'
      // Reset the form
       this.formData.reset({
          section_id: null,
          authorization_id: null,
          updated_by: ''
      });
    this.modal.open(this.modalForm, { size: 'md', backdrop: 'static', centered: true });// Pindahkan!
  }
}


onSubmit() {
  if (this.formData.invalid) {
    this.formData.markAllAsTouched();
    return;
  }

  const formValues = this.formData.value;

  // Pengecekan duplicate berdasarkan employee_code
  const selectedSection = this.sections.find(s => s.id === formValues.section_id);

  const payload = {
    section_id: formValues.section_id,
    authorization_id: formValues.authorization_id,
    department_id: selectedSection ? selectedSection.department_id : null,
    plant_id: selectedSection ? selectedSection.plant_id : null,
    updated_by: this.statusForm === 'edit' ? this.currentUser.nik : null,
  };

  console.log("Submitting payload:", payload); // Debug: Lihat payload sebelum dikirim

  const request$ = this.statusForm === 'add'
    ? this.service.post('/headDepartments', payload)
    : this.service.put(`/headDepartments/${this.idEdit}`, payload);

    request$.subscribe({
      next: (response) => {
        console.log("API Response:", response); // Debugging response dari API
        Swal.fire({
          title: "Success",
          text: `Authorization ${this.statusForm === 'add' ? 'added' : 'updated'} successfully!`,
          icon: "success",
        });
        this.modal.dismissAll();
        this.loadheadDepartments();
      },
      error: (error) => {
        console.error("API Error:", error); // Debugging error dari API
    
        // Coba menangkap pesan error dari berbagai kemungkinan lokasi
        let errorMessage = "Terjadi kesalahan, silakan coba lagi.";
        if (error?.error) {
          if (typeof error.error === "string") {
            errorMessage = error.error; // Jika error langsung string
          } else if (error.error.error) {
            errorMessage = error.error.error; // Jika error berbentuk object dengan property `error`
          } else if (error.message) {
            errorMessage = error.message; // Jika error memiliki message
          }
        }
    
        // Menampilkan pesan error yang lebih informatif
        Swal.fire({
          title: "Error",
          text: errorMessage,
          icon: "error",
        });
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
            return 'ri-arrow-up-down-line';
        }
        return this.sortDirection === 'asc' ? 'ri-arrow-up-line' : 'ri-arrow-down-line';
    }

    onSort(column: string) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }
        this.loadheadDepartments(); //  load data setelah sorting
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
                this.service.delete(`/headDepartments/${id}`).subscribe({
                    next: () => {
                        Swal.fire(
                            'Deleted!',
                            'Your data has been deleted.',
                            'success'
                        );
                        this.loadheadDepartments();
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
            errorMessage = 'Cannot connect to the server. Please ensure the server is running.';
        } else if (error.error) {
            if (error.error.message) {
                errorMessage = error.error.message;
            } else if (typeof error.error === 'string') {
                errorMessage = error.error;
            } else if (error.error.errors) {
                // Handle Joi validation
                const validationErrors = error.error.errors;
                errorMessage = Object.keys(validationErrors)
                    .map(field => `${field}: ${validationErrors[field].join(', ')}`)
                    .join('\n');
            }
        } else if (error.message) {
            errorMessage = error.message;
        }

        Swal.fire('Error', errorMessage, 'error');
    }

    //  Pemicu pencarian, dipanggil dari HTML
    onSearch() {
        this.search$.next(this.searchTerm);
    }


    getShowingText(): string {
        const start = (this.page - 1) * this.pageSize + 1;
        const end = Math.min(this.page * this.pageSize, this.totalRecords);
        return `Showing ${start} to ${end} of ${this.totalRecords} entries`;
    }

    onPageChange(newPage: number): void {
        this.page = newPage;
        this.loadheadDepartments();
    }

    onPageSizeChange() {
        this.page = 1; // Reset ke halaman 1
        this.loadheadDepartments();
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