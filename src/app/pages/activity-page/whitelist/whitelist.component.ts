import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { AppService } from 'src/app/shared/service/app.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { forkJoin } from 'rxjs';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-whitelist',
  templateUrl: './whitelist.component.html',
  styleUrl: './whitelist.component.scss'
})
export class WhitelistComponent implements OnInit {

  pageSize = 10;
  page = 1;
  searchTerm = '';
  listData: any[] = [];
  filteredData: any[] = [];
  totalRecords = 0;
  breadCrumbItems!: Array<{}>;
  statusForm!: string;
  idEdit!: number;
  languages: any;

  // Sorting state
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  @ViewChild('modalForm') modalForm!: TemplateRef<any>;

  public formData = this.fb.group({
    wordlists: ['', Validators.required],
    language_id: ['', Validators.required]
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
    this.getLanguages();
    this.initBreadcrumbs();
    this.checkStoredUserData();
  }

  getLanguages() {
    this.service.get('/language').subscribe({
      next: (response) => {
        this.languages = response.data; // Menyimpan daftar bahasa ke variabel
      },
      error: (error) => {
        console.error('Error fetching language data:', error);
      }
    });
  }
  
  initBreadcrumbs() {
    this.breadCrumbItems = [{ label: 'Master Data' }, { label: 'Whitelist', active: true }];
  }

  checkStoredUserData() {
    const storedData = localStorage.getItem('currentUser');
    const token = localStorage.getItem('token');

    if (storedData && token) {
      this.getwhitelistData();
    } else {
      console.error('User not logged in or token missing.');
    }
  }


  getwhitelistData() {
    // Gunakan forkJoin untuk memanggil kedua API secara bersamaan
    forkJoin({
      whitelistData: this.service.get('/whitelist'),
      languageData: this.service.get('/language')
    }).subscribe({
      next: ({ whitelistData, languageData }) => {
        // Log data dari API /language
        console.log('Language data:', languageData);
  
        // Mapping data language untuk memudahkan pencarian berdasarkan id
        const languageMap = new Map();
        languageData.data.forEach((language: any) => {
          languageMap.set(language.id, language.name); // Menyimpan nama bahasa berdasarkan id
        });
  
        // Memproses data whitelist dan menggabungkan dengan data language
        this.listData = whitelistData.data.map((whitelist: any) => ({
          id: whitelist.id,
          language_id: whitelist.language_id,
          language: languageMap.get(whitelist.language_id) || 'Unknown', // Mengambil nama bahasa berdasarkan language_id
          wordlists: whitelist.wordlists ? whitelist.wordlists.split(',').filter((word: string) => word.trim() !== '') : [] // Memproses wordlists menjadi array
        }));
  
        console.log('Processed whitelist data with languages:', this.listData);
        this.filteredData = [...this.listData];
        this.totalRecords = this.filteredData.length;
      },
      error: (error) => {
        console.error('Error fetching data:', error);
      }
    });
  }
  
  
  
  

  onSearch() {
    const searchLower = this.searchTerm.toLowerCase();
    this.filteredData = this.listData.filter(
      (data) => 
        data.language.toLowerCase().includes(searchLower) || // Menggunakan data.language untuk pencarian nama bahasa
        data.wordlists.some((word: string) => word.toLowerCase().includes(searchLower)) // Pencarian pada daftar kata
    );
    this.totalRecords = this.filteredData.length;
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
      console.log('Data to be edited:', data); // Tambahkan log di sini
      this.formData.patchValue({ language_id: data.language_id, wordlists: data.wordlists });
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
  console.log('Form Data before submit:', this.formData.value); // Tambahkan log di sini

  if (this.statusForm === 'Add') {
    this.addData();
  } else {
    this.editData();
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
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        this.service.delete(`/whitelist/${id}`).subscribe({
          next: (response) => {
            console.log('Delete successful:', response);
            Swal.fire('Deleted!', 'Your data has been deleted.', 'success');
            this.getwhitelistData();
          },
          error: (error) => {
            console.error('Error during deletion:', error);
            const errorMessage = error.error?.message || 'There was a problem deleting the data.';
            Swal.fire('Error!', errorMessage, 'error');
          }
        });
      }
    });
  }

  addData() {
    const apiData = this.formData.value;
    this.service.post('/whitelist/', apiData).subscribe({
      next: (data) => {
        Swal.fire('Success', 'Data added successfully', 'success');
        this.modal.dismissAll();
        this.getwhitelistData();
      },
      error: (error) => {
        this.handleError(error);
      }
    });
  }

  editData() {
    const apiData = this.formData.value;
    this.service.put(`/whitelist/${this.idEdit}`, apiData).subscribe({
      next: (data) => {
        Swal.fire('Success', 'Data updated successfully', 'success');
        this.modal.dismissAll();
        this.getwhitelistData();
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
