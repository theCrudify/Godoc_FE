import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from "@angular/forms";
import Swal from "sweetalert2";
import { AppService } from "src/app/shared/service/app.service";
import { TokenStorageService } from "src/app/core/services/token-storage.service";
import { catchError, finalize } from "rxjs/operators";
import { ActivatedRoute, ParamMap, Router } from "@angular/router";
import { of } from 'rxjs';
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
  title?: string;
  noted?: string;
  created_by: string;
  created_date: string;
  updated_at?: string;
  updated_by?: string;
  isChecked?: boolean;
  showNote?: boolean;
}

interface CurrencyItem {
  id: number;
  code: string;
  name: string;
  symbol: string;
}

interface SelectOption {
  name: string;
  value: string;
}

@Component({
  selector: "app-edit-proposed-changes",
  templateUrl: "./edit-proposed-changes.component.html",
  styleUrls: ["./edit-proposed-changes.component.scss"],
  encapsulation: ViewEncapsulation.None
})
export class EditProposedChangesComponent implements OnInit {
  // Properties
  GodocUser: any;
  breadCrumbItems: Array<{ label: string; active?: boolean }> = [];
  loading = false;
  showInstructions = false;
  documentSearchTerm: string = '';
  proposedId: number = 0;
  hasChanges: boolean = false;
  initialFormValue: any = null;

  // Tooltips array to initialize
  tooltips: any[] = [];

  // Data from API
  proposedData: any = null;
  supportDocs: any[] = [];

  // Dropdown lists
  documentNumbers: DropdownItem[] = [];
  documentTypes: any[] = [];

  // Dropdown options
itemChangeOptions: SelectOption[] = [
  { name: 'Progress', value: 'Progress' },
  { name: 'Checking', value: 'Checking' },
  { name: 'System', value: 'System' },
  { name: 'Tools', value: 'Tools' },
  { name: 'Documents', value: 'Documents' }
];


  changeTypeOptions: SelectOption[] = [
    { name: 'Modification', value: 'Modification' },
    { name: 'New Installation', value: 'New Installation' },
    { name: 'Replacement', value: 'Replacement' },
    { name: 'Improvement', value: 'Improvement' }
  ];





  // Currency Array
  currencies: CurrencyItem[] = [
    { id: 1, code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp ' }, // Note the space after symbol
    { id: 2, code: 'USD', name: 'US Dollar', symbol: '$ ' },
    { id: 3, code: 'EUR', name: 'Euro', symbol: '€ ' },
    { id: 4, code: 'JPY', name: 'Japanese Yen', symbol: '¥ ' },
    { id: 5, code: 'SGD', name: 'Singapore Dollar', symbol: 'S$ ' }
  ];

  // Total cost in IDR
  totalCostIDR: number = 0;

  formData!: FormGroup;
  formData2!: FormGroup; // Form untuk support documents

  constructor(
    private service: AppService,
    private fb: FormBuilder,
    private tokenStorage: TokenStorageService,
    private router: Router,
    private route: ActivatedRoute
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
        this.router.navigate(['/activity-page/proposedchanges-list']);
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
    } else {
      console.log('Bootstrap not available, skipping tooltip initialization');
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
      { label: `Edit: ${projectName || `ID ${this.proposedId}`}`, active: true },
    ];
  }

