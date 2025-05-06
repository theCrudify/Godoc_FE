
import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { FormBuilder, FormGroup, FormArray } from "@angular/forms";
import Swal from "sweetalert2";
import { AppService } from "src/app/shared/service/app.service";
import { TokenStorageService } from "src/app/core/services/token-storage.service";
import { catchError, finalize } from "rxjs/operators";
import { ActivatedRoute, ParamMap, Router } from "@angular/router";
import { of } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { environment } from "src/environments/environment";


import { ViewChild, TemplateRef } from "@angular/core";

// di dalam kelas component

declare var bootstrap: any;

interface DropdownItem {
  id?: number;
  code?: string;
  display: string;
  fullData?: any;
}

interface SupportDocument {
  id: number;
  support_doc_id: number;
  document_type: string;
  status: boolean;
  title?: string;       // Field untuk title
  noted?: string;       // Field untuk catatan
  created_by: string;
  created_date: string;
  updated_at?: string;
  updated_by?: string;
  isChecked?: boolean;  // Untuk UI
  showNote?: boolean;   // Untuk toggle tampilan catatan
}

interface CurrencyItem {
  id: number;
  code: string;
  name: string;
  symbol: string;
}

@Component({
  selector: 'app-form-approval-proposedchanges',
  templateUrl: './form-approval-proposedchanges.component.html',
  styleUrl: './form-approval-proposedchanges.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class FormApprovalProposedchangesComponent implements OnInit {
  // Properties
  @ViewChild('approveModal', { static: false }) approveModal!: TemplateRef<any>;
  @ViewChild('notApproveModal', { static: false }) notApproveModal!: TemplateRef<any>;
  @ViewChild('rejectModal', { static: false }) rejectModal!: TemplateRef<any>;

  GodocUser: any;
  isStepOneApproval: boolean = false; // Declare isStepOneApproval
  currentApprovalStep: number | null = null; // Declare currentApprovalStep
  isStepTwoApproval: boolean = false; // Declare isStepTwoApproval
  currentApprovalStatus: string | null = null; // Declare currentApprovalStatus
  breadCrumbItems: Array<{ label: string; active?: boolean }> = [];
  loading = false;
  showInstructions = false; // Set to false for detail view
  documentSearchTerm: string = '';
  proposedId: number = 0;
  approvalNote: string = ''; // Field untuk menyimpan catatan approval

  // Tooltips array to initialize
  tooltips: any[] = [];

  // Data from API
  proposedData: any = null;
  supportDocs: any[] = [];

  // Dropdown lists
  documentNumbers: DropdownItem[] = [];
  documentTypes: any[] = [];

  //Acces Step
  hasRejectionAccess: boolean = false;

  doc = false;

  // Currency Array
  currencies: CurrencyItem[] = [
    // Perbaikan definisi mata uang Indonesia
    { id: 1, code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp ' }, // Tambahkan spasi setelah simbol
    { id: 2, code: 'USD', name: 'US Dollar', symbol: '$ ' },
    { id: 3, code: 'EUR', name: 'Euro', symbol: '€ ' },
    { id: 4, code: 'JPY', name: 'Japanese Yen', symbol: '¥ ' },
    { id: 5, code: 'SGD', name: 'Singapore Dollar', symbol: 'S$ ' }
  ];

  // Total cost in IDR
  totalCostIDR: number = 0;

  formData!: FormGroup;
  formData2!: FormGroup; // Form untuk menyimpan data support documents

  constructor(
    private service: AppService,
    private fb: FormBuilder,
    private tokenStorage: TokenStorageService,
    private router: Router,
    private route: ActivatedRoute,
    private modalService: NgbModal // Tambahkan NgbModal service

  ) { }

  ngOnInit(): void {
    this.GodocUser = this.tokenStorage.getUser();
    console.log("User from tokenStorage:", this.GodocUser);

    // Inisialisasi form dan breadcrumbs sebelum mendapatkan ID
    this.initForm();
    this.initSupportDocsForm();
    this.initBreadcrumbs();

    // Get ID from route params dan ambil data
    this.route.paramMap.subscribe((params: ParamMap) => {
      const id = params.get('id');
      this.proposedId = id ? +id : 0;
      console.log("Extracted ID from URL params:", this.proposedId);

      if (this.proposedId) {
        this.loadProposedData(this.proposedId);
        this.loadSupportDocs(this.proposedId);
      } else {
        this.showToast('ID tidak ditemukan', 'error');
        this.router.navigate(['/activity-page/list-approval-pc']);
      }
    });
  }

  ngAfterViewInit() {
    // Initialize tooltips
    setTimeout(() => {
      this.initTooltips();
    }, 500);
  }

  // Initialize Bootstrap tooltips
  initTooltips() {
    if (typeof bootstrap !== 'undefined') {
      const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
      this.tooltips = Array.from(tooltipTriggerList).map(tooltipTriggerEl => {
        return new bootstrap.Tooltip(tooltipTriggerEl);
      });
    }
  }

  // Show/hide instructions methods
  toggleInstructions() {
    this.showInstructions = !this.showInstructions;
  }

  hideInstructions() {
    this.showInstructions = false;
  }

  initBreadcrumbs() {
    // Inisialisasi breadcrumb awal (akan diupdate setelah data diambil)
    this.breadCrumbItems = [
      { label: "Activity" },
      { label: "Proposed Changes", active: false },
      { label: "Loading...", active: true },
    ];
  }

  // Update breadcrumbs with ID when data loaded
  updateBreadcrumbs(projectName: string) {
    this.breadCrumbItems = [
      { label: "Activity" },
      { label: "Proposed Changes", active: false },
      { label: `Detail: ${projectName || `ID ${this.proposedId}`}`, active: true },
    ];
  }

  initForm() {
    this.formData = this.fb.group({
      project_name: [{ value: null, disabled: true }],
      item_changes: [{ value: null, disabled: true }],
      line_code: [{ value: '', disabled: true }],
      section_code: [{ value: '', disabled: true }],
      department_id: [{ value: null, disabled: true }],
      section_department_id: [{ value: null, disabled: true }],
      plant_id: [{ value: null, disabled: true }],
      change_type: [{ value: null, disabled: true }],
      description: [{ value: null, disabled: true }],
      reason: [{ value: null, disabled: true }],
      cost: [{ value: null, disabled: true }],
      cost_text: [{ value: null, disabled: true }],
      costItems: this.fb.array([]),
      planning_start: [{ value: null, disabled: true }],
      planning_end: [{ value: null, disabled: true }],
      created_date: [{ value: null, disabled: true }],
      created_by: [{ value: null, disabled: true }],
      need_engineering_approval: [{ value: false, disabled: true }],
      need_production_approval: [{ value: false, disabled: true }],
      other_sytem: [{ value: '', disabled: true }],
      status: [{ value: 'submitted', disabled: true }],
      progress: [{ value: '0%', disabled: true }],
      document_number_id: [{ value: null, disabled: true }],
      auth_id: [{ value: null, disabled: true }]
    });
  }

  initSupportDocsForm() {
    this.formData2 = this.fb.group({
      data: this.fb.array([])
    });
  }

  // Getter for cost items FormArray
  get costItems(): FormArray {
    return this.formData.get('costItems') as FormArray;
  }

  // Create a cost item form group (disabled for view only)
  createCostItem(currency: string, amount: string): FormGroup {
    return this.fb.group({
      currency: [{ value: currency, disabled: true }],
      amount: [{ value: amount, disabled: true }],
      exchangeRate: [{ value: 1, disabled: true }],
      amountInIDR: [{ value: 0, disabled: true }]
    });
  }

  // Load Proposed Changes data by ID
  loadProposedData(id: number) {
    this.loading = true;
    console.log(`Loading proposed changes data for ID: ${id}`);

    this.service.get(`/ongoing?approval_auth_id=${this.GodocUser.auth_id}&id=${id}`)
      .pipe(
        catchError(error => {
          console.error(`Error fetching data for ID ${id}:`, error);
          this.handleError(error, `Error mengambil data proposed changes dengan ID ${id}`);
          this.loading = false;
          return of(null);
        })
      )
      .subscribe({
        next: (result: any) => {
          console.log("Proposed Data Response:", result);
          if (result && result.data && result.data.length > 0) {
            this.proposedData = result.data[0];

            // Memeriksa akses approval user
            const userAuthId = this.GodocUser.auth_id;
            const accessCheck = this.checkUserApprovalAccess(this.proposedData, userAuthId, [1, 2]);

            // console.log("User approval access:", accessCheck);

            // Set flag untuk tombol Rejected
            this.hasRejectionAccess = accessCheck.hasAccess;

            this.populateForm(this.proposedData);

            if (accessCheck.hasAccess) {
              // User memiliki akses pada step 1 atau 2

              // Simpan informasi step untuk digunakan nanti
              this.currentApprovalStep = accessCheck.step;
              this.currentApprovalStatus = accessCheck.status;
            }
          } else {
            this.showToast(`Data dengan ID ${id} tidak ditemukan`, 'error');
            setTimeout(() => this.goBack(), 2000);
          }
          this.loading = false;
        }
      });
  }

  // Metode untuk memeriksa akses approval user
  checkUserApprovalAccess(proposedData: any, userAuthId: number, validSteps: number[] = [1, 2]) {
    // Jika tidak ada data atau tidak ada approvals
    if (!proposedData || !proposedData.approvals || !proposedData.approvals.length) {
      return {
        hasAccess: false,
        message: 'Tidak ada data approval',
        approvalInfo: null
      };
    }

    // Cari approval yang sesuai dengan auth_id pengguna
    const userApproval = proposedData.approvals.find(
      (approval: any) => approval.auth_id === userAuthId
    );

    // Jika tidak ditemukan approval untuk user ini
    if (!userApproval) {
      return {
        hasAccess: false,
        message: 'Anda tidak memiliki akses approval untuk dokumen ini',
        approvalInfo: null
      };
    }

    // Cek apakah step ada dalam validSteps
    const isValidStep = validSteps.includes(userApproval.step);

    return {
      hasAccess: isValidStep,
      approvalInfo: userApproval,
      step: userApproval.step,
      status: userApproval.status
    };
  }

  // Load Support Documents for this proposed change
  loadSupportDocs(id: number) {
    this.loading = true;
    // console.log(`Loading support documents for proposed ID: ${id}`);

    this.service.get(`/supportproposed/${id}`)
      .pipe(
        catchError(error => {
          console.error(`Error fetching support docs for ID ${id}:`, error);
          this.handleError(error, `Error mengambil dokumen pendukung untuk ID ${id}`);
          this.loading = false;
          return of(null);
        })
      )
      .subscribe({
        next: (result: any) => {
          console.log("Support Docs Response:", result);
          if (result && result.data) {
            this.supportDocs = result.data;
            this.updateSupportDocsForm();
          } else {
            console.log(`No support documents found for ID ${id}`);
          }
          this.loading = false;
        }
      });
  }

  // Update support documents form
  updateSupportDocsForm() {
    const supportDocsArray = this.fb.array(
      this.supportDocs.map(doc => this.fb.group({
        id: [{ value: doc.id, disabled: true }],
        support_doc_id: [{ value: doc.support_doc_id, disabled: true }],
        document_type: [{ value: doc.document_type, disabled: true }],
        title: [{ value: doc.title, disabled: true }],
        noted: [{ value: doc.noted, disabled: true }],
        status: [{ value: doc.status, disabled: true }],
        created_by: [{ value: doc.created_by, disabled: true }],
        created_date: [{ value: doc.created_date, disabled: true }]
      }))
    );

    this.formData2.setControl('data', supportDocsArray);

    this.documentTypes = this.supportDocs.map(doc => ({
      ...doc,
      isChecked: doc.status
    }));
  }

  // Populate form with data from API
  populateForm(data: any) {
    // Update breadcrumbs with project name
    this.updateBreadcrumbs(data.project_name);

    // Basic form data
    this.formData.patchValue({
      project_name: data.project_name,
      item_changes: data.item_changes,
      line_code: data.line_code,
      section_code: data.section_code,
      department_id: data.department_id,
      section_department_id: data.section_department_id,
      plant_id: data.plant_id,
      change_type: data.change_type,
      description: data.description,
      reason: data.reason,
      cost: data.cost,
      cost_text: data.cost_text,
      planning_start: new Date(data.planning_start),
      planning_end: new Date(data.planning_end),
      created_date: new Date(data.created_date),
      created_by: data.created_by,
      need_engineering_approval: data.need_engineering_approval,
      need_production_approval: data.need_production_approval,
      other_sytem: data.other_sytem,
      status: data.status,
      progress: data.progress,
      document_number_id: data.document_number_id,
      auth_id: data.auth_id
    });

    // Create document number display for the form
    if (data.documentNumber) {
      this.documentNumbers = [{
        id: data.documentNumber.id,
        display: `${data.documentNumber.running_number || 'N/A'} - ${data.documentNumber.klasifikasi_document || 'No Description'}`,
        fullData: data.documentNumber
      }];
    }

    // Parse cost text to create cost items
    this.parseCostText(data.cost_text);
  }

  // Parse cost text and create cost items
  parseCostText(costText: string) {
    if (!costText) return;
  
    // Clear existing cost items
    while (this.costItems.length > 0) {
      this.costItems.removeAt(0);
    }
  
    // Split by new lines
    const costLines = costText.split('\n');
  
    costLines.forEach(line => {
      // Remove ** and other non-essential characters
      const cleanLine = line.replace(/\*\*/g, '').trim();
      
      if (cleanLine) {
        // Extract currency symbol and amount string exactly as it appears
        const match = cleanLine.match(/^([^\d\s]+)\s*([\d.,\s]+)/);
        
        if (match) {
          const currencySymbol = match[1].trim();
          let amount = match[2].trim();
          
          // Convert symbol to code without changing the amount string format
          let currencyCode = 'IDR'; // Default
          switch (currencySymbol) {
            case '$': currencyCode = 'USD'; break;
            case '€': currencyCode = 'EUR'; break;
            case '¥': currencyCode = 'JPY'; break;
            case 'S$': currencyCode = 'SGD'; break;
            case 'Rp': currencyCode = 'IDR'; break;
          }
          
          // Store the amount string exactly as is, without parsing it
          this.costItems.push(this.createCostItem(currencyCode, amount));
        }
      }
    });
  }

  // Format currency with thousand separators
  formatIdCurrency(value: any): string {
    if (!value) return '0';
    
    // If it's already a string with proper formatting, return it as is
    if (typeof value === 'string' && value.includes('.')) {
      return value;
    }
    
    // Otherwise, just display the raw number as it is stored in your form
    // This assumes the amount is already formatted correctly during parsing
    return value;
  }
  // Get currency symbol based on currency code
  getCurrencySymbol(currencyCode: string | null | undefined): string {
    if (!currencyCode) return '';
  
    const currency = this.currencies.find(c => c.code === currencyCode);
    // Pastikan simbol sudah memiliki spasi di akhirnya
    return currency ? currency.symbol : '';
  }

  // Calculate form progress
  getFormProgress(): number {
    return 100; // Always 100% for view mode
  }

  // Check if all mandatory fields are complete
  isMandatoryFieldsComplete(): boolean {
    return true; // Always true for view mode
  }

  // Check if cost items are valid
  costItemsValid(): boolean {
    return true; // Always true for view mode
  }

  // Check if date range is valid
  dateRangeValid(): boolean {
    return true; // Always true for view mode
  }

  // Filter documents by search term
  getFilteredDocuments(): any[] {
    if (!this.documentSearchTerm) return this.documentTypes;

    return this.documentTypes.filter(doc =>
      doc.document_type.toLowerCase().includes(this.documentSearchTerm.toLowerCase())
    );
  }

  // Get selected documents count
  getSelectedDocumentsCount(): number {
    return this.documentTypes.filter(doc => doc.isChecked).length;
  }

  // Check if any documents are selected
  hasSelectedDocuments(): boolean {
    return this.getSelectedDocumentsCount() > 0;
  }

  // Toast notification
  showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });

    Toast.fire({
      icon: type,
      title: message
    });
  }

  // Handle error with more detailed information
  handleError(error: any, defaultMessage: string) {
    let errorMessage = defaultMessage;
    let errorDetails = '';

    if (error.status === 0) {
      errorMessage = "Tidak dapat terhubung ke server. Periksa koneksi jaringan Anda.";
    } else if (error.status === 404) {
      errorMessage = "Data yang diminta tidak ditemukan (Error 404).";
    } else if (error.error) {
      errorDetails = JSON.stringify(error.error);
      if (error.error.message) {
        errorMessage = error.error.message;
      } else if (typeof error.error === "string") {
        errorMessage = error.error;
      } else if (error.error.errors && typeof error.error.errors === 'object') {
        const validationErrors = error.error.errors;
        errorMessage = "Validasi gagal. Periksa kembali data.";
        errorDetails = Object.keys(validationErrors)
          .map((field) => `${field}: ${validationErrors[field].join(", ")}`)
          .join("; ");
        errorMessage += ` Details: ${errorDetails}`;
      } else {
        errorMessage = `Server error: ${error.status} - ${error.statusText}`;
      }
    } else if (error.message) {
      errorMessage = error.message;
    } else {
      errorMessage = `Error tidak diketahui. Status: ${error.status || 'N/A'}`;
    }

    console.error(`Error Details: ${errorDetails}`, error);
    Swal.fire({
      title: "Error",
      text: errorMessage,
      icon: "error",
      confirmButtonText: "OK"
    });
  }

  // Method untuk menambah catatan - menggunakan POST ke endpoint notes
  addDocNote(doc: any) {
    Swal.fire({
      title: 'Tambah Catatan',
      input: 'textarea',
      inputLabel: `Catatan untuk: ${doc.document_type}`,
      inputValue: doc.noted || '',
      inputPlaceholder: 'Masukkan catatan...',
      inputAttributes: {
        rows: '8', // ini untuk membuat textarea lebih tinggi
      },
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      cancelButtonText: 'Batal',
      width: '700px', // Atur lebar modal di sini
      customClass: {
        input: 'swal-wide-textarea'
      },
      didOpen: () => {
        const textarea = Swal.getInput() as unknown as HTMLTextAreaElement;
        if (textarea) {
          textarea.style.minHeight = '150px';
        }
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;

        const payload = {
          support_doc_id: doc.id,
          noted: result.value,
          created_by: this.GodocUser?.nik || '',
          updated_by: this.GodocUser?.nik || ''
        };

        this.service.post(`/supportproposednoted`, payload)
          .pipe(
            catchError(error => {
              console.error('Create note error:', error);
              this.handleError(error, 'Gagal menambahkan catatan');
              this.loading = false;
              return of(null);
            })
          )
          .subscribe({
            next: (response: any) => {
              if (response) {
                this.showToast('Catatan berhasil disimpan', 'success');
                doc.noted = result.value;
                this.loadSupportDocs(this.proposedId);
              }
              this.loading = false;
            }
          });
      }
    });
  }

  toggleFileDisplay(index: number) {
    // Pastikan documentTypes ada dan valid
    if (this.documentTypes && this.documentTypes.length > index) {
      // Tambahkan properti showFiles jika belum ada
      if (this.documentTypes[index].showFiles === undefined) {
        this.documentTypes[index].showFiles = false;
      }

      // Toggle nilai showFiles
      this.documentTypes[index].showFiles = !this.documentTypes[index].showFiles;

      // Jika showFiles true dan files belum diambil, ambil data file
      if (this.documentTypes[index].showFiles && (!this.documentTypes[index].files || this.documentTypes[index].files.length === 0)) {
        this.loadDocumentFiles(this.documentTypes[index]);
      }
    }
  }

  // Method untuk load file dokumen dari API
  loadDocumentFiles(doc: any) {
    this.loading = true;

    // Kirim request ke API untuk mendapatkan file dokumen
    this.service.get(`/supportproposed-files/${doc.id}`)
      .pipe(
        catchError(error => {
          console.error(`Error loading files for document ID ${doc.id}:`, error);
          this.handleError(error, 'Gagal memuat file dokumen');
          this.loading = false;
          return of(null);
        })
      )
      .subscribe({
        next: (response: any) => {
          if (response && response.data) {
            // Update files property di document
            doc.files = response.data;
          } else {
            doc.files = [];
          }
          this.loading = false;
        }
      });
  }

  // Method untuk menampilkan dokumen yang sudah diupload
  showUploadedFiles(doc: any) {
    // Pastikan doc ada dan memiliki ID
    if (!doc || !doc.id) {
      this.showToast('ID dokumen tidak valid', 'error');
      return;
    }

    const docId = doc.id;
    this.loading = true;

    this.service.get(`/uploadsupport/${docId}`)
      .pipe(
        catchError(error => {
          console.error(`Error loading files for document ID ${docId}:`, error);
          this.handleError(error, 'Gagal memuat file dokumen');
          this.loading = false;
          return of(null);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (response: any) => {
          if (response && response.data) {
            const files = response.data;

            // Jika tidak ada file yang ditemukan
            if (files.length === 0) {
              Swal.fire({
                title: 'Info',
                text: 'Tidak ada dokumen yang tersedia untuk ditampilkan',
                icon: 'info',
                confirmButtonText: 'OK'
              });
              return;
            }

            const tableRows = files.map((file: any) => {
              return `
              <tr>
                <td>${file.version || '-'}</td>
                <td>${file.file || '-'}</td>
                <td>${file.created_by || '-'}</td>
                <td>${new Date(file.created_date).toLocaleString()}</td>
                <td><span class="badge ${file.status ? 'bg-success' : 'bg-secondary'}">
                  ${file.status ? 'Aktif' : 'Nonaktif'}
                </span></td>
                <td>
                  <button 
                     data-id="${file.id}"
                     class="btn-view-doc btn btn-sm btn-outline-info me-1" 
                     title="Lihat Dokumen">
                    <i class="ri-eye-line"></i>
                  </button>
                  <button 
                     data-id="${file.id}"
                     class="btn-download-doc btn btn-sm btn-outline-success" 
                     title="Download dengan Watermark">
                    <i class="ri-download-2-line"></i>
                  </button>
                </td>
              </tr>
            `;
            }).join('');

            const tableHTML = `
            <div class="table-responsive">
              <table class="table table-bordered align-middle">
                <thead>
                  <tr>
                    <th>Versi</th>
                    <th>Nama File</th>
                    <th>Dibuat Oleh</th>
                    <th>Tanggal Dibuat</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows}
                </tbody>
              </table>
            </div>
          `;

            // Menyimpan instance this untuk digunakan dalam event handler
            const self = this;

            Swal.fire({
              title: 'Daftar Dokumen',
              html: tableHTML,
              width: '80%',
              confirmButtonText: 'Tutup',
              didOpen: () => {
                // Handle view document
                document.querySelectorAll('.btn-view-doc').forEach(btn => {
                  btn.addEventListener('click', function (this: HTMLElement) {
                    const fileId = this.getAttribute('data-id');
                    self.viewDocument(fileId);
                  });
                });

                // Handle download document
                document.querySelectorAll('.btn-download-doc').forEach(btn => {
                  btn.addEventListener('click', function (this: HTMLElement) {
                    const fileId = this.getAttribute('data-id');
                    self.downloadDocument(fileId);
                  });
                });
              }
            });
          } else {
            Swal.fire({
              icon: 'info',
              title: 'Tidak ada data',
              text: 'Tidak ada dokumen yang tersedia'
            });
          }
        }
      });
  }


  // Method untuk menampilkan dokumen yang sudah diupload
  showUpNote(doc: any) {
    if (!doc || !doc.id) {
      this.showToast('ID dokumen tidak valid', 'error');
      return;
    }

    const docId = doc.id;
    this.loading = true;

    this.service.get(`/support-docs-noted/${docId}/notes/`)
      .pipe(
        catchError(error => {
          console.error(`Error loading notes for document ID ${docId}:`, error);
          this.handleError(error, 'Gagal memuat catatan');
          this.loading = false;
          return of(null);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (response: any) => {
          if (response && response.data) {
            const notes = response.data;

            if (notes.length === 0) {
              Swal.fire({
                title: 'Info',
                text: 'Tidak ada catatan yang tersedia untuk ditampilkan',
                icon: 'info',
                confirmButtonText: 'OK'
              });
              return;
            }

            const tableRows = notes.map((note: any) => `
            <tr>
              <td>${note.version || '-'}</td>
              <td>${note.noted || '-'}</td>
              <td>${note.created_by || '-'}</td>
              <td>${new Date(note.created_date).toLocaleString()}</td>
            </tr>
          `).join('');

            const tableHTML = `
            <div class="table-responsive">
              <table class="table table-bordered align-middle">
                <thead>
                  <tr>
                    <th>Versi</th>
                    <th>Catatan</th>
                    <th>Dibuat Oleh</th>
                    <th>Tanggal Dibuat</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows}
                </tbody>
              </table>
            </div>
          `;

            Swal.fire({
              title: 'Daftar Catatan',
              html: tableHTML,
              width: '60%',
              confirmButtonText: 'Tutup',
            });

          } else {
            Swal.fire({
              icon: 'info',
              title: 'Tidak ada data',
              text: 'Tidak ada catatan yang tersedia'
            });
          }
        }
      });
  }


  // Fungsi untuk melihat dokumen dengan iframe dalam SweetAlert
  // Menggunakan teknik proxy untuk mengatasi masalah CSP
  viewDocument(fileId: string | null) {
    if (!fileId) {
      this.showToast('ID file tidak valid', 'error');
      return;
    }

    // Tampilkan loading
    Swal.fire({
      title: 'Memuat Dokumen...',
      didOpen: () => {
        Swal.showLoading();
      },
      allowOutsideClick: false
    });

    // URL dokumen asli
    const docUrl = `${environment.apiUrl}/support-docs/file/${fileId}/view`;

    // Coba membuat dokumen proxy sederhana yang bisa menampilkan dalam iframe
    // Catatan: Ini hanya contoh, solusi sebenarnya mungkin memerlukan perubahan di server
    const proxyHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Dokumen Viewer</title>
      <style>
        body, html { margin: 0; padding: 0; height: 100%; }
        iframe, embed, object { width: 100%; height: 100%; border: none; }
      </style>
    </head>
    <body>
      <embed src="${docUrl}" type="application/pdf" />
    </body>
    </html>
  `;

    // Buat objek Blob dan URL untuk mengakses konten secara lokal
    const blob = new Blob([proxyHtml], { type: 'text/html' });
    const proxyUrl = URL.createObjectURL(blob);

    // Tampilkan dalam SweetAlert
    setTimeout(() => {
      Swal.close();

      Swal.fire({
        title: 'Lihat Dokumen',
        width: '90%',
        heightAuto: false,
        html: `
        <div class="document-container position-relative" style="height: 80vh;">
          <div class="text-end mb-2">
            <button class="btn btn-sm btn-primary" id="open-doc-tab">
              <i class="ri-external-link-line me-1"></i> Buka di Tab Baru
            </button>
            <button class="btn btn-sm btn-info ms-2" id="download-doc">
              <i class="ri-download-line me-1"></i> Download
            </button>
          </div>
          
          <iframe src="${proxyUrl}" style="width: 100%; height: calc(100% - 40px); border: 1px solid #dee2e6; border-radius: 4px;"></iframe>
          
          <div class="mt-3 text-center d-none" id="iframe-fallback">
            <p class="text-danger">Browser Anda tidak mendukung tampilan dokumen langsung.</p>
            <button class="btn btn-primary" id="fallback-open">Buka di Tab Baru</button>
          </div>
        </div>
      `,
        showConfirmButton: true,
        confirmButtonText: 'Tutup',
        didOpen: () => {
          // Tambahkan event listener untuk tombol
          document.getElementById('open-doc-tab')?.addEventListener('click', () => {
            window.open(docUrl, '_blank');
          });

          document.getElementById('download-doc')?.addEventListener('click', () => {
            this.downloadDocument(fileId);
          });

          document.getElementById('fallback-open')?.addEventListener('click', () => {
            window.open(docUrl, '_blank');
          });

          // Deteksi jika iframe tidak berfungsi
          setTimeout(() => {
            const iframe = document.querySelector('iframe');
            if (iframe && (!iframe.clientHeight || iframe.clientHeight < 50)) {
              document.getElementById('iframe-fallback')?.classList.remove('d-none');
            }
          }, 1000);
        },
        willClose: () => {
          // Bersihkan URL objek untuk mencegah memory leak
          URL.revokeObjectURL(proxyUrl);
        }
      });
    }, 1000);
  }

  // Fungsi untuk download dokumen yang sudah diperbaiki
  downloadDocument(fileId: string | null) {
    if (!fileId) {
      this.showToast('ID file tidak valid', 'error');
      return;
    }

    // Tampilkan loading
    Swal.fire({
      title: 'Mengunduh...',
      text: 'Sedang mengunduh dokumen',
      didOpen: () => {
        Swal.showLoading();
      },
      allowOutsideClick: false
    });

    // Gunakan metode downloadFile dari service
    this.service.downloadFile(`/support-docs/file/${fileId}/download`)
      .pipe(
        catchError(error => {
          console.error('Gagal mengunduh dokumen', error);
          Swal.fire({
            icon: 'error',
            title: 'Gagal mengunduh dokumen',
            text: 'Terjadi kesalahan saat mengunduh dokumen dari server.'
          });
          return of(null);
        })
      )
      .subscribe({
        next: (response: any) => {
          Swal.close();

          if (!response) {
            return;
          }

          // Buat nama file yang lebih deskriptif
          const fileName = `document-${fileId}-${new Date().getTime()}`;

          // Buat link untuk download dan klik secara otomatis
          const url = window.URL.createObjectURL(response);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();

          // Bersihkan resource
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            this.showToast('Dokumen berhasil diunduh', 'success');
          }, 100);
        }
      });
  }

  goBack() {
    this.router.navigate(['/activity-page/list-approval-pc']);
  }



  // ====== IMPLEMENTASI LOGIC APPROVAL ======

  // Menampilkan modal konfirmasi
  openConfirmationModal(modal: any) {
    this.approvalNote = ''; // Reset note
    this.modalService.open(modal, { centered: true, backdrop: 'static' });
  }

  // Implementasi metode untuk action tombol
  approveDocument() {
    console.log('Dokumen diapprove');
    this.modalService.open(this.approveModal, {
      centered: true,
      backdrop: 'static'
    }).result.then(
      (result) => {
        if (result === 'confirm') {
          this.processApproval('approved');
        }
      },
      () => { } // Dismissed
    );
  }

  notApproveDocument() {
    console.log('Dokumen tidak diapprove');
    this.modalService.open(this.notApproveModal, {
      centered: true,
      backdrop: 'static'
    }).result.then(
      (result) => {
        if (result === 'confirm') {
          this.processApproval('not_approved');
        }
      },
      () => { } // Dismissed
    );
  }

  rejectDocument() {
    console.log('Dokumen direject');
    // Periksa akses reject
    if (!this.hasRejectionAccess) {
      this.showToast('Anda tidak memiliki akses untuk melakukan reject', 'warning');
      return;
    }

    this.modalService.open(this.rejectModal, {
      centered: true,
      backdrop: 'static'
    }).result.then(
      (result) => {
        if (result === 'confirm') {
          this.processApproval('rejected');
        }
      },
      () => { } // Dismissed
    );
  }
  // Proses approval
  async processApproval(status: 'approved' | 'not_approved' | 'rejected'): Promise<void> {
    // ...validasi & persiapan data sama seperti sebelumnya...

    // Hindari navigasi otomatis dengan membuat variabel untuk mengontrol alur
    let shouldNavigate = false;
    const data = {
      proposed_changes_id: this.proposedId,
      auth_id: this.GodocUser.auth_id,
      status: status,
      note: this.approvalNote,
      employee_code: this.GodocUser.employee_code || ''
    };

    this.service.post('/status', data)
      .pipe(
        catchError(error => {
          this.handleError(error, 'Gagal mengupdate status approval');
          this.loading = false;
          return of(null);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(async (response: any) => {
        if (response) {
          let message = '';
          switch (status) {
            case 'approved':
              message = 'Dokumen berhasil diapprove';
              break;
            case 'not_approved':
              message = 'Dokumen tidak diapprove';
              break;
            case 'rejected':
              message = 'Dokumen berhasil direject';
              break;
          }
          if (response.data) {
            this.proposedData = response.data;
            this.populateForm(response.data);
          }

          try {
            // Pastikan SweetAlert telah selesai
            const result = await Swal.fire({
              title: 'Sukses',
              text: message,
              icon: 'success',
              confirmButtonText: 'OK',
              allowOutsideClick: false // Mencegah klik di luar dialog menutup dialog
            });

            // Hanya navigasi jika user benar-benar menekan "OK"
            if (result.isConfirmed) {
              this.router.navigate(['/activity-page/list-approval-pc']);
            }
          } catch (error) {
            console.error('Error showing alert:', error);
          }
        }
      });
  }

  // Method untuk menutup modal dan konfirmasi
  confirmAction(modal: any, action: string): void {
    modal.close('confirm');

    switch (action) {
      case 'approve':
        this.processApproval('approved');
        break;
      case 'notApprove':
        this.processApproval('not_approved');
        break;
      case 'reject':
        this.processApproval('rejected');
        break;
    }
  }

  // Method untuk membatalkan dan menutup modal
  cancelAction(modal: any): void {
    modal.dismiss('cancel');
  }

}