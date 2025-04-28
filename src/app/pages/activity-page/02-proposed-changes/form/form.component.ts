import { Component, OnInit, ViewEncapsulation, LOCALE_ID, Inject, AfterViewInit } from "@angular/core";
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from "@angular/forms";
import Swal from "sweetalert2";
import { AppService } from "src/app/shared/service/app.service";
import { TokenStorageService } from "src/app/core/services/token-storage.service";
import { catchError, debounceTime, distinctUntilChanged, finalize, map } from "rxjs/operators";
import { Router, ActivatedRoute } from "@angular/router";

import { DateAdapter } from '@angular/material/core';
import { Observable, of, Subject } from "rxjs";
declare var bootstrap: any;

interface DropdownItem {
    id?: number;
    code?: string;
    display: string;
    fullData?: any;
}

interface CurrencyItem {
    id: number;
    code: string;
    name: string;
    symbol: string;
}

@Component({
    selector: "app-form",
    templateUrl: "./form.component.html",
    styleUrls: ["./form.component.scss"],
    // Tambahkan encapsulation untuk memastikan style CSS tidak terpengaruh global
    encapsulation: ViewEncapsulation.None
})
export class FormComponent implements OnInit, AfterViewInit {
    // Properties
    GodocUser: any;
    breadCrumbItems: Array<{ label: string; active?: boolean }> = [];
    loading = false;
    showInstructions = true;
    documentSearchTerm: string = '';
    validationErrors: string[] = [];

    //Search Docunum
    searchInput$ = new Subject<string>();

    // Tooltips array to initialize
    tooltips: any[] = [];

    // Dropdown lists
    documentNumbers: DropdownItem[] = [];
    documentTypes: any[] = []; // Untuk menyimpan jenis dokumen dari API

