import { Component, OnInit, TemplateRef, ViewChild ,EventEmitter} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { AppService } from 'src/app/shared/service/app.service';
import { TokenStorageService } from "src/app/core/services/token-storage.service";
import { Router } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, forkJoin, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-authorization',
  templateUrl: './authorization.component.html',
  styleUrls: ['./authorization.component.scss'],
})
export class AuthorizationComponent implements OnInit {
  // Pagination, sorting, and state
  pageSize = 10;
  page = 1;
  searchTerm = '';
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  currentUser: any;
  listData: any[] = [];
  filteredData: any[] = [];
  totalRecords = 0;
  idEdit!: number;
  statusForm!: string;

  listUsers: any[] = [];
  listDepartments: any[] = [];
  listRoles: any[] = [];
  listSite: any[] = [];

  editData: any = {};
  // Form properties
  breadCrumbItems!: Array<{}>;
 
  selectedUser: any;
  searchControl = new EventEmitter<string>();

    // Form data properties
    employee_code = '';
    employee_name = '';
    departement_id: number | null = null;
    role_id: number | null = null;
    whatsapp_number = '';
    email_address = '';
    site: number | null = null;

  @ViewChild('modalForm') modalForm!: TemplateRef<any>;
  @ViewChild('editModal') editModal!: TemplateRef<any>;


  formData = this.fb.group({
    site: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    code_site: ['', [Validators.required, Validators.pattern('^[A-Z0-9_]+$')]],
  });

  constructor(
    private service: AppService,
    private fb: FormBuilder,
    private modal: NgbModal,
    private tokenStorage: TokenStorageService,
    private modalService: NgbModal,
    private router: Router

  ) {}

  get form() {
    return this.formData.controls;
  }

    ngOnInit(): void {
      this.currentUser = this.tokenStorage.getUser();
      this.loadSiteData();
      this.initBreadcrumbs();
      this.loadDataAll();
      this.currentUser = this.tokenStorage.getUser();
      this.setupSearchDebounce(); // Inisialisasi debounce
    }

    setupSearchDebounce(): void {
      this.searchControl
        .pipe(
          debounceTime(300),
          distinctUntilChanged(),
          switchMap((searchTerm) =>
            this.service.get(`/getAlluser?search=${searchTerm}`).pipe(
              catchError((error) => {
                console.error('Error fetching users:', error);
                return of([]);
              })
            )
          )
        )
        .subscribe((response: any) => {
          this.listUsers = response.data || [];
        });
    }

    loadDataAll(): void {
      forkJoin([
        this.service.get('/product'),
        this.service.get('/getAllsite'),
        this.service.get('/getDepartmnentType'),
        this.service.get('/role'),
      ]).subscribe({
        next: ([products, sites, departments, roles]) => {
          // Proses data dari API
          this.listSite = sites.map((item: any) => ({
            id: item.id,
            name: item.site,
          }));
    
          this.listDepartments = departments.map((item: any) => ({
            id: item.id,
            name: item.department,
          }));
    
          this.listRoles = roles.data || [];
    
          console.log('Data Loaded Successfully');
        },
        error: (error) => {
          console.error('Error fetching data:', error);
        },
      });
    }

    loadSiteData(): void {
      this.service.get('/getUser').subscribe({
          next: (result: any) => {
              if (!result?.data || result.data.length === 0) {
                  console.warn('API returned no data.');
                  this.listData = [];
                  this.filteredData = [];
                  this.totalRecords = 0;
                  return;
              }

              // Transformasi data API
              this.listData = result.data.map((item: { id:any;employee_code: any; employee_name: any; department: any; role: any; site: any; status: any; }, index: number) => ({
                  no: index + 1,
                  id:item.id,
                  employee_code: item.employee_code,
                  employee_name: item.employee_name,
                  department: item.department,
                  role: item.role,
                  site: item.site,
                  status: item.status ? 'Active' : 'Inactive',
              }));

              this.totalRecords = this.listData.length;

              // Hitung data awal yang ditampilkan
              const startIndex = (this.page - 1) * this.pageSize;
              const endIndex = this.page * this.pageSize;
              this.filteredData = this.listData.slice(startIndex, endIndex);

              console.log('Loaded Data:', this.listData);
              console.log('Filtered Data:', this.filteredData);
          },
          error: (err) => {
              console.error('Error loading data:', err);
          },
      });
  }


  
    formatDateTime(date: string | Date | null): string {
      if (!date) return 'N/A';
      const d = new Date(date);
      return `${d.toLocaleDateString('en-US')} at ${d.toLocaleTimeString('en-US', { hour12: false })}`;
    }


