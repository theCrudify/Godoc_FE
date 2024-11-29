import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { AppService } from 'src/app/shared/service/app.service';
import { TokenStorageService } from "src/app/core/services/token-storage.service";
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-department',
  templateUrl: './department.component.html',
  styleUrl: './department.component.scss'
})

export class DepartmentComponent implements OnInit {
  // Pagination and sorting state
  pageSize = 10;
  page = 1;
  searchTerm = '';
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  currentUser: any; // Store logged-in user data
  employeeMap: Map<string, string> = new Map(); // Map employee_code -> employee_name

  listData: any[] = [];
  filteredData: any[] = [];
  totalRecords = 0;
  breadCrumbItems!: Array<{}>;
  statusForm!: string;
  idEdit!: number;

  @ViewChild('modalForm') modalForm!: TemplateRef<any>;

  public formData = this.fb.group({
    department: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]], // Validate 'department'
    code_department: ['', [Validators.required, Validators.pattern('^[A-Z0-9_]+$')]], // Validate 'code_department'
  });

  constructor(
    private service: AppService,
    private fb: FormBuilder,
    private modal: NgbModal,
    private tokenStorage: TokenStorageService,
  ) {}

  get form() {
    return this.formData.controls;
  }

  ngOnInit(): void {
    this.currentUser = this.tokenStorage.getUser(); // Get user data
    console.log("Current User: ", this.currentUser);

    this.initBreadcrumbs();
    this.loadData(); // Load all necessary data
  }

  initBreadcrumbs() {
    this.breadCrumbItems = [{ label: 'Master Data' }, { label: 'Department Management', active: true }];
  }

  async loadData() {
    console.log('Loading all data...');
    forkJoin({
      employees: this.service.get('/user'),
      departments: this.service.get('/getAllDepartment')
    }).subscribe({
      next: ({ employees, departments }) => {
        this.processEmployeeData(employees.data || []);
        this.ondepartmentDataLoaded(departments || []);
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.handleError(error, 'Error loading data');
      }
    });
  }
  
  processEmployeeData(employeeData: any[]) {
    console.log('Processing employee data...');
    this.employeeMap.clear(); // Clear existing data
    employeeData.forEach((employee: any) => {
      if (employee.employee_code && employee.employee_name) {
        this.employeeMap.set(employee.employee_code.toString(), employee.employee_name);
      } else {
        console.warn('Incomplete employee data:', employee);
      }
    });
    console.log('Employee map created successfully:', this.employeeMap);
  }
  

  loadEmployeeData(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('Fetching employee data...');
      this.employeeMap.clear(); // Clear existing data

      this.service.get('/user').subscribe({
        next: (response: any) => {
          const employeeData = response.data || [];
          if (!Array.isArray(employeeData)) {
            console.error('Invalid employee data format:', employeeData);
            return reject(new Error('Invalid employee data format'));
          }

          employeeData.forEach((employee: any) => {
            if (employee.employee_code && employee.employee_name) {
              this.employeeMap.set(employee.employee_code.toString(), employee.employee_name);
            } else {
              console.warn('Incomplete employee data:', employee);
            }
          });

          console.log('Employee map created successfully:', this.employeeMap);
          resolve();
        },
        error: (error) => {
          console.error('Error fetching employee data:', error);
          this.handleError(error, 'Error fetching employee data');
          reject(error);
        },
      });
    });
  }

  loadProductData() {
    console.log('Fetching department data...');
    this.service.get('/getAllDepartment').subscribe({
      next: (result: any[]) => {
        console.log('department data fetched successfully:', result);
        this.ondepartmentDataLoaded(result);
      },
      error: (error) => {
        console.error('Error fetching department data:', error);
        this.handleError(error, 'Error fetching department data');
      },
    });
  }

  ondepartmentDataLoaded(data: any[]): void {
    console.log('Processing department data...');
    if (this.employeeMap.size === 0) {
      console.warn('Employee data is not loaded. Ensure loadEmployeeData is called first.');
    }
  
    this.listData = data.map((department: any, index: number) => ({
      no: index + 1, // Tambahkan properti no untuk setiap item
      id: department?.id || 'N/A',
      department: (department?.department || '').trim(),
      code_department: (department?.code_department || '').toUpperCase(),
      created_date: department?.created_date ? this.formatDateTime(new Date(department.created_date)) : 'N/A',
      is_deleted: !!department?.is_deleted,
      created_by: this.employeeMap.get(String(department?.created_by || '').trim()) || 'Unknown',
      updated_at: department?.updated_at ? this.formatDateTime(new Date(department.updated_at)) : 'N/A'
    }));
  
    this.filteredData = [...this.listData];
    this.totalRecords = this.filteredData.length;
    console.log('Processed department data:', this.listData);
  }
  
  
  // Helper function untuk memformat tanggal dan waktu
  private formatDateTime(date: Date): string {
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false, // Format 24 jam
    });
    return `${formattedDate} at ${formattedTime}`;
  }
  
  
 
  getSortIcon(column: string): string {
    return this.sortColumn !== column
      ? 'ri-arrow-up-down-line'
      : this.sortDirection === 'asc'
      ? 'ri-arrow-up-line'
      : 'ri-arrow-down-line';
  }

  getSortedData() {
    return [...this.filteredData].sort((a, b) => {
      const valueA = a[this.sortColumn] ?? '';
      const valueB = b[this.sortColumn] ?? '';
      if (valueA == null && valueB == null) return 0;
      if (valueA == null) return this.sortDirection === 'asc' ? 1 : -1;
      if (valueB == null) return this.sortDirection === 'asc' ? -1 : 1;
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return this.sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
      }
      return this.sortDirection === 'asc'
        ? valueA.toString().localeCompare(valueB.toString())
        : valueB.toString().localeCompare(valueA.toString());
    });
  }

  addData() {
    const payload = {
      ...this.formData.value,
      created_by: this.currentUser.nik,
    };

    this.service.post('/addDepartment', payload).subscribe({
      next: () => {
        Swal.fire('Success', 'Data added successfully!', 'success');
        this.modal.dismissAll();
        this.loadProductData();
      },
      error: (error) => this.handleError(error, 'Error adding data'),
    });
  }

  editData() {
    const payload = {
      ...this.formData.value,
      created_by: Number(this.currentUser.nik),
    };

    this.service.put(`/updateDepartment/${this.idEdit}`, payload).subscribe({
      next: () => {
        Swal.fire('Success', 'Data updated successfully!', 'success');
        this.modal.dismissAll();
        this.loadProductData();
      },
      error: (error) => this.handleError(error, 'Error updating data'),
    });
  }

  onDelete(id: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed) {
        this.service.delete(`/softDeleteDepartment/${id}`).subscribe({
          next: () => {
            Swal.fire('Deleted!', 'Data has been deleted.', 'success');
            this.loadProductData();
          },
          error: (error) => this.handleError(error, 'Error deleting data'),
        });
      }
    });
  }

  handleError(error: any, message: string) {
    const errorMsg = error.error?.message || message;
    Swal.fire('Error', errorMsg, 'error');
  }