  initForm() {
    this.formData = this.fb.group({
      project_name: [{ value: null, disabled: true }],
      item_changes: [null, Validators.required],
      line_code: [{ value: '', disabled: true }],
      section_code: [{ value: '', disabled: true }],
      department_id: [{ value: null, disabled: true }],
      section_department_id: [{ value: null, disabled: true }],
      plant_id: [{ value: null, disabled: true }],
      change_type: [null, Validators.required],
      description: [null, Validators.required],
      reason: [null, Validators.required],
      cost: [{ value: null, disabled: true }],
      cost_text: [null],
      costItems: this.fb.array([]),
      planning_start: [null, Validators.required],
      planning_end: [null, Validators.required],
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

    // Add initial cost item
    this.addCostItem();

    // Listen for form changes
    this.formData.valueChanges.subscribe(() => {
      if (this.initialFormValue) {
        this.hasChanges = !this.isEqual(this.formData.value, this.initialFormValue);
      }

      // Update cost_text from costItems
      this.updateCostText();
    });
  }

  // Compare two objects to detect changes
  isEqual(obj1: any, obj2: any): boolean {
    const editableFields = ['item_changes', 'change_type', 'description', 'reason', 'cost_text', 'planning_start', 'planning_end'];

    return editableFields.every(field => {
      if (field === 'planning_start' || field === 'planning_end') {
        const date1 = obj1[field] ? new Date(obj1[field]) : null;
        const date2 = obj2[field] ? new Date(obj2[field]) : null;

        if (date1 && date2) {
          return date1.toDateString() === date2.toDateString();
        }
        return obj1[field] === obj2[field];
      }
      return obj1[field] === obj2[field];
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

  // Create a cost item form group
  createCostItem(currency: string = 'IDR', amount: string = ''): FormGroup {
    return this.fb.group({
      currency: [currency, Validators.required],
      amount: [amount, [Validators.required, Validators.pattern(/^[\d\.]+$/)]],
      exchangeRate: [1],
      amountInIDR: [0]
    });
  }

  // Add a new cost item
  addCostItem() {
    this.costItems.push(this.createCostItem());
    this.hasChanges = true;
  }

  // Remove a cost item
  removeCostItem(index: number) {
    this.costItems.removeAt(index);
    this.hasChanges = true;
    this.updateCostText();
  }

  // Handle currency change
  onCurrencyChange(index: number, event: any) {
    // Additional logic if needed
    this.updateCostText();
  }

  // Handle amount input
  onAmountInput(index: number, event: any) {
    const value = event.target.value;

    // Clean the value - keep only numbers and dots
    const cleanValue = value.replace(/[^\d\.]/g, '');

    // Update the form control value if needed
    const amountControl = this.costItems.at(index).get('amount');
    if (amountControl && cleanValue !== value) {
      amountControl.setValue(cleanValue, { emitEvent: false });
      event.target.value = cleanValue;
    }

    this.updateCostText();
  }

  // Format a date for input field
  formatDateForInput(date: string | Date | null): string {
    if (!date) return '';

    const d = new Date(date);
    // Format as YYYY-MM-DD for date input fields
    return d.toISOString().split('T')[0];
  }

  // Update cost_text based on costItems
  updateCostText() {
    const items = this.costItems.value;
    let costText = '';

    items.forEach((item: any, index: number) => {
      if (item.currency && item.amount) {
        const symbol = this.getCurrencySymbol(item.currency);
        costText += `${symbol}${item.amount}`;
        if (index < items.length - 1) {
          costText += '\n';
        }
      }
    });

    this.formData.get('cost_text')?.setValue(costText, { emitEvent: false });
  }

  // Check if cost items are valid
  costItemsValid(): boolean {
    if (this.costItems.length === 0) return false;

    for (let i = 0; i < this.costItems.length; i++) {
      const item = this.costItems.at(i);
      if (!item.valid) return false;
    }

    return true;
  }

  // Load Proposed Changes data by ID
  loadProposedData(id: number) {
    this.loading = true;
    console.log(`Loading proposed changes data for ID: ${id}`);

    this.service.get(`/proposedchanges/${id}`)
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
            this.populateForm(this.proposedData);
            this.showToast(`Data proposed changes berhasil dimuat`, 'success');

            // Store initial form values
            this.initialFormValue = { ...this.formData.value };
            this.hasChanges = false;
          } else {
            this.showToast(`Data dengan ID ${id} tidak ditemukan`, 'error');
            setTimeout(() => this.goBack(), 2000);
          }
          this.loading = false;
        }
      });
  }

  // Load Support Documents for this proposed change
  loadSupportDocs(id: number) {
    this.loading = true;
    console.log(`Loading support documents for proposed ID: ${id}`);

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
        id: [doc.id],
        support_doc_id: [{ value: doc.support_doc_id, disabled: true }],
        document_type: [{ value: doc.document_type, disabled: true }],
        title: [{ value: doc.title, disabled: true }],
        noted: [{ value: doc.noted, disabled: true }],
        status: [doc.status],
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
  
    // Konversi string dengan format comma-separated menjadi array
    const itemChangesArray = this.convertStringToArray(data.item_changes);
    const changeTypeArray = this.convertStringToArray(data.change_type);
    
    console.log("Data original:", {
      item_changes: data.item_changes,
      change_type: data.change_type
    });
    
    console.log("Data setelah konversi:", {
      itemChanges: itemChangesArray,
      changeType: changeTypeArray
    });
    
    // Basic form data
    this.formData.patchValue({
      project_name: data.project_name,
      item_changes: itemChangesArray, // Array nilai untuk ng-select
      line_code: data.line_code,
      section_code: data.section_code,
      department_id: data.department_id,
      section_department_id: data.section_department_id,
      plant_id: data.plant_id,
      change_type: changeTypeArray, // Array nilai untuk ng-select
      description: data.description,
      reason: data.reason,
      cost: data.cost,
      cost_text: data.cost_text,
      planning_start: this.formatDateForInput(data.planning_start),
      planning_end: this.formatDateForInput(data.planning_end),
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

    // Split the cost text by new lines
    const costLines = costText.split('\n');

    costLines.forEach(line => {
      // Remove ** from the line
      const cleanLine = line.replace(/\*\*/g, '').trim();
      if (cleanLine) {
        // Extract currency and amount
        // Format: "Rp 765.765" or "$ 9.879.897"
        const match = cleanLine.match(/^([^\d\s]+)\s*([\d\.]+)/);

        if (match) {
          const currencySymbol = match[1].trim();
          const amount = match[2].trim();

          // Convert currency symbol to code
          let currencyCode = 'IDR'; // Default
          switch (currencySymbol) {
            case '$': currencyCode = 'USD'; break;
            case '€': currencyCode = 'EUR'; break;
            case '¥': currencyCode = 'JPY'; break;
            case 'S$': currencyCode = 'SGD'; break;
            case 'Rp': currencyCode = 'IDR'; break;
          }

          // Add cost item to form array
          this.costItems.push(this.createCostItem(currencyCode, amount));
        }
      }
    });

    // Ensure there is at least one cost item
    if (this.costItems.length === 0) {
      this.addCostItem();
    }
  }

  // Format currency with Indonesian style (dots as thousand separators)
  formatIdCurrency(value: any): string {
    if (!value) return '0';

    // If it's already a formatted string with dots, return it as is
    if (typeof value === 'string' && value.includes('.')) {
      return value;
    }

    // Convert to string and remove any commas or periods
    const numStr = value.toString().replace(/[,\.]/g, '');

    // Parse to number
    const num = parseInt(numStr, 10);

    // Check if it's a valid number
    if (isNaN(num)) return '0';

    // Format with dots as thousand separators (Indonesian style)
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  // Format currency with thousand separators (this is unused now, replaced by formatIdCurrency)
  formatCurrency(value: number | string): string {
    if (!value) return '0';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num.toLocaleString('id-ID');
  }

  // Get currency symbol based on currency code
  getCurrencySymbol(currencyCode: string | null | undefined): string {
    if (!currencyCode) return '';

    const currency = this.currencies.find(c => c.code === currencyCode);
    return currency ? currency.symbol : '';
  }

  // Calculate form progress
  getFormProgress(): number {
    return 100; // Always 100% for edit mode since we're editing existing data
  }

  // Check if all mandatory fields are complete
  isMandatoryFieldsComplete(): boolean {
    const form = this.formData;
    return !!(
      form.get('item_changes')?.value &&
      form.get('change_type')?.value &&
      form.get('description')?.value &&
      form.get('reason')?.value &&
      form.get('planning_start')?.value &&
      form.get('planning_end')?.value &&
      this.costItemsValid()
    );
  }

  // Check if date range is valid
  dateRangeValid(): boolean {
    const startDate = this.formData.get('planning_start')?.value;
    const endDate = this.formData.get('planning_end')?.value;

    if (!startDate || !endDate) return true; // Skip validation if dates are not set

    return new Date(startDate) <= new Date(endDate);
  }

  // Filter documents by search term
  getFilteredDocuments(): any[] {
    if (!this.documentSearchTerm) return this.documentTypes;

    return this.documentTypes.filter(doc =>
      doc.document_type.toLowerCase().includes(this.documentSearchTerm.toLowerCase())
    );
  }

  // Toggle a checkbox in document list
  toggleCheckbox(doc: any) {
    doc.isChecked = !doc.isChecked;
    doc.status = doc.isChecked;

    // Find the corresponding form control and update it
    const formArray = this.formData2.get('data') as FormArray;
    const index = this.supportDocs.findIndex(item => item.id === doc.id);

    if (index >= 0 && formArray.controls[index]) {
      formArray.controls[index].get('status')?.setValue(doc.isChecked);
    }

    this.hasChanges = true;
  }

  // Save changes to the proposed changes
  saveChanges() {
    if (!this.isMandatoryFieldsComplete()) {
      this.showToast('Harap lengkapi semua field wajib', 'error');
      return;
    }

    if (!this.dateRangeValid()) {
      this.showToast('Tanggal mulai harus sebelum atau sama dengan tanggal akhir', 'error');
      return;
    }

    this.loading = true;

    // Ensure cost_text is updated from costItems
    this.updateCostText();

    // Prepare data for update
    const updateData = {
      item_changes: this.formData.get('item_changes')?.value,
      change_type: this.formData.get('change_type')?.value,
      description: this.formData.get('description')?.value,
      reason: this.formData.get('reason')?.value,
      cost_text: this.formData.get('cost_text')?.value,
      planning_start: this.formData.get('planning_start')?.value,
      planning_end: this.formData.get('planning_end')?.value,
      updated_by: this.GodocUser?.nik || '',
      auth_id: this.GodocUser?.auth_id
    };

    // Update proposed changes
    this.service.put(`/proposedchanges/${this.proposedId}`, updateData)
      .pipe(
        catchError(error => {
          console.error('Update error:', error);
          this.handleError(error, 'Gagal mengupdate data proposed changes');
          this.loading = false;
          return of(null);
        })
      )
      .subscribe({
        next: (response: any) => {
          if (response) {
            // Check if support docs have changed
            const supportDocsChanged = this.checkSupportDocsChanged();

            if (supportDocsChanged) {
              this.updateSupportDocuments(() => {
                this.updateSuccess();
              });
            } else {
              this.updateSuccess();
            }
          } else {
            this.loading = false;
          }
        }
      });
  }

  // Check if support documents have changed
  checkSupportDocsChanged(): boolean {
    const formArray = this.formData2.get('data') as FormArray;

    for (let i = 0; i < this.supportDocs.length; i++) {
      const originalStatus = this.supportDocs[i].status;
      const currentStatus = formArray.controls[i].get('status')?.value;

      if (originalStatus !== currentStatus) {
        return true;
      }
    }

    return false;
  }

  // Update support documents
  updateSupportDocuments(callback?: () => void) {
    const formArray = this.formData2.get('data') as FormArray;

    // Prepare data for update
    const updateData = formArray.controls
      .map((control, index) => {
        const originalStatus = this.supportDocs[index].status;
        const currentStatus = control.get('status')?.value;

        // Only include changed items
        if (originalStatus !== currentStatus) {
          return {
            id: control.get('id')?.value,
            status: currentStatus,
            updated_by: this.GodocUser?.nik || ''
          };
        }
        return null;
      })
      .filter(item => item !== null);

    if (updateData.length === 0) {
      if (callback) callback();
      return;
    }

    // Update support documents
    this.service.put(`/supportdocuments/${this.proposedId}/status`, updateData)
      .pipe(
        catchError(error => {
          console.error('Update support docs error:', error);
          this.handleError(error, 'Gagal mengupdate status dokumen pendukung');
          this.loading = false;
          return of(null);
        })
      )
      .subscribe({
        next: (response: any) => {
          if (response) {
            if (callback) callback();
          } else {
            this.loading = false;
          }
        }
      });
  }

  // Handle successful update
  updateSuccess() {
    this.showToast('Data berhasil diperbarui', 'success');
    this.loading = false;
    this.hasChanges = false;

    // Reload data to get the latest changes
    this.loadProposedData(this.proposedId);
    this.loadSupportDocs(this.proposedId);

    // Navigate Back after successful update
    setTimeout(() => {
      this.router.navigate(['/activity-page/proposedchanges-list']);
    }, 1500);
  }

  // Confirm before leaving if there are unsaved changes
  canDeactivate(): boolean | Promise<boolean> {
    if (this.hasChanges) {
      return Swal.fire({
        title: 'Perubahan belum disimpan',
        text: 'Anda memiliki perubahan yang belum disimpan. Apakah Anda yakin ingin meninggalkan halaman ini?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, tinggalkan',
        cancelButtonText: 'Tidak, tetap di halaman'
      }).then(result => {
        return result.isConfirmed;
      });
    }
    return true;
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

  goBack() {
    if (this.hasChanges) {
      Swal.fire({
        title: 'Perubahan belum disimpan',
        text: 'Anda memiliki perubahan yang belum disimpan. Apakah Anda yakin ingin kembali?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, kembali',
        cancelButtonText: 'Tidak, tetap di halaman'
      }).then(result => {
        if (result.isConfirmed) {
          this.router.navigate(['/activity-page/proposedchanges-list']);
        }
      });
    } else {
      this.router.navigate(['/activity-page/proposedchanges-list']);
    }
  }


// Add these new methods to the EditProposedChangesComponent class

// Methods for Item Changes
selectAllItemChanges() {
  const allItemChanges = this.itemChangeOptions.map(option => option.value);
  this.formData.get('item_changes')?.setValue(allItemChanges);
  this.hasChanges = true;
}

isItemChangeSelected(item: SelectOption): boolean {
  const selectedValues = this.formData.get('item_changes')?.value;
  if (!selectedValues || !Array.isArray(selectedValues)) return false;
  return selectedValues.includes(item.value);
}

removeItemChange(item: SelectOption) {
  const currentValues = this.formData.get('item_changes')?.value;
  if (!currentValues || !Array.isArray(currentValues)) return;
  
  const updatedValues = currentValues.filter((value: string) => value !== item.value);
  this.formData.get('item_changes')?.setValue(updatedValues);
  this.hasChanges = true;
}

// Methods for Change Type
selectAllChangeTypes() {
  const allChangeTypes = this.changeTypeOptions.map(option => option.value);
  this.formData.get('change_type')?.setValue(allChangeTypes);
  this.hasChanges = true;
}

isChangeTypeSelected(item: SelectOption): boolean {
  const selectedValues = this.formData.get('change_type')?.value;
  if (!selectedValues || !Array.isArray(selectedValues)) return false;
  return selectedValues.includes(item.value);
}

removeChangeType(item: SelectOption) {
  const currentValues = this.formData.get('change_type')?.value;
  if (!currentValues || !Array.isArray(currentValues)) return;
  
  const updatedValues = currentValues.filter((value: string) => value !== item.value);
  this.formData.get('change_type')?.setValue(updatedValues);
  this.hasChanges = true;
}

convertStringToArray(value: any): string[] {
  // Jika sudah berupa array, langsung kembalikan
  if (Array.isArray(value)) {
    return value;
  }
  
  // Jika berupa string
  if (typeof value === 'string' && value.trim()) {
    // Split by comma, trim whitespace, dan filter nilai kosong
    return value.split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }
  
  // Untuk null, undefined, atau string kosong
  return [];
}

/**
 * Mengkonversi array menjadi string comma-separated untuk disimpan ke database
 * contoh: ["Improvement", "Modification"] menjadi "Improvement, Modification"
 */
convertArrayToString(value: string[]): string {
  if (Array.isArray(value) && value.length > 0) {
    return value.join(', ');
  }
  return '';
}
  
}