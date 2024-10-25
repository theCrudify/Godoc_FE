import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { AppService } from 'src/app/shared/service/app.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, Validators } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-language',
  templateUrl: './language.component.html',
  styleUrls: ['./language.component.scss'],
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
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  @ViewChild('modalForm') modalForm!: TemplateRef<any>;

  formData = this.fb.group({
    name: ['', Validators.required],
    code: ['', Validators.required],
    whitelist: ['', Validators.required],
  });

  constructor(
    private service: AppService,
    private fb: FormBuilder,
    private modal: NgbModal
  ) {}

  ngOnInit(): void {
    this.initBreadcrumbs();
    this.loadLanguageData();
  }

  initBreadcrumbs() {
    this.breadCrumbItems = [
      { label: 'Master Data' },
      { label: 'Language', active: true },
    ];
  }

  async loadLanguageData() {
    try {
      const result = await this.service.get('/language').toPromise();
      this.listData = this.transformLanguageData(result.data);
      this.filteredData = [...this.listData];
      this.totalRecords = this.filteredData.length;
    } catch (error) {
      this.handleError(error, 'Error fetching language data');
    }
  }

  transformLanguageData(data: any[]) {
    return data.map((language) => ({
      ...language,
      name: language.name.trim(),
      code: language.code.toUpperCase(),
      whitelist: language.whitelist.toUpperCase(),
    }));
  }

  onSearch() {
    const searchLower = this.searchTerm.toLowerCase();
    this.filteredData = this.listData.filter((data) =>
      ['code', 'name', 'whitelist'].some((key) =>
        data[key].toLowerCase().includes(searchLower)
      )
    );
    this.totalRecords = this.filteredData.length;
  }

  onSort(column: string) {
    this.sortDirection =
      this.sortColumn === column ? this.toggleSortDirection() : 'asc';
    this.sortColumn = column;
    this.filteredData = this.getSortedData();
  }

  toggleSortDirection(): 'asc' | 'desc' {
    return this.sortDirection === 'asc' ? 'desc' : 'asc';
  }

  getSortedData() {
    return [...this.filteredData].sort((a, b) =>
      this.compareValues(a[this.sortColumn], b[this.sortColumn])
    );
  }

  compareValues(valueA: any, valueB: any): number {
    const lowerA = valueA?.toString().toLowerCase() || '';
    const lowerB = valueB?.toString().toLowerCase() || '';
    if (lowerA < lowerB) return this.sortDirection === 'asc' ? -1 : 1;
    if (lowerA > lowerB) return this.sortDirection === 'asc' ? 1 : -1;
    return 0;
  }

  getSortIcon(column: string): string {
    return this.sortColumn === column
      ? this.sortDirection === 'asc'
        ? 'ri-arrow-up-line'
        : 'ri-arrow-down-line'
      : 'ri-arrow-up-down-line';
  }

  onAction(status: 'add' | 'edit', data?: any) {
    this.statusForm = status === 'add' ? 'Add' : 'Edit';
    this.idEdit = status === 'edit' && data ? data.id : 0;
    this.patchFormData(status, data);
    this.modal.open(this.modalForm, {
      size: 'm',
      backdrop: 'static',
      centered: true,
    });
  }

  patchFormData(status: 'add' | 'edit', data?: any) {
    if (status === 'edit' && data) {
      this.formData.patchValue(data);
    } else {
      this.formData.reset();
    }
  }

  async onSubmit() {
    if (this.formData.invalid) {
      this.formData.markAllAsTouched();
      return;
    }

    try {
      this.statusForm === 'Add' ? await this.addData() : await this.editData();
      this.modal.dismissAll();
      await this.loadLanguageData();
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
      confirmButtonText: 'Yes, delete it!',
    });

    if (confirmResult.isConfirmed) {
      try {
        await this.service.delete(`/language/${id}`).toPromise();
        Swal.fire('Deleted!', 'Your data has been deleted.', 'success');
        await this.loadLanguageData();
      } catch (error) {
        this.handleError(error, 'Error during deletion');
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

  handleError(error: any, defaultMessage = 'An unexpected error occurred.') {
    const errorMessage = error.error?.message || defaultMessage;
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
