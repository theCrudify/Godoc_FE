import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { AppService } from 'src/app/shared/service/app.service';

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrl: './product.component.scss',
})
export class ProductComponent implements OnInit {
  // Pagination and sorting state
  pageSize = 10;
  page = 1;
  searchTerm = '';
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  listData: any[] = [];
  filteredData: any[] = [];
  totalRecords = 0;
  breadCrumbItems!: Array<{}>;
  statusForm!: string;
  idEdit!: number;

  @ViewChild('modalForm') modalForm!: TemplateRef<any>;

  public formData = this.fb.group({
    name: ['', Validators.required],
    code: ['', Validators.required],
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
    this.loadProductData();
  }

  initBreadcrumbs() {
    this.breadCrumbItems = [{ label: 'Master Data' }, { label: 'Product', active: true }];
  }

  // Load product data from API
  loadProductData() {
    this.service.get('/product').subscribe({
      next: (result) => this.onProductDataLoaded(result.data),
      error: (error) => this.handleError(error, 'Error fetching product data'),
    });
  }

  onProductDataLoaded(data: any[]) {
    this.listData = data.map((product: any) => ({
      ...product,
      name: product.name.trim(),
      code: product.code.toUpperCase(),
    }));
    this.filteredData = [...this.listData];
    this.totalRecords = this.filteredData.length;
  }

  onSearch() {
    const searchLower = this.searchTerm.toLowerCase();
    this.filteredData = this.listData.filter(
      (data) =>
        data.code.toLowerCase().includes(searchLower) ||
        data.name.toLowerCase().includes(searchLower)
    );
    this.totalRecords = this.filteredData.length;
  }

  // Sorting logic
  onSort(column: string) {
    this.sortDirection =
      this.sortColumn === column
        ? this.toggleSortDirection(this.sortDirection)
        : 'asc';
    this.sortColumn = column;
    this.filteredData = this.getSortedData();
  }

  toggleSortDirection(direction: 'asc' | 'desc'): 'asc' | 'desc' {
    return direction === 'asc' ? 'desc' : 'asc';
  }

  getSortedData() {
    return [...this.filteredData].sort((a, b) => {
      const valueA = a[this.sortColumn]?.toString().toLowerCase() || '';
      const valueB = b[this.sortColumn]?.toString().toLowerCase() || '';
      return this.sortDirection === 'asc'
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    });
  }

  getSortIcon(column: string): string {
    return this.sortColumn !== column
      ? 'ri-arrow-up-down-line'
      : this.sortDirection === 'asc'
      ? 'ri-arrow-up-line'
      : 'ri-arrow-down-line';
  }

  onAction(status: string, data?: any) {
    this.statusForm = status === 'add' ? 'Add' : 'Edit';
    if (status === 'edit' && data) {
      this.formData.patchValue({ code: data.code, name: data.name });
      this.idEdit = data.id;
    } else {
      this.formData.reset();
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

  onDelete(id: number): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this data!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed) {
        this.service.delete(`/product/${id}`).subscribe({
          next: () => {
            Swal.fire('Deleted!', 'Your data has been deleted.', 'success');
            this.loadProductData();
          },
          error: (error) => this.handleError(error, 'Error during deletion'),
        });
      }
    });
  }

  addData() {
    this.service.post('/product/', this.formData.value).subscribe({
      next: () => this.onSuccessfulAction('Data added successfully'),
      error: (error) => this.handleError(error, 'Error adding data'),
    });
  }

  editData() {
    this.service.put(`/product/${this.idEdit}`, this.formData.value).subscribe({
      next: () => this.onSuccessfulAction('Data updated successfully'),
      error: (error) => this.handleError(error, 'Error updating data'),
    });
  }

  onSuccessfulAction(message: string) {
    Swal.fire('Success', message, 'success');
    this.modal.dismissAll();
    this.loadProductData();
  }

  handleError(error: any, defaultMessage: string) {
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
