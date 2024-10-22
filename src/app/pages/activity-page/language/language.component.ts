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
  breadCrumbItems!: Array<{}>;
  statusForm!: string;
  idEdit!: number;

  // Sorting state
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  @ViewChild('modalForm') modalForm!: TemplateRef<any>;

  public formData = this.fb.group({
    name: ['', Validators.required],
    code: ['', Validators.required]
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
    const storedData = localStorage.getItem('currentUser');
    const token = localStorage.getItem('token');

    if (storedData && token) {
      this.getLanguageData();
    } else {
      console.error('User not logged in or token missing.');
    }
  }

  getLanguageData() {
    this.service.get('/language').subscribe({
      next: (result) => {
        this.listData = result.data.map((language: any) => ({
          ...language,
          name: language.name.trim(),
          code: language.code.toUpperCase()
        }));
        this.filteredData = [...this.listData];
        this.totalRecords = this.filteredData.length;
      },
      error: (error) => {
        console.error('Error fetching language data:', error);
      }
    });
  }

  onSearch() {
    const searchLower = this.searchTerm.toLowerCase();
    this.filteredData = this.listData.filter(
      (data) => data.code.toLowerCase().includes(searchLower) || data.name.toLowerCase().includes(searchLower)
    );
    this.totalRecords = this.filteredData.length;  // Update totalRecords based on filtered data
  }

  // Sorting logic
  onSort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  }

  getSortedData() {
    const sortedData = [...this.filteredData].sort((a, b) => {
      const valueA = a[this.sortColumn]?.toString().toLowerCase() || '';
      const valueB = b[this.sortColumn]?.toString().toLowerCase() || '';

      if (valueA < valueB) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sortedData;
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) {
      return 'ri-arrow-up-down-line';
    }
    return this.sortDirection === 'asc' ? 'ri-arrow-up-line' : 'ri-arrow-down-line';
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

    if (this.statusForm === 'Add') {
      this.addData(); // Memanggil metode POST
    } else {
      this.editData(); // Memanggil metode PUT
    }
  }

  onDelete(id: number): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this data!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        // Ambil token dari localStorage (atau dari sumber lain yang menyimpan token)
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` }; // Sertakan token di header
  
        // Kirim request DELETE dengan header yang berisi token
        this.service.delete(`/language/${id}`).subscribe({
          next: (response) => {
            console.log('Delete successful:', response); // Logging the response
            Swal.fire('Deleted!', 'Your data has been deleted.', 'success');
            this.getLanguageData(); // Panggil ulang data untuk memperbarui tampilan
          },
          error: (error) => {
            console.error('Error during deletion:', error); // Tambahkan log error
            const errorMessage = error.error?.message || 'There was a problem deleting the data.';
            Swal.fire('Error!', errorMessage, 'error');
          }
        });
      }
    });
  }
  

  addData() {
    const apiData = this.formData.value;
    this.service.post('/language/', apiData).subscribe({
      next: (data) => {
        Swal.fire('Success', 'Data added successfully', 'success');
        this.modal.dismissAll();
        this.ngOnInit();
      },
      error: (error) => {
        this.handleError(error);
      }
    });
  }

  editData() {
    const apiData = this.formData.value;
    this.service.put(`/language/${this.idEdit}`, apiData).subscribe({
      next: (data) => {
        Swal.fire('Success', 'Data updated successfully', 'success');
        this.modal.dismissAll();
        this.ngOnInit();
      },
      error: (error) => {
        this.handleError(error);
      }
    });
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