    onSubmit() {
    
      const userData = {
        // employee_code: this.selectedUser.lg_nik,

        employee_code: this.selectedUser.lg_nik,
        employee_name:this.selectedUser.lg_name,
        departement_id:this.departement_id,
        role_id: this.role_id,
        whatsapp_number:this.selectedUser.n_phone ,
        email_address: this.selectedUser.lg_email_aio,
        site: String(this.site)

      };
      console.info("user add: ", this.selectedUser)
      console.log('User Data being submitted:', userData); // Log data yang dikirim
    
      this.service.post('/addUser', userData).subscribe(
        (response: any) => {
          console.log('API Response:', response); // Log respons sukses dari API
          Swal.fire('Success', 'User successfully created', 'success').then(() => {
            this.modal.dismissAll(); // Tutup modal
            console.log('Modal closed successfully'); // Log setelah modal ditutup
            this.loadSiteData(); // Muat ulang data untuk memperbarui tabel
            console.log('Data reloaded successfully'); // Log pemuatan ulang data
          });
        },
        (error) => {
          console.error('API Error:', error); // Log error API
          Swal.fire('Error', 'Failed to create user', 'error');
        }
      );
    }

    onDelete(id: number): void {
      console.log('Attempting to delete ID:', id); // Log ID yang akan dihapus
    
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
          console.log('User confirmed deletion for ID:', id); // Log konfirmasi pengguna
    
          // Memanggil API penghapusan
          this.service.delete(`/deleteUser/${id}`).subscribe({
            next: () => {
              console.log('Delete API call successful for ID:', id); // Log sukses API
              Swal.fire('Deleted!', 'Your data has been deleted.', 'success');
    
              // Memuat ulang data
              this.loadSiteData();
              console.log('Data reloaded after deletion'); // Log pemuatan ulang data
            },
            error: (error) => {
              console.error('Error during deletion:', error); // Log error API
              this.handleError(error, 'Error deleting data');
            },
          });
        } else {
          console.log('Deletion canceled for ID:', id); // Log jika penghapusan dibatalkan
        }
      });
    }


    Edit(id: number): void {
      console.log('Fetching data for ID:', id); // Log ID yang dipilih
    
      this.service.get(`/user/${id}`).subscribe({
        next: (data: any) => {
          console.log('Data fetched:', data); // Debugging log
          this.editData = data; // Assign data untuk digunakan di modal
          this.idEdit = id; // Simpan ID ke properti
          this.modalService.open(this.editModal); // Buka modal edit
        },
        error: (error) => {
          console.error('Error fetching data for editing:', error); // Log error
          Swal.fire('Error', 'Failed to load user data!', 'error');
        },
      });
    }
    
    // console.log('Data fetched:', this.idEdit); // Debugging log
    
    onEditSubmit(): void {
      const userData = {
        employee_code: this.editData.employee_code,
        employee_name: this.editData.employee_name,
        departement_id: this.editData.departement_id,
        role_id: this.editData.role_id,
        whatsapp_number: this.editData.whatsapp_number,
        email_address: this.editData.email_address,
        site: String(this.editData.site),
      };
    
      console.log('User Data being submitted:', userData); // Log data yang dikirim
    
      this.service.put(`/updateUser/${this.idEdit}`, userData).subscribe({
        next: (response: any) => {
          console.log('API Response:', response); // Log respons sukses
          Swal.fire('Success', 'User updated successfully!', 'success').then(() => {
            this.modalService.dismissAll(); // Tutup modal
            console.log('Modal closed successfully'); // Log setelah modal ditutup
            this.loadSiteData(); // Muat ulang data
            console.log('Data reloaded successfully'); // Log pemuatan ulang data
          });
        },
        error: (error) => {
          console.error('API Error:', error); // Log error API
          Swal.fire('Error', 'Failed to update user.', 'error');
        },
      });
    }
    



    

    handleError(error: any, defaultMessage: string) {
      const errorMessage = error.error?.message || defaultMessage;
      console.error('Error Message:', errorMessage); // Log pesan error
      Swal.fire('Error', errorMessage, 'error');
    }
    

    openForm(status: string, data?: any) {
      this.idEdit = status === 'edit' ? data.id : undefined;
      this.statusForm = status;
      this.formData.reset(data ? { site: data.site, code_site: data.code_site } : {});
      this.modal.open(this.modalForm, { size: 'm', backdrop: 'static', centered: true });
    }
    
    onAction(status: string, data?: any) {
      this.statusForm = status === 'add' ? 'Add' : 'Edit';
      if (status === 'edit' && data) {
        this.formData.patchValue({
          site: data.site, // Pastikan sesuai dengan properti dari API
          code_site: data.code_site,
        });
        this.idEdit = data.id;
      } else {
        this.formData.reset({
          site: '',
          code_site: '',
        });
      }
      this.modal.open(this.modalForm, { size: 'm', backdrop: 'static', centered: true });
    }
    

    onSearch() {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredData = this.listData.filter((item) =>
        Object.values(item).some((value) => value?.toString().toLowerCase().includes(searchLower))
      );
      this.sortData();
      this.totalRecords = this.filteredData.length;
    }

    onSort(column: string) {
      this.sortDirection = this.sortColumn === column ? (this.sortDirection === 'asc' ? 'desc' : 'asc') : 'asc';
      this.sortColumn = column;
      this.sortData();
    }

    sortData() {
      const compare = (a: any, b: any) => {
        const valueA = a[this.sortColumn] ?? '';
        const valueB = b[this.sortColumn] ?? '';
        if (typeof valueA === 'number' && typeof valueB === 'number') {
          return this.sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
        }
        return this.sortDirection === 'asc'
          ? valueA.toString().localeCompare(valueB.toString())
          : valueB.toString().localeCompare(valueA.toString());
      };
      this.filteredData = [...this.filteredData].sort(compare);
    }

    showError(message: string, error: any) {
      Swal.fire('Error', error.error?.message || message, 'error');
    }

    getShowingText() {
      const start = (this.page - 1) * this.pageSize + 1;
      const end = Math.min(this.page * this.pageSize, this.totalRecords);
      return `Showing ${start} to ${end}`;
    }

    onPageChange(page: number): void {
    this.page = page;

    // Hitung ulang data yang ditampilkan berdasarkan halaman dan ukuran halaman
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = this.page * this.pageSize;

    // Perbarui data yang ditampilkan
    this.filteredData = this.listData.slice(startIndex, endIndex);

    console.log(`Page Changed: ${this.page}, Data Shown:`, this.filteredData);
}


    getSortIcon(column: string): string {
    return this.sortColumn !== column
      ? 'ri-arrow-up-down-line'
      : this.sortDirection === 'asc'
      ? 'ri-arrow-up-line'
      : 'ri-arrow-down-line';
  }

    onPageSizeChange(): void {
    // Reset ke halaman pertama jika ukuran halaman berubah
    this.page = 1;

    // Hitung ulang data yang ditampilkan berdasarkan ukuran halaman
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = this.page * this.pageSize;

    // Perbarui data yang ditampilkan
    this.filteredData = this.listData.slice(startIndex, endIndex);

    console.log(`Page Size Changed: ${this.pageSize}, Data Shown:`, this.filteredData);
}

    onUserSelect() {
      if (this.selectedUser) {
        console.log('Selected User Data:', this.selectedUser); // Log seluruh data user yang dipilih
        
        this.employee_code = this.selectedUser.lg_nik;
        this.employee_name = this.selectedUser.lg_name;
        this.whatsapp_number = this.selectedUser.n_phone;
        this.email_address = this.selectedUser.lg_email_aio;

        // Log data yang telah di-assign
        console.log('Employee Code:', this.employee_code);
        console.log('Employee Name:', this.employee_name);
        console.log('WhatsApp Number:', this.whatsapp_number);
        console.log('Email Address:', this.email_address);
      } else {
        console.log('No user selected or data is undefined.');
      }
    }

    resetForm(): void {
      this.employee_code = '';
      this.employee_name = '';
      this.departement_id = null;
      this.role_id = null;
      this.email_address = '';
      this.site = null;
      this.selectedUser = null;
    }
    //Setting Judul
    initBreadcrumbs() {
      this.breadCrumbItems = [{ label: 'Master Data' }, { label: 'Authorization Management', active: true }];
    }
    goBack(): void {
      this.modal.dismissAll(); // Menutup modal aktif
      console.log('Modal closed');
    }
    
    

}