onAction(status: string, data?: any) {
    this.statusForm = status === 'add' ? 'Add' : 'Edit';
    if (status === 'edit' && data) {
      this.formData.patchValue({
        department: data.department, // Pastikan sesuai dengan properti dari API
        code_department: data.code_department,
      });
      this.idEdit = data.id;
    } else {
      this.formData.reset({
        department: '',
        code_department: '',
      });
    }
    this.modal.open(this.modalForm, { size: 'm', backdrop: 'static', centered: true });
  }

  onSubmit() {
    if (this.formData.invalid) {
      this.formData.markAllAsTouched();
      return;
    }
    this.statusForm === 'Add' ? this.addData() : this.editData();
  }
  
  onSearch() {
    const searchLower = this.searchTerm.toLowerCase();
    this.filteredData = this.listData.filter((data) =>
      Object.values(data).some((value) =>
        value?.toString().toLowerCase().includes(searchLower)
      )
    );
    if (this.sortColumn) this.filteredData = this.getSortedData();
    this.totalRecords = this.filteredData.length;
  }

  onSort(column: string) {
    this.sortDirection = this.sortColumn === column ? this.toggleSortDirection() : 'asc';
    this.sortColumn = column;
  
    if (column === 'no') {
      this.filteredData.sort((a, b) => this.sortDirection === 'asc' ? a.no - b.no : b.no - a.no);
    } else {
      this.filteredData = this.getSortedData();
    }
  }
  

  toggleSortDirection(): 'asc' | 'desc' {
    return this.sortDirection === 'asc' ? 'desc' : 'asc';
  }
  
  getShowingText(): string {
    const start = (this.page - 1) * this.pageSize + 1;
    const end = Math.min(this.page * this.pageSize, this.totalRecords);
    return `Showing ${start} to ${end}`;
  }

 
  onPageChange(newPage: number): void {
    this.page = newPage;
  }

  onPageSizeChange() {
    this.page = 1;
  }
  
}