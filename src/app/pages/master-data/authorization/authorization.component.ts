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
  employee_code: string;
  employee_name: string; // Jika digabung
  department_name: string;
  section_name: string;
  plant_code: string;
  role_name: string;
  updated_at: string;
  status: boolean;

  department_id: number;
  section_id: number;
  plant_id: number;
  role_id: number;
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
    templateUrl: './authorization.component.html',
    styleUrls: ['./authorization.component.scss'],
})
export class AuthorizationComponent implements OnInit {
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
            employee_code: [null, [Validators.required]],
            employee_name: [null, [Validators.required]],
            section_id: [null, [Validators.required]],
            role_id: [null, [Validators.required]],
            status: [true],
            created_by: [''], // Akan diisi saat submit
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
          return this.service.get(`/userGodoc?page=1&limit=${this.pageSize}&search=${searchTerm}`);
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
  this.loadUserGodoc();
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
  this.service.get(`/users/employees?search=${searchTerm}`).subscribe({
      next: (result: any) => {
          this.employees = result.data.map((item: any) => ({
              id: item.employee_code,
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

loadUserGodoc() {
  this.service.get(`/userGodoc?page=${this.page}&limit=${this.pageSize}&search=${this.searchTerm}`)
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
          employee_code: data.employee_code,
          employee_name: data.employee_name, // Keep for internal use
          section_id: data.section_id,
          role_id: data.role_id,
          status: data.status
      });
  } else {
      // Reset the form for adding a new record
      this.formData.reset({
          employee_code: null,
          employee_name: null,  // Reset this as well
          section_id: null,
          role_id: null,
          status: true  // Default to active
      });
  }

  this.modal.open(this.modalForm, { size: 'md', backdrop: 'static', centered: true });
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
      employee_code: formValues.employee_code,
      employee_name: formValues.employee_name,
      section_id: formValues.section_id,
      department_id: selectedSection ? selectedSection.department_id : null,
      plant_id: selectedSection ? selectedSection.plant_id : null,
      role_id: formValues.role_id,
      status: formValues.status,
      created_by: this.statusForm === 'add' ? this.currentUser.nik : null,
      updated_by: this.statusForm === 'edit' ? this.currentUser.nik : null,
  };

  const request$ = this.statusForm === 'add'
      ? this.service.post('/userGodoc', payload)
      : this.service.put(`/userGodoc/${this.idEdit}`, payload);

  request$.subscribe({
      next: () => {
          Swal.fire({
              title: "Success",
              text: `Authorization ${this.statusForm === 'add' ? 'added' : 'updated'} successfully!`,
              icon: "success",
          });
          this.modal.dismissAll();
          this.loadUserGodoc();
      },
      error: (error) => this.handleError(error, "Error while saving data"),
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
        this.loadUserGodoc(); //  load data setelah sorting
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
                this.service.delete(`/userGodoc/${id}`).subscribe({
                    next: () => {
                        Swal.fire(
                            'Deleted!',
                            'Your data has been deleted.',
                            'success'
                        );
                        this.loadUserGodoc();
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
        this.loadUserGodoc();
    }

    onPageSizeChange() {
        this.page = 1; // Reset ke halaman 1
        this.loadUserGodoc();
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