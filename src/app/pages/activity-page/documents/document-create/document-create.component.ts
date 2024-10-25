import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { AppService } from 'src/app/shared/service/app.service';
import { TokenStorageService } from "src/app/core/services/token-storage.service";
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { Router } from '@angular/router'; // Import Router

@Component({
  selector: 'app-document-create',
  templateUrl: './document-create.component.html',
  styleUrls: ['./document-create.component.scss']
})
export class DocumentCreateComponent implements OnInit {

  // Properties
  pageSize = 10;
  page = 1;
  searchTerm = '';
  listData: any[] = [];
  filteredData: any[] = [];
  totalRecords = 0;
  breadCrumbItems: Array<{ label: string, active?: boolean }> = [];
  statusForm!: string;
  idEdit!: number;
  fileUploadForm!: FormGroup;
  uploadedFile: any;
  listProducts: any[] = [];
  listLanguages: any[] = [];
  currentUser: any; // To store the currently logged in user info

  @ViewChild('modalForm') modalForm!: TemplateRef<any>;

  constructor(
    private service: AppService,
    private fb: FormBuilder,
    private modal: NgbModal,
    private tokenStorage: TokenStorageService,
    private router: Router // Inject Router
  ) {}

  ngOnInit(): void {
    this.initBreadcrumbs();
    this.loadData();
    this.initForm();
    this.loadFormFromLocalStorage();
  
    // Mengambil informasi pengguna dari token storage
    this.currentUser = this.tokenStorage.getUser();
    console.log("Current User: ", this.currentUser);
  }

  get form() {
    return this.fileUploadForm.controls;
  }

  initBreadcrumbs() {
    this.breadCrumbItems = [{ label: 'Activity' }, { label: 'Document', active: true }];
  }

  initForm() {
    this.fileUploadForm = this.fb.group({
      name: ['', Validators.required],
      product_id: ['', Validators.required],
      dominant_language_id: ['', Validators.required],
      minor_language_id: ['', Validators.required],
      file: [null, Validators.required] // File input
    });

    // Subscribe to form value changes to store in localStorage
    this.fileUploadForm.valueChanges.subscribe(value => {
      localStorage.setItem('documentForm', JSON.stringify(value));
    });
  }

  // Load form data from localStorage if available
  loadFormFromLocalStorage() {
    const savedForm = localStorage.getItem('documentForm');
    if (savedForm) {
      this.fileUploadForm.patchValue(JSON.parse(savedForm));
    }
  }

  async loadData() {
    try {
      const products = await this.service.get('/product').toPromise();
      const languages = await this.service.get('/language').toPromise();
  
      // Simpan hasil ke array pilihan
      this.listProducts = products.data.map((item: any) => ({
        id: item.id,
        name: item.name
      }));
      
      this.listLanguages = languages.data.map((item: any) => ({
        id: item.id,
        name: item.name
      }));
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  // Clear localStorage and form on reset
  resetForm() {
    this.fileUploadForm.reset(); // Tetap reset form
    localStorage.removeItem('documentForm'); // Hapus data dari localStorage
  }


  // Handle file selection
  onFileSelected(event: any) {
    if (event.target.files.length > 0) {
      this.uploadedFile = event.target.files[0];
      this.fileUploadForm.patchValue({
        file: this.uploadedFile
      });
    }
  }

  // Submit form and upload file
  async onSubmit() {
    if (this.fileUploadForm.invalid) {
      Swal.fire('Error', 'Please fill all required fields', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', this.fileUploadForm.get('file')?.value);

    try {
      // Upload file
      const fileUploadResult = await this.service.postFile('/upload', formData).toPromise();
      console.log('File upload result:', fileUploadResult);

      // Prepare data to be sent after file upload
      const documentData = {
        type: fileUploadResult.file.mimetype, // Extracted from upload response
        name: this.fileUploadForm.get('name')?.value,
        file_id: fileUploadResult.file.id, // Extracted from upload response
        product_id: this.fileUploadForm.get('product_id')?.value,
        dominant_language_id: this.fileUploadForm.get('dominant_language_id')?.value,
        minor_language_id: this.fileUploadForm.get('minor_language_id')?.value,
        status: 'PROCESSED', // Default status
        is_deleted: false, // Default value
        created_by: this.currentUser?.name || 'Unknown' // Use current user's name
      };

      // Send document data
      const documentResult = await this.service.post('/document', documentData).toPromise();
      console.log('Document creation result:', documentResult);
      
      Swal.fire('Success', 'Document successfully created', 'success').then(() => {
        // Clear localStorage and navigate to the document list page after success
        localStorage.removeItem('documentForm');
        this.router.navigate(['/activity-page/document-list']);
      });
      
    } catch (error) {
      console.error('Error during file upload or document creation:', error);
      Swal.fire('Error', 'Failed to upload file or create document', 'error');
    }
  }

  goBack() {
    this.router.navigate(['/activity-page/document-list']);
  }
  
}
