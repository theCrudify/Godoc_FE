import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { AppService } from 'src/app/shared/service/app.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, Validators } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-language',
  templateUrl: './language.component.html',
  styleUrls: ['./language.component.scss']
})
export class LanguageComponent implements OnInit {

  pageSize = 10;
  page = 1;
  searchTerm = '';
  listData: any[] = [];
  filteredData: any[] = [];
  totalRecords = 0;
  breadCrumbItems: Array<{}> = [];
  statusForm!: string;
  idEdit!: number;

  // Sorting state
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  @ViewChild('modalForm') modalForm!: TemplateRef<any>;

  formData = this.fb.group({
    name: ['', Validators.required],
    code: ['', Validators.required],
    whitelist: ['', Validators.required]
  });

  constructor(
    private service: AppService,
    private fb: FormBuilder,
    private modal: NgbModal
  ) {}

  get form() {
    return this.formData.controls;
  }

  ngOnInit(): void {
    this.initBreadcrumbs();
    this.checkStoredUserData();
  }

  initBreadcrumbs() {
    this.breadCrumbItems = [{ label: 'Master Data' }, { label: 'Language', active: true }];
  }

  checkStoredUserData() {
    if (this.isLoggedIn()) {
      this.getLanguageData();
    } else {
      console.error('User not logged in or token missing.');
    }
  }

  isLoggedIn(): boolean {
    const storedData = localStorage.getItem('currentUser');
    const token = localStorage.getItem('token');
    return !!storedData && !!token;
  }

  async getLanguageData() {
    try {
      const result = await this.service.get('/language').toPromise();
      this.listData = result.data.map((language: any) => ({
        ...language,
        name: language.name.trim(),
        code: language.code.toUpperCase(),
        whitelist: language.whitelist.toUpperCase()
      }));
      this.filteredData = [...this.listData];
      this.totalRecords = this.filteredData.length;
    } catch (error) {
      console.error('Error fetching language data:', error);
    }
  }

  onSearch() {
    const searchLower = this.searchTerm.toLowerCase();
    this.filteredData = this.listData.filter(
      data => data.code.toLowerCase().includes(searchLower) || data.name.toLowerCase().includes(searchLower)
    );
    this.totalRecords = this.filteredData.length;
  }

  // Sorting logic
  onSort(column: string) {
    this.sortDirection = this.sortColumn === column && this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.sortColumn = column;
    this.filteredData = this.getSortedData();
  }

  getSortedData() {
    return [...this.filteredData].sort((a, b) => {
      const valueA = a[this.sortColumn]?.toString().toLowerCase() || '';
      const valueB = b[this.sortColumn]?.toString().toLowerCase() || '';
      return valueA < valueB ? (this.sortDirection === 'asc' ? -1 : 1) : (valueA > valueB ? (this.sortDirection === 'asc' ? 1 : -1) : 0);
    });
  }

  getSortIcon(column: string): string {
    return this.sortColumn === column ? (this.sortDirection === 'asc' ? 'ri-arrow-up-line' : 'ri-arrow-down-line') : 'ri-arrow-up-down-line';
  }

  onAction(status: string, data?: any) {
    this.statusForm = status === 'add' ? 'Add' : 'Edit';
    if (status === 'edit' && data) {
      this.formData.patchValue({ code: data.code, name: data.name, whitelist: data.whitelist });
      this.idEdit = data.id;
    } else {
      this.formData.reset();
    }
    this.modal.open(this.modalForm, { size: 'm', backdrop: 'static', centered: true });
  }

  async onSubmit() {
    if (this.formData.invalid) {
      this.formData.markAllAsTouched();
      return;
    }
    try {
      if (this.statusForm === 'Add') {
        await this.addData();
      } else {
        await this.editData();
      }
      this.modal.dismissAll();
      await this.getLanguageData();
    } catch (error) {
      this.handleError(error);
    }
  }

  async onDelete(id: number) {
    const confirmResult = await Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this data!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (confirmResult.isConfirmed) {
      try {
        await this.service.delete(`/language/${id}`).toPromise();
        Swal.fire('Deleted!', 'Your data has been deleted.', 'success');
        await this.getLanguageData();
      } catch (error) {
        console.error('Error during deletion:', error);
        Swal.fire('Error!', 'There was a problem deleting the data.', 'error');
      }
    }
  }

  async addData() {
    const apiData = this.formData.value;
    await this.service.post('/language/', apiData).toPromise();
    Swal.fire('Success', 'Data added successfully', 'success');
  }

  async editData() {
    const apiData = this.formData.value;
    await this.service.put(`/language/${this.idEdit}`, apiData).toPromise();
    Swal.fire('Success', 'Data updated successfully', 'success');
  }

  handleError(error: any) {
    const errorMessage = error.error?.message || 'An unexpected error occurred.';
    Swal.fire('Error', errorMessage, 'error');
  }

  onPageSizeChange() {
    this.page = 1;
  }

  getShowingText(): string {
    const start = (this.page - 1) * this.pageSize + 1;
    const end = Math.min(this.page * this.pageSize, this.totalRecords);
    return `Showing ${start} to ${end}`;
  }
}
