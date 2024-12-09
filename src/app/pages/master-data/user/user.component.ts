import {
  Component,
  OnInit,
  TemplateRef,
  ViewChild,
  EventEmitter,
} from '@angular/core';
import { AppService } from 'src/app/shared/service/app.service';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  of,
  switchMap,
} from 'rxjs';

import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
})
export class UserComponent implements OnInit {


  // Form data properties
  employee_code = '';
  employee_name = '';
  departement_id: number | null = null;
  role_id: number | null = null;
  whatsapp_number = '';
  email_address = '';
  site: number | null = null;

  selectedUser: any;

  pageSize = 10;
  page = 1;
  searchTerm = '';
  listData: any[] = [];
  filteredData: any[] = [];
  totalRecords = 0;
  breadCrumbItems: Array<{ label: string; active?: boolean }> = [];
  userForm!: FormGroup;
  listUsers: any[] = [];
  listDepartments: any[] = [];
  listRoles: any[] = [];
  listSite: any[] = [];
  currentUser: any;

  searchControl = new EventEmitter<string>();

  @ViewChild('modalForm') modalForm!: TemplateRef<any>;

  constructor(
    private service: AppService,
    private fb: FormBuilder,
    private modal: NgbModal,
    private tokenStorage: TokenStorageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initBreadcrumbs();
    this.loadDataAll();
    this.currentUser = this.tokenStorage.getUser();
    this.setupSearchDebounce(); // Inisialisasi debounce
    console.log('Current User:', this.currentUser);
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
  

  initBreadcrumbs() {
    this.breadCrumbItems = [
      { label: 'Activity' },
      { label: 'Document', active: true },
    ];
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
          this.userForm.reset();
          console.log('Form reset successful'); // Log setelah form direset
          this.router.navigate(['/activity-page/document-list']);
          console.log('Navigation to document list successful'); // Log navigasi berhasil
        });
      },
      (error) => {
        console.error('API Error:', error); // Log error API
        Swal.fire('Error', 'Failed to create user', 'error');
      }
    );
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

  goBack() {
    this.router.navigate(['/activity-page/document-list']);
  }
  
}
