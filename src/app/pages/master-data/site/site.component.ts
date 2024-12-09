import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { AppService } from 'src/app/shared/service/app.service';
import { TokenStorageService } from "src/app/core/services/token-storage.service";

@Component({
  selector: 'app-site',
  templateUrl: './site.component.html',
  styleUrls: ['./site.component.scss'],
})
export class SiteComponent implements OnInit {
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
 
 // Form properties
 site = '';
 code_site = '';
  breadCrumbItems!: Array<{}>;
 
  @ViewChild('modalForm') modalForm!: TemplateRef<any>;

  formData = this.fb.group({
    site: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
    code_site: ['', [Validators.required, Validators.pattern('^[A-Z0-9_]+$')]],
  });

  constructor(
    private service: AppService,
    private fb: FormBuilder,
    private modal: NgbModal,
    private tokenStorage: TokenStorageService
  ) {}

  get form() {
    return this.formData.controls;
  }

  ngOnInit(): void {
    this.currentUser = this.tokenStorage.getUser();
    this.loadSiteData();
  }

  loadSiteData() {
    this.service.get('/getAllsite').subscribe({
      next: (result: any[]) => {
        if (!Array.isArray(result)) {
          this.showError('Unexpected data format received', new Error('Result is not an array'));
          return;
        }
  
        this.listData = result.map((site, index) => ({
          ...site,
          no: index + 1,
          code_site: site?.code_site?.toUpperCase() || '-', // Default '-' jika kosong
          created_date: this.formatDateTime(site?.created_date),
          updated_at: this.formatDateTime(site?.updated_at),
          created_by: site?.employee_name || '-', // Default '-' jika kosong
        }));
        
        this.filteredData = [...this.listData];
        this.totalRecords = this.filteredData.length;
      },
      error: (error) => this.showError('Error fetching site data', error),
    });
  }
  

  private formatDateTime(date: any): string {
    if (!date) return 'N/A'; // Tampilkan 'N/A' jika nilai date kosong
    const parsedDate = new Date(date);
  
    if (isNaN(parsedDate.getTime())) return 'N/A'; // Tampilkan 'N/A' jika parsing gagal
  
    const formattedDate = parsedDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = parsedDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false, // Format 24 jam
    });
  
    return `${formattedDate} at ${formattedTime}`;
  }
  

  onSubmit() {
    if (this.formData.invalid) {
      this.formData.markAllAsTouched();
      return;
    }
    const payload = { ...this.formData.value, created_by: this.currentUser.nik };
    const action = this.idEdit ? this.service.put(`/updatesite/${this.idEdit}`, payload) : this.service.post('/addsite', payload);

    action.subscribe({
      next: () => {
        Swal.fire('Success', `Data ${this.idEdit ? 'updated' : 'added'} successfully!`, 'success');
        this.modal.dismissAll();
        this.loadSiteData();
      },
      error: (error) => this.showError(`Error ${this.idEdit ? 'updating' : 'adding'} data`, error),
    });
  }

  onDelete(id: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed) {
        this.service.delete(`/softDeletesite/${id}`).subscribe({
          next: () => {
            Swal.fire('Deleted!', 'Data has been deleted.', 'success');
            this.loadSiteData();
          },
          error: (error) => this.showError('Error deleting data', error),
        });
      }
    });
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

  onPageChange(newPage: number) {
    this.page = newPage;
  }

  getSortIcon(column: string): string {
    return this.sortColumn !== column
      ? 'ri-arrow-up-down-line'
      : this.sortDirection === 'asc'
      ? 'ri-arrow-up-line'
      : 'ri-arrow-down-line';
  }

  onPageSizeChange() {
    this.page = 1;
  }
  

//Setting Judul
  initBreadcrumbs() {
    this.breadCrumbItems = [{ label: 'Master Data' }, { label: 'Site Management', active: true }];
  }


}