    // Currency Array
    currencies: CurrencyItem[] = [
        { id: 1, code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
        { id: 2, code: 'USD', name: 'US Dollar', symbol: '$' },
        { id: 3, code: 'EUR', name: 'Euro', symbol: '€' },
        { id: 4, code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
        { id: 5, code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' }
    ];

    // Total cost in IDR
    totalCostIDR: number = 0;

    changeTypes: DropdownItem[] = [
        { display: 'Progress' },
        { display: 'Checking' },
        { display: 'System' },
        { display: 'Tools' },
        { display: 'Documents' }
    ];

    formData!: FormGroup;
    formData2!: FormGroup; // Form untuk menyimpan data support documents yang akan dikirim ke API
    id: number | undefined;
    selectedDoc: any;

    constructor(
        private service: AppService,
        private fb: FormBuilder,
        private tokenStorage: TokenStorageService,
        private router: Router,
        private dateAdapter: DateAdapter<Date>,
        private route: ActivatedRoute, // Tambahkan DateAdapter
    ) { }

    ngOnInit(): void {
        const idFromStorage = sessionStorage.getItem('formId');
        if (idFromStorage) {
            this.id = Number(idFromStorage);
            console.log('✅ ID diterima dari sessionStorage:', this.id);
        } else {
            console.warn('⚠️ ID tidak ditemukan di sessionStorage!');
            // Misalnya lakukan redirect atau tampilkan pesan kesalahan
        }

        // Lanjutkan dengan inisialisasi lainnya
        this.GodocUser = this.tokenStorage.getUser();
        console.log("User from tokenStorage:", this.GodocUser);

        this.dateAdapter.setLocale('id');

        this.initForm();
        this.initSupportDocsForm();
        this.initBreadcrumbs();

        // Pastikan ng-select dilengkapi sebelum mencoba mengatur document number
        this.loadDocumentNumbers().subscribe(() => {
            // Jika ID tersedia dari sessionStorage, ambil data dari API
            if (this.id) {
                this.loadFormDataById(this.id);
            }
        });

        this.loadSupportDocs();

        // Setup handling untuk searchInput dari ng-select
        this.searchInput$.pipe(
            debounceTime(400),  // Tunggu 400ms setelah pengguna berhenti mengetik
            distinctUntilChanged()  // Hanya memicu jika nilai berubah
        ).subscribe(term => {
            this.searchDocumentNumbers(term);
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
        // Periksa apakah objek bootstrap tersedia
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
        this.breadCrumbItems = [
            { label: "Activity" },
            { label: "Form Proposed Changes", active: true },
        ];
    }

    // Fungsi yang diperbarui untuk menambahkan area.area ke hasil pencarian dokumen
    searchDocumentNumbers(term: string) {
        if (!term || term.length < 2) {
            this.loading = false;
            return of([]); // Don't search for very short terms
        }

        this.loading = true;
        return this.service.get(`/documentnumbers?search=${term}`).pipe(
            map((result: any) => {
                if (result && result.data) {
                    const docs = result.data.map((item: any) => {
                        // Tambahkan informasi area.area ke display string jika tersedia
                        const areaInfo = item.area?.area ? ` (${item.area.area})` : '';

                        return {
                            id: item.id,
                            display: `${item.running_number || 'N/A'} - ${item.klasifikasi_document || 'No Description'}${areaInfo}`,
                            fullData: item
                        };
                    });

                    // Update dokumentNumbers dengan hasil pencarian
                    this.documentNumbers = [...this.documentNumbers, ...docs.filter(
                        (doc: DropdownItem) => !this.documentNumbers.some(existingDoc => existingDoc.id === doc.id)
                    )];

                    this.loading = false;
                    return docs;
                }
                this.loading = false;
                return [];
            }),
            catchError(error => {
                this.handleError(error, "Error fetching document numbers");
                this.loading = false;
                return of([]);
            })
        );
    }

    // Fungsi yang diperbarui untuk menambahkan area.area ke daftar dokumen
    loadDocumentNumbers(searchTerm: string = ""): Observable<any> {
        this.loading = true;
        return this.service.get(`/documentnumbers?search=${searchTerm}`).pipe(
            map((result: any) => {
                if (result && result.data) {
                    const newDocs = result.data.map((item: any) => {
                        // Tambahkan informasi area.area ke display string jika tersedia
                        const areaInfo = item.area?.area ? ` (${item.area.area})` : '';

                        return {
                            id: item.id,
                            display: `${item.running_number || 'N/A'} - ${item.klasifikasi_document || 'No Description'}${areaInfo}`,
                            fullData: item
                        };
                    });

                    // Update documentNumbers dengan hasil yang baru, hindari duplikasi
                    this.documentNumbers = [...this.documentNumbers, ...newDocs.filter(
                        (doc: DropdownItem) => !this.documentNumbers.some(existingDoc => existingDoc.id === doc.id)
                    )];
                }
                this.loading = false;
                return this.documentNumbers;
            }),
            catchError(error => {
                this.handleError(error, "Error fetching document numbers");
                this.loading = false;
                return of(this.documentNumbers);
            })
        );
    }

    // Fungsi baru untuk memuat data berdasarkan ID
    // Fungsi yang diperbarui untuk memuat dan menampilkan data dokumen dengan area.area
    loadFormDataById(id: number): void {
        this.loading = true;

        // Tampilkan loading indicator
        this.showToast('Loading document data...', 'info');

        this.service.get(`/documentnumbers/${id}`).subscribe({
            next: (result: any) => {
                if (result && result.data) {
                    console.log("Document data retrieved:", result.data);

                    // Set document number pada form
                    const documentData = result.data;
                    const docNumberControl = this.formData.get('document_number_id');

                    if (docNumberControl) {
                        // Tambahkan informasi area.area ke display string jika tersedia
                        const areaInfo = documentData.area?.area ? ` (${documentData.area.area})` : '';

                        // Format document item with correct structure for ng-select
                        const docItem = {
                            id: documentData.id,
                            display: `${documentData.running_number || 'N/A'} - ${documentData.klasifikasi_document || 'No Description'}${areaInfo}`,
                            fullData: documentData
                        };

                        // Update documentNumbers array jika belum ada
                        const existingDocIndex = this.documentNumbers.findIndex(doc => doc.id === documentData.id);
                        if (existingDocIndex === -1) {
                            // Tambahkan ke array untuk ng-select
                            this.documentNumbers = [...this.documentNumbers, docItem];
                        } else {
                            // Update data yang ada jika sudah ada
                            this.documentNumbers[existingDocIndex] = docItem;
                        }

                        // Pastikan array terinisialisasi
                        if (!this.documentNumbers || this.documentNumbers.length === 0) {
                            this.documentNumbers = [docItem];
                        }

                        // Delay sedikit untuk memastikan ng-select diperbarui dengan daftar baru
                        setTimeout(() => {
                            // Set nilai pada form control - ini akan mempengaruhi tampilan ng-select
                            docNumberControl.setValue(documentData.id);

                            // Tandai sebagai touched agar memicu pemeriksaan validasi
                            docNumberControl.markAsTouched();

                            // Panggil fungsi update form dari document number
                            this.updateFormFromDocumentNumber(documentData.id);

                            this.showToast('Document loaded successfully', 'success');
                        }, 100);
                    }
                } else {
                    this.showToast('No document data found', 'warning');
                }
                this.loading = false;
            },
            error: (error: any) => {
                this.handleError(error, "Error fetching document data");
                this.loading = false;
            }
        });
    }
    onDocumentSelected(documentId: number | string) {
        // Find the selected document
        const selectedDoc = this.documentNumbers.find(doc => doc.id === documentId);

        if (selectedDoc && selectedDoc.fullData) {
            // Auto-fill other form fields based on selected document
            // For example:
            // this.formData.patchValue({
            //   field1: selectedDoc.fullData.someProperty,
            //   field2: selectedDoc.fullData.anotherProperty
            // });
        }
    }

    // Load Master Support Document
    loadSupportDocs() {
        this.loading = true;
        this.service.get('/instantsupportdoc').subscribe({
            next: (result: any) => {
                if (result && result.data) {
                    // Tambahkan log untuk melihat data mentah yang diterima dari API
                    console.log("Raw support document data from API:", result.data);

                    this.documentTypes = result.data.map((item: any) => ({
                        ...item,
                        isChecked: item.status === true // Otomatis centang jika status true
                    }));

                    // Update formData2 dengan data support documents
                    this.updateSupportDocsForm();

                    // Log hasil akhir setelah transformasi data
                    console.log("Processed document types with isChecked property:", this.documentTypes);
                    console.log("Documents pre-checked:", this.documentTypes.filter(doc => doc.isChecked).length);
                } else {
                    this.documentTypes = [];
                    console.log("No support document data received or empty data");
                }
                this.loading = false;
            },
            error: (error: any) => {
                this.handleError(error, "Error fetching support documents");
                this.loading = false;
                console.error("Support doc API error:", error);
            }
        });
    }

    initSupportDocsForm() {
        // Inisialisasi form untuk data support documents menggunakan FormArray
        this.formData2 = this.fb.group({
            data: this.fb.array([])
        });
    }

    updateSupportDocsForm() {
        const dataArray = this.fb.array(
            this.documentTypes.map(doc => this.fb.group({
                support_doc_id: [doc.id],
                document_type: [doc.document_type],
                status: [doc.isChecked],
                created_by: [this.GodocUser?.nik || ""],
                is_deleted: [false]
            }))
        );

        this.formData2.setControl('data', dataArray);
    }

    initForm() {
        const GodocUser = this.tokenStorage.getUser() || {};

        this.formData = this.fb.group({
            project_name: [null, [Validators.required]],
            item_changes: [null, [Validators.required]],
            line_code: [{ value: '', disabled: true }],
            section_code: [{ value: '', disabled: true }],
            section_name: [{ value: '', disabled: true }],

            department_id: [{ value: GodocUser?.department?.id || null, disabled: false }, [Validators.required]],
            section_department_id: [{ value: GodocUser?.section?.id || null, disabled: false }, [Validators.required]],
            plant_id: [{ value: GodocUser?.site?.id || null, disabled: false }, [Validators.required]],
            change_type: [null, [Validators.required]],
            description: [null, [Validators.required]],
            reason: [null, [Validators.required]],
            // Remove single cost field and add multiple costs
            cost: [null, [Validators.required]],
            cost_text: [null], // For API compatibility
            costItems: this.fb.array([
                this.createCostItem() // Tambahkan cost item pertama
            ]),

            planning_start: [null, [Validators.required]],
            planning_end: [null, [Validators.required]],
            created_date: [this.getFormattedDate(), [Validators.required]],
            created_by: [{ value: GodocUser?.nik || null, disabled: true }, [Validators.required]],
            need_engineering_approval: [false],
            need_production_approval: [false],
            other_sytem: [''],
            status: ['submitted'],
            progress: ['0%'],
            document_number_id: [null, [Validators.required]],
            auth_id: [{ value: GodocUser?.auth_id || null, disabled: true }]
        });

        // Listen for document_number_id changes
        const docNumberId = this.formData.get('document_number_id');
        if (docNumberId) {
            docNumberId.valueChanges.subscribe(selectedId => {
                console.log("Document Number ID changed:", selectedId);
                if (selectedId) {
                    const numericId = Number(selectedId);
                    this.updateFormFromDocumentNumber(numericId);
                } else {
                    const lineCodeControl = this.formData.get('line_code');
                    const sectionCodeControl = this.formData.get('section_code');

                    if (lineCodeControl) {
                        lineCodeControl.setValue('');
                    }

                    if (sectionCodeControl) {
                        sectionCodeControl.setValue('');
                    }
                }
            });
        }

        // Listen for cost item changes to update total
        this.costItems.valueChanges.subscribe(() => {
            this.calculateTotalCost();
        });

        // Validasi tanggal
        const planningStart = this.formData.get('planning_start');
        const planningEnd = this.formData.get('planning_end');

        if (planningStart) {
            planningStart.valueChanges.subscribe(value => {
                if (planningEnd && value && planningEnd.value && new Date(value) > new Date(planningEnd.value)) {
                    planningEnd.setValue(null);
                }
            });
        }

        if (planningEnd) {
            planningEnd.setValidators([
                Validators.required,
                (control: AbstractControl) => {
                    const startDate = planningStart?.value;
                    if (startDate && control.value && new Date(control.value) < new Date(startDate)) {
                        return { dateInvalid: true };
                    }
                    return null;
                }
            ]);
            planningEnd.updateValueAndValidity();
        }

        // Listen for all form changes to update progress
        this.formData.valueChanges.subscribe(() => {
            this.initTooltips();
        });
    }

    // Fungsi yang diperbarui untuk mengisi area.area dan section name
    updateFormFromDocumentNumber(documentNumberId: number) {
        const numericId = Number(documentNumberId);
        console.log(`Finding document with ID: ${numericId}`);

        const selectedDoc = this.documentNumbers.find(doc => doc.id === numericId);

        if (selectedDoc && selectedDoc.fullData) {
            const docData = selectedDoc.fullData;
            console.log("Selected Document Data:", docData);

            const lineCodeControl = this.formData.get('line_code');
            const sectionCodeControl = this.formData.get('section_code');

            if (lineCodeControl) lineCodeControl.enable({ emitEvent: false });
            if (sectionCodeControl) sectionCodeControl.enable({ emitEvent: false });

            // Ambil nilai line_code dari dokumen
            const lineCodeValue = docData.line_code || '';

            // Dapatkan nilai area.area dari dokumen jika tersedia
            const areaText = docData.area?.area || '';

            // Gabungkan section_code dengan area.area
            const sectionCodeValue = docData.section_code || '';
            const formattedSectionCode = areaText
                ? `${sectionCodeValue} - ${areaText}`
                : sectionCodeValue;

            // Set nilai ke form controls
            if (lineCodeControl) lineCodeControl.setValue(lineCodeValue, { emitEvent: false });
            if (sectionCodeControl) sectionCodeControl.setValue(formattedSectionCode, { emitEvent: false });

            // Disable kembali controls tersebut
            if (lineCodeControl) lineCodeControl.disable({ emitEvent: false });
            if (sectionCodeControl) sectionCodeControl.disable({ emitEvent: false });

            // Show success notification
            this.showToast('Document number selected successfully', 'success');
        } else {
            console.warn(`Could not find full data for Document ID: ${documentNumberId}`);
            const lineCodeControl = this.formData.get('line_code');
            const sectionCodeControl = this.formData.get('section_code');

            if (lineCodeControl) {
                lineCodeControl.enable({ emitEvent: false });
                lineCodeControl.setValue('', { emitEvent: false });
                lineCodeControl.disable({ emitEvent: false });
            }

            if (sectionCodeControl) {
                sectionCodeControl.enable({ emitEvent: false });
                sectionCodeControl.setValue('', { emitEvent: false });
                sectionCodeControl.disable({ emitEvent: false });
            }
        }
    }

    // Getter for cost items FormArray
    get costItems(): FormArray {
        return this.formData.get('costItems') as FormArray;
    }


    // Create a cost item form group
    createCostItem(): FormGroup {
        return this.fb.group({
            currency: ['IDR', Validators.required],
            amount: [null, [Validators.required, Validators.pattern(/^[0-9]+$/)]],
            exchangeRate: [1, [Validators.required, Validators.pattern(/^[0-9]+(\.[0-9]+)?$/)]],
            amountInIDR: [{ value: 0, disabled: true }]
        });
    }

    // Add a new cost item
    addCostItem(): void {
        this.costItems.push(this.createCostItem());
        setTimeout(() => {
            this.initTooltips();
        }, 100);
    }

    // Remove a cost item
    removeCostItem(index: number): void {
        if (this.costItems.length > 1) {
            this.costItems.removeAt(index);
            this.calculateTotalCost();
        }
    }

    // Calculate total cost in IDR
    calculateTotalCost(): void {
        let total = 0;

        for (let i = 0; i < this.costItems.controls.length; i++) {
            const item = this.costItems.at(i) as FormGroup;
            const amountControl = item.get('amount');
            const exchangeRateControl = item.get('exchangeRate');
            const amountInIDRControl = item.get('amountInIDR');

            const amount = amountControl ? Number(amountControl.value) || 0 : 0;
            const exchangeRate = exchangeRateControl ? Number(exchangeRateControl.value) || 1 : 1;
            const amountInIDR = amount * exchangeRate;

            // Update the amountInIDR field
            if (amountInIDRControl) {
                amountInIDRControl.setValue(amountInIDR, { emitEvent: false });
            }
            this.totalCostIDR = total;

        }
    }

    // Format currency with thousand separators
    formatCurrency(value: number | string): string {
        if (!value) return '0';
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return num.toLocaleString('id-ID');
    }

    // On currency change, update exchange rate
    // On currency change - just update the UI
    onCurrencyChange(index: number, event: any): void {
        // No exchange rate needed, just refresh UI
    }

    // Fungsi yang diperbarui untuk menghasilkan teks cost dengan format baris baru TANPA total
    generateCostText(): string {
        const costTexts: string[] = [];

        for (let i = 0; i < this.costItems.length; i++) {
            const item = this.costItems.at(i) as FormGroup;
            const amountControl = item.get('amount');
            const currencyControl = item.get('currency');

            const amount = amountControl?.value;
            const currencyCode = currencyControl?.value;

            if (amount && currencyCode) {
                const symbol = this.getCurrencySymbol(currencyCode);
                const formattedAmount = this.formatCurrency(amount);
                costTexts.push(`**${symbol} ${formattedAmount}**`);
            }
        }

        // Gabungkan dengan baris baru (tidak ada total IDR di akhir)
        return costTexts.join('\n');
    }
    // Handle amount input, format and calculate
    onAmountInput(index: number, event: any): void {
        // Remove non-numeric characters from input
        let value = event.target.value.replace(/[^0-9]/g, '');

        const item = this.costItems.at(index) as FormGroup;
        const amountControl = item.get('amount');

        if (amountControl) {
            amountControl.setValue(value);
        }

        this.calculateTotalCost();
    }


    toggleCheckbox(doc: any, event: any) {
        const isChecked = event.target.checked;
        doc.isChecked = isChecked;

        const dataArray = this.formData2.get('data') as FormArray;
        if (dataArray) {
            const docIndex = this.documentTypes.findIndex(d => d.id === doc.id);
            if (docIndex >= 0 && docIndex < dataArray.length) {
                const statusControl = dataArray.at(docIndex).get('status');
                if (statusControl) {
                    statusControl.setValue(isChecked);
                }
            }
        }

        // Show feedback for document selection
        const message = isChecked
            ? `Dokumen ${doc.document_type} ditambahkan`
            : `Dokumen ${doc.document_type} dihapus`;
        const type = isChecked ? 'success' : 'warning';
        this.showToast(message, type);
    }

    // Calculate form progress (persentase kelengkapan form)
    getFormProgress(): number {
        const requiredFields = [
            'project_name', 'item_changes', 'change_type',
            'description', 'reason', 'planning_start',
            'planning_end', 'document_number_id'
        ];

        // Cost items valid
        const costValid = this.costItemsValid();

        // Count completed fields
        const completedFields = requiredFields.filter(field => {
            const control = this.formData.get(field);
            return control && control.valid && control.value;
        }).length;

        // Calculate percentage (jika costValid tambahkan 1 ke completed dan tambahkan 1 ke total)
        const totalFields = requiredFields.length + 1;
        const completedTotal = completedFields + (costValid ? 1 : 0);

        const percentage = Math.round((completedTotal / totalFields) * 100);
        return percentage;
    }

    // Check if all mandatory fields are complete
    isMandatoryFieldsComplete(): boolean {
        return this.getFormProgress() === 100;
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

    // Check if cost items are valid
    costItemsValid(): boolean {
        if (this.costItems.length === 0) return false;

        for (let i = 0; i < this.costItems.length; i++) {
            const item = this.costItems.at(i) as FormGroup;
            if (item.invalid) return false;
        }

        return true;
    }

    // Check if date range is valid
    dateRangeValid(): boolean {
        const startDate = this.formData.get('planning_start')?.value;
        const endDate = this.formData.get('planning_end')?.value;

        if (!startDate || !endDate) return true; // Skip validation if dates are not set

        return new Date(startDate) <= new Date(endDate);
    }

    // Form validation before submission
    // SESUDAH:
    validateForm() {
        this.validationErrors = [];

        // Check required fields
        const requiredFields = [
            { name: 'document_number_id', display: 'Document Number' },
            { name: 'project_name', display: 'Project Name' },
            { name: 'item_changes', display: 'Item Changes' },
            { name: 'change_type', display: 'Change Type' },
            { name: 'description', display: 'Description' },
            { name: 'reason', display: 'Reason' }
        ];

        for (const field of requiredFields) {
            const control = this.formData.get(field.name);
            if (!control || control.invalid) {
                this.validationErrors.push(`${field.display} wajib diisi`);
            }
        }

        // Check cost items
        if (!this.costItemsValid()) {
            this.validationErrors.push('Pastikan semua detail biaya sudah diisi dengan benar');
        }

        // Check date range
        if (!this.dateRangeValid()) {
            this.validationErrors.push('Tanggal planning wajib diisi dengan benar');
        }

        // Tampilkan hasil validasi menggunakan SweetAlert2 (tidak menggunakan bootstrap modal)
        if (this.validationErrors.length > 0) {
            let errorHtml = '<ul style="text-align: left; margin-top: 10px;">';
            this.validationErrors.forEach(error => {
                errorHtml += `<li>${error}</li>`;
            });
            errorHtml += '</ul>';

            Swal.fire({
                title: 'Validasi Form',
                html: `<div class="alert alert-danger">Form belum lengkap:${errorHtml}</div>`,
                icon: 'warning',
                confirmButtonText: 'OK'
            });
            return false;
        } else {
            Swal.fire({
                title: 'Validasi Form',
                html: '<div class="alert alert-success"><h6><i class="ri-checkbox-circle-line me-2"></i>Form validasi berhasil!</h6><p class="mb-0">Semua field telah diisi dengan benar. Silakan submit form.</p></div>',
                icon: 'success',
                confirmButtonText: 'OK'
            });
            return true;
        }
    }

    // Pastikan SweetAlert2 sudah diimpor di bagian atas file
    // import Swal from "sweetalert2";
    // Toast notification
    showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer)
                toast.addEventListener('mouseleave', Swal.resumeTimer)
            }
        });

        Toast.fire({
            icon: type,
            title: message
        });
    }


    // Fungsi yang diperbarui untuk menangani proses pengiriman form
    // Perbaikan fungsi onSubmit() untuk memastikan validateForm() tidak menimbulkan error

    onSubmit() {
        console.log("--- Attempting Form Submission ---");

        if (this.formData.invalid) {
            this.formData.markAllAsTouched();

            // Run validation to show errors
            // JANGAN LANGSUNG RETURN, karena kita butuh hasil validasi
            const isValid = this.validateForm();
            if (!isValid) {
                return;
            }
        }

        // Aktifkan sementara control disabled untuk mendapatkan nilainya dalam payload
        ['line_code', 'section_code', 'created_by', 'auth_id'].forEach(field => {
            const control = this.formData.get(field);
            if (control?.disabled) {
                control.enable({ emitEvent: false });
            }
        });

        // Update nilai cost dan cost_text secara manual
        const costControl = this.formData.get('cost');
        const costTextControl = this.formData.get('cost_text');

        if (costControl) {
            costControl.setValue(this.totalCostIDR.toString(), { emitEvent: false });
        }

        if (costTextControl) {
            costTextControl.setValue(this.generateCostText(), { emitEvent: false });
        }

        // Ambil nilai form termasuk yang sebelumnya disabled
        const payload = this.formData.getRawValue();

        // Nonaktifkan kembali control yang seharusnya disabled
        ['line_code', 'section_code', 'created_by', 'auth_id'].forEach(field => {
            const control = this.formData.get(field);
            if (control) {
                control.disable({ emitEvent: false });
            }
        });

        // Pastikan nilai dari TokenStorage terisi dengan benar jika belum ada
        payload.created_by = this.GodocUser?.nik || payload.created_by;
        payload.auth_id = this.GodocUser?.auth_id || payload.auth_id;
        payload.department_id = payload.department_id || this.GodocUser?.department?.id;
        payload.section_department_id = payload.section_department_id || this.GodocUser?.section?.id;
        payload.plant_id = payload.plant_id || this.GodocUser?.site?.id;

        // Pastikan document_number_id dikirim sebagai number, bukan string
        if (payload.document_number_id) {
            payload.document_number_id = Number(payload.document_number_id);
        }

        // Pastikan semua ID numerik yang lain juga dikonversi ke number
        ['department_id', 'section_department_id', 'plant_id', 'auth_id'].forEach(field => {
            if (payload[field]) {
                payload[field] = Number(payload[field]);
            }
        });

        // Simpan cost items dalam format JSON di field baru
        payload.cost_items_json = JSON.stringify(payload.costItems);

        console.log("Submission Payload:", payload);
        console.log("Cost Text Format:", payload.cost_text);

        // Set loading state
        this.loading = true;

        // Tampilkan loading indicator menggunakan SweetAlert2
        Swal.fire({
            title: 'Submitting Data',
            html: 'Please wait while we process your request...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Kirim data form utama
        this.service.post("/proposedchanges", payload)
            .pipe(finalize(() => {
                console.log("Main form request completed");
            }))
            .subscribe({
                next: (response: any) => {
                    console.log("Form Submission Success Response:", response);

                    if (response && response.data && response.data.id) {
                        const proposedChangesId = response.data.id;
                        console.log("Successfully got proposed_id:", proposedChangesId);

                        // Kirim data support document (semua dokumen)
                        this.prepareAndSaveSupportDocuments(proposedChangesId);
                    } else {
                        console.error("Failed to get proposed_id from response:", response);
                        this.loading = false;
                        Swal.close(); // Tutup loading dialog
                        this.showSuccessAndNavigate();
                    }
                },
                error: (error: any) => {
                    console.error("Form Submission Error:", error);
                    this.loading = false;
                    Swal.close(); // Tutup loading dialog
                    this.handleError(error, "Error submitting data");
                }
            });
    }

    prepareAndSaveSupportDocuments(proposedChangesId: number) {
        // Menggunakan data dari formData2 untuk kirim ke API
        console.log("All document types from formData2:", this.formData2.value);

        if (this.documentTypes.length === 0) {
            console.log("No support documents available. Skipping support API call.");
            this.showSuccessAndNavigate();
            return;
        }

        // Siapkan data untuk dikirim ke API - menggunakan formData2
        const formDataArray = this.formData2.get('data') as FormArray;

        // Pastikan formDataArray ada
        if (!formDataArray || formDataArray.length === 0) {
            console.log("No support documents in formData2. Skipping support API call.");
            this.showSuccessAndNavigate();
            return;
        }

        // Tambahkan animasi loading untuk process support documents
        Swal.fire({
            title: 'Saving Documents',
            html: 'Processing support documents...',
            timerProgressBar: true,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const supportDocsPayload = formDataArray.controls.map((control: any) => {
            // Get value dari form control
            const controlValue = control.value;

            // Tambahkan proposed_id ke setiap dokumen
            return {
                ...controlValue,
                proposed_id: proposedChangesId,
                created_by: this.GodocUser?.nik || controlValue.created_by || ""
            };
        });

        console.log("Prepared Support Docs Payload from formData2:", supportDocsPayload);

        // Kirim ke endpoint API
        this.service.post("/proposedchanges-support", supportDocsPayload)
            .subscribe({
                next: (response: any) => {
                    console.log("Support Doc Submission Success:", response);
                    Swal.close(); // Close loading dialog
                    this.showSuccessAndNavigate();
                },
                error: (error: any) => {
                    console.error("Support Doc Submission Error:", error);
                    Swal.close(); // Close loading dialog

                    Swal.fire({
                        title: "Warning",
                        text: "Proposed changes submitted successfully, but failed to save support document details. Please check the details page.",
                        icon: "warning",
                        confirmButtonText: "OK"
                    }).then((result) => {
                        if (result.isConfirmed) {
                            this.router.navigate(['/activity-page/proposed-changes']);
                        }
                    });
                },
                complete: () => {
                    this.loading = false;
                }
            });
    }

    showSuccessAndNavigate() {
        this.loading = false;
        Swal.fire({
            title: "Success",
            text: "Proposed changes submitted successfully!",
            icon: "success",
            confirmButtonText: "OK"
        }).then((result) => {
            if (result.isConfirmed) {
                this.router.navigate(['/activity-page/proposedchanges-list']);
            }
        });
    }

    handleError(error: any, defaultMessage: string) {
        let errorMessage = defaultMessage;
        let errorDetails = '';

        if (error.status === 0) {
            errorMessage = "Cannot connect to the server. Please check your network connection or if the server is running.";
        } else if (error.error) {
            errorDetails = JSON.stringify(error.error);
            if (error.error.message) {
                errorMessage = error.error.message;
            } else if (typeof error.error === "string") {
                errorMessage = error.error;
            } else if (error.error.errors && typeof error.error.errors === 'object') {
                const validationErrors = error.error.errors;
                errorMessage = "Validation failed. Please check the form fields.";
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
            errorMessage = `An unexpected error occurred. Status: ${error.status || 'N/A'}`;
        }

        console.error(`Error Handler Details: ${errorDetails}`, error);
        Swal.fire("Error", errorMessage, "error");
    }

    public getFormattedDate(): string {
        return new Date().toISOString();
    }

    goBack() {
        if (this.formData.dirty) {
            Swal.fire({
                title: 'Unsaved Changes',
                text: "You have unsaved changes. Are you sure you want to leave?",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, leave page',
                cancelButtonText: 'Stay'
            }).then((result) => {
                if (result.isConfirmed) {
                    this.router.navigate(['/activity-page/proposedchanges-list']);
                }
            });
        } else {
            this.router.navigate(['/activity-page/proposedchanges-list']);
        }
    }

    // Get currency symbol based on currency code
    getCurrencySymbol(currencyCode: string | null | undefined): string {
        if (!currencyCode) return '';

        const currency = this.currencies.find(c => c.code === currencyCode);
        return currency ? currency.symbol : '';
    }

    // Check if currency is IDR
    isIDR(currencyCode: string | null | undefined): boolean {
        return currencyCode === 'IDR';
    }


}