import { Component, OnInit, ViewEncapsulation, LOCALE_ID, Inject, AfterViewInit, OnDestroy } from "@angular/core";
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl, FormControl } from "@angular/forms";
import Swal from "sweetalert2";
import { AppService } from "src/app/shared/service/app.service";
import { TokenStorageService } from "src/app/core/services/token-storage.service";
import { catchError, debounceTime, distinctUntilChanged, finalize, map, takeUntil } from "rxjs/operators";
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

/**
 * FormComponent - Handles the Proposed Changes form functionality
 */
@Component({
    selector: "app-form",
    templateUrl: "./form.component.html",
    styleUrls: ["./form.component.scss"],
    encapsulation: ViewEncapsulation.None
})
export class FormComponent implements OnInit, AfterViewInit, OnDestroy {
    // Multi-select arrays
    selectedItemChanges: string[] = [];
    selectedChangeTypes: string[] = [];

    // Core properties
    GodocUser: any;
    breadCrumbItems: Array<{ label: string; active?: boolean }> = [];
    loading = false;
    showInstructions = true;
    documentSearchTerm: string = '';
    validationErrors: string[] = [];

    // Search and destroy subjects
    private destroy$ = new Subject<void>();
    searchInput$ = new Subject<string>();

    // Tooltips array
    tooltips: any[] = [];

    // Dropdown lists
    documentNumbers: DropdownItem[] = [];
    documentTypes: any[] = [];

    // Currency definition
    currencies: CurrencyItem[] = [
        { id: 1, code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
        { id: 2, code: 'USD', name: 'US Dollar', symbol: '$' },
        { id: 3, code: 'EUR', name: 'Euro', symbol: '€' },
        { id: 4, code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
        { id: 5, code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' }
    ];

    // Total cost tracking
    totalCostIDR: number = 0;

    // Predefined options
    changeTypes: DropdownItem[] = [
        { display: 'Progress' },
        { display: 'Checking' },
        { display: 'System' },
        { display: 'Tools' },
        { display: 'Documents' }
    ];

    changeTypeOptions: string[] = [
        'Improvement',
        'Modification',
        'New Installation',
        'Replacement'
    ];

    // Form groups
    formData!: FormGroup;
    formData2!: FormGroup;

    // ID and selected document tracking
    id: number | undefined;
    selectedDoc: any;

    // FormArray getters
    get itemChangesArray(): FormArray {
        return this.formData.get('item_changes_array') as FormArray;
    }

    get changeTypeArray(): FormArray {
        return this.formData.get('change_type_array') as FormArray;
    }

    get costItems(): FormArray {
        return this.formData.get('costItems') as FormArray;
    }

    constructor(
        private service: AppService,
        private fb: FormBuilder,
        private tokenStorage: TokenStorageService,
        private router: Router,
        private dateAdapter: DateAdapter<Date>,
        private route: ActivatedRoute
    ) { }

    ngOnInit(): void {
        // Load ID from session storage
        this.loadIdFromSessionStorage();

        // Initialize user data
        this.GodocUser = this.tokenStorage.getUser();
        console.log("User from tokenStorage:", this.GodocUser);

        // Set locale for date adapter
        this.dateAdapter.setLocale('id');

        // Initialize forms and UI elements
        this.initForm();
        this.initSupportDocsForm();
        this.initBreadcrumbs();

        // Load document numbers before trying to set the selected document
        this.loadDocumentNumbers().subscribe(() => {
            if (this.id) {
                this.loadFormDataById(this.id);
            }
        });

        // Load support documents
        this.loadSupportDocs();

        // Setup search input handling with debounce
        this.searchInput$.pipe(
            takeUntil(this.destroy$),
            debounceTime(400),
            distinctUntilChanged()
        ).subscribe(term => {
            this.searchDocumentNumbers(term);
        });
    }

    ngAfterViewInit() {
        // Initialize tooltips after view is ready
        setTimeout(() => {
            this.initTooltips();
        }, 500);
    }

    ngOnDestroy() {
        // Clean up subscriptions to prevent memory leaks
        this.destroy$.next();
        this.destroy$.complete();

        // Dispose of any tooltips
        if (this.tooltips && this.tooltips.length) {
            this.tooltips.forEach(tooltip => {
                if (tooltip && typeof tooltip.dispose === 'function') {
                    tooltip.dispose();
                }
            });
        }
    }

    /**
     * Load ID from session storage
     */
    loadIdFromSessionStorage(): void {
        const idFromStorage = sessionStorage.getItem('formId');
        if (idFromStorage) {
            this.id = Number(idFromStorage);
            console.log('✅ ID received from sessionStorage:', this.id);
        } else {
            console.warn('⚠️ ID not found in sessionStorage!');
        }
    }

    /**
     * Initialize form with default values and validators
     */
    initForm() {
        const GodocUser = this.tokenStorage.getUser() || {};

        this.formData = this.fb.group({
            project_name: [null, [Validators.required]],
            line_code: [{ value: '', disabled: true }],
            section_code: [{ value: '', disabled: true }],
            section_name: [{ value: '', disabled: true }],

            // Arrays for multi-select
            item_changes_array: this.fb.array([]),
            change_type_array: this.fb.array([]),

            // API compatibility fields
            item_changes: ['', Validators.required],
            change_type: ['', Validators.required],
            department_id: [{ value: GodocUser?.department?.id || null, disabled: false }, [Validators.required]],
            section_department_id: [{ value: GodocUser?.section?.id || null, disabled: false }, [Validators.required]],
            plant_id: [{ value: GodocUser?.site?.id || null, disabled: false }, [Validators.required]],
            description: [null, [Validators.required]],
            reason: [null, [Validators.required]],

            // Cost fields
            cost: [null, [Validators.required]],
            cost_text: [null],
            costItems: this.fb.array([
                this.createCostItem()
            ]),

            // Planning dates
            planning_start: [null, [Validators.required]],
            planning_end: [null, [Validators.required]],

            // System fields
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

        // Subscribe to array changes to update composite fields
        this.setupFormSubscriptions();

        // Listen for document number changes
        this.setupDocumentNumberListener();

        // Add validation for date range
        this.setupDateValidation();
    }

    /**
     * Setup form subscriptions to handle dependent fields
     */
    setupFormSubscriptions() {
        // Update item_changes field when array changes
        this.itemChangesArray.valueChanges.pipe(
            takeUntil(this.destroy$)
        ).subscribe(values => {
            this.formData.get('item_changes')?.setValue(values.join(', '));
        });

        // Update change_type field when array changes
        this.changeTypeArray.valueChanges.pipe(
            takeUntil(this.destroy$)
        ).subscribe(values => {
            this.formData.get('change_type')?.setValue(values.join(', '));
        });

        // Update total cost when costItems change
        this.costItems.valueChanges.pipe(
            takeUntil(this.destroy$)
        ).subscribe(() => {
            this.calculateTotalCost();
        });

        // Monitor form changes to update tooltips
        this.formData.valueChanges.pipe(
            takeUntil(this.destroy$)
        ).subscribe(() => {
            this.initTooltips();
        });
    }

    /**
     * Setup document number change listener
     */
    setupDocumentNumberListener() {
        const docNumberId = this.formData.get('document_number_id');
        if (docNumberId) {
            docNumberId.valueChanges.pipe(
                takeUntil(this.destroy$)
            ).subscribe(selectedId => {
                console.log("Document Number ID changed:", selectedId);
                if (selectedId) {
                    const numericId = Number(selectedId);
                    this.updateFormFromDocumentNumber(numericId);
                } else {
                    this.clearDocumentDependentFields();
                }
            });
        }
    }

    /**
     * Clear fields that depend on document selection
     */
    clearDocumentDependentFields() {
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

    /**
     * Setup date validation between start and end dates
     */
    setupDateValidation() {
        const planningStart = this.formData.get('planning_start');
        const planningEnd = this.formData.get('planning_end');

        if (planningStart) {
            planningStart.valueChanges.pipe(
                takeUntil(this.destroy$)
            ).subscribe(value => {
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
    }

    /**
     * Initialize form for support documents
     */
    initSupportDocsForm() {
        this.formData2 = this.fb.group({
            data: this.fb.array([])
        });
    }

    /**
     * Initialize breadcrumb navigation
     */
    initBreadcrumbs() {
        this.breadCrumbItems = [
            { label: "Activity" },
            { label: "Form Proposed Changes", active: true },
        ];
    }

    /**
     * Initialize Bootstrap tooltips
     */
    initTooltips() {
        // Check if bootstrap is available
        if (typeof bootstrap !== 'undefined') {
            // Dispose existing tooltips to prevent memory leaks
            if (this.tooltips && this.tooltips.length) {
                this.tooltips.forEach(tooltip => {
                    if (tooltip && typeof tooltip.dispose === 'function') {
                        tooltip.dispose();
                    }
                });
            }

            // Create new tooltips
            const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
            this.tooltips = Array.from(tooltipTriggerList).map(tooltipTriggerEl => {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });
        } else {
            console.log('Bootstrap not available, skipping tooltip initialization');
        }
    }

    /**
     * Toggle form instructions visibility
     */
    toggleInstructions() {
        this.showInstructions = !this.showInstructions;
    }

    /**
     * Hide form instructions
     */
    hideInstructions() {
        this.showInstructions = false;
    }

    /**
     * Search document numbers based on input term
     */
    searchDocumentNumbers(term: string): Observable<any> {
        if (!term || term.length < 2) {
            this.loading = false;
            return of([]);
        }

        this.loading = true;
        return this.service.get(`/documentnumbers?auth_id=${this.GodocUser.auth_id}&search=${term}`).pipe(
            map((result: any) => {
                if (result && result.data) {
                    const docs = result.data.map((item: any) => {
                        // Add area.area to display string if available
                        const areaInfo = item.area?.area ? ` (${item.area.area})` : '';

                        return {
                            id: item.id,
                            display: `${item.running_number || 'N/A'} - ${item.klasifikasi_document || 'No Description'}${areaInfo}`,
                            fullData: item
                        };
                    });

                    // Update documentNumbers with search results, avoiding duplicates
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

    /**
     * Load document numbers for initial selection
     */
    loadDocumentNumbers(searchTerm: string = ""): Observable<any> {
        this.loading = true;
        return this.service.get(`/documentnumbers?auth_id=${this.GodocUser.auth_id}&search=${searchTerm}`).pipe(
            map((result: any) => {
                if (result && result.data) {
                    const newDocs = result.data.map((item: any) => {
                        // Add area.area to display string if available
                        const areaInfo = item.area?.area ? ` (${item.area.area})` : '';

                        return {
                            id: item.id,
                            display: `${item.running_number || 'N/A'} - ${item.klasifikasi_document || 'No Description'}${areaInfo}`,
                            fullData: item
                        };
                    });

                    // Update documentNumbers with new results, avoiding duplicates
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

    /**
     * Load form data by ID
     */
    loadFormDataById(id: number): void {
        this.loading = true;
        this.showToast('Loading document data...', 'info');

        this.service.get(`/documentnumbers/${id}`).subscribe({
            next: (result: any) => {
                if (result && result.data) {
                    console.log("Document data retrieved:", result.data);
                    this.processDocumentData(result.data);
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

    /**
     * Process document data and update form
     */
    processDocumentData(documentData: any): void {
        const docNumberControl = this.formData.get('document_number_id');

        if (docNumberControl) {
            // Add area.area to display string if available
            const areaInfo = documentData.area?.area ? ` (${documentData.area.area})` : '';

            // Format document item with correct structure for ng-select
            const docItem = {
                id: documentData.id,
                display: `${documentData.running_number || 'N/A'} - ${documentData.klasifikasi_document || 'No Description'}${areaInfo}`,
                fullData: documentData
            };

            // Update documentNumbers array if the document isn't already there
            const existingDocIndex = this.documentNumbers.findIndex(doc => doc.id === documentData.id);
            if (existingDocIndex === -1) {
                // Add to array for ng-select
                this.documentNumbers = [...this.documentNumbers, docItem];
            } else {
                // Update existing data if already there
                this.documentNumbers[existingDocIndex] = docItem;
            }

            // Make sure array is initialized
            if (!this.documentNumbers || this.documentNumbers.length === 0) {
                this.documentNumbers = [docItem];
            }

            // Short delay to ensure ng-select is updated with the new list
            setTimeout(() => {
                // Set value on form control - this will affect ng-select display
                docNumberControl.setValue(documentData.id);

                // Mark as touched to trigger validation
                docNumberControl.markAsTouched();

                // Call function to update form from document number
                this.updateFormFromDocumentNumber(documentData.id);

                this.showToast('Document loaded successfully', 'success');
            }, 100);
        }
    }

    /**
     * Load support document types
     */
    loadSupportDocs() {
        this.loading = true;
        this.service.get('/instantsupportdoc').subscribe({
            next: (result: any) => {
                if (result && result.data) {
                    console.log("Raw support document data from API:", result.data);

                    this.documentTypes = result.data.map((item: any) => ({
                        ...item,
                        isChecked: item.status === true // Auto-check if status is true
                    }));

                    // Update formData2 with support documents
                    this.updateSupportDocsForm();

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

    /**
     * Update support documents form
     */
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

    /**
     * Update form fields based on selected document number
     */
    updateFormFromDocumentNumber(documentNumberId: number) {
        const numericId = Number(documentNumberId);
        console.log(`Finding document with ID: ${numericId}`);

        const selectedDoc = this.documentNumbers.find(doc => doc.id === numericId);
        this.selectedDoc = selectedDoc; // Save for reference elsewhere

        if (selectedDoc && selectedDoc.fullData) {
            const docData = selectedDoc.fullData;
            console.log("Selected Document Data:", docData);

            const lineCodeControl = this.formData.get('line_code');
            const sectionCodeControl = this.formData.get('section_code');

            if (lineCodeControl) lineCodeControl.enable({ emitEvent: false });
            if (sectionCodeControl) sectionCodeControl.enable({ emitEvent: false });

            // Get line_code value from document
            const lineCodeValue = docData.line_code || '';

            // Get area.area value if available
            const areaText = docData.area?.area || '';

            // Combine section_code with area.area
            const sectionCodeValue = docData.section_code || '';
            const formattedSectionCode = areaText
                ? `${sectionCodeValue} - ${areaText}`
                : sectionCodeValue;

            // Set values to form controls
            if (lineCodeControl) lineCodeControl.setValue(lineCodeValue, { emitEvent: false });
            if (sectionCodeControl) sectionCodeControl.setValue(formattedSectionCode, { emitEvent: false });

            // Disable controls again
            if (lineCodeControl) lineCodeControl.disable({ emitEvent: false });
            if (sectionCodeControl) sectionCodeControl.disable({ emitEvent: false });

            // Show success notification
            this.showToast('Document number selected successfully', 'success');
        } else {
            console.warn(`Could not find full data for Document ID: ${documentNumberId}`);
            this.clearDocumentDependentFields();
        }
    }

    /**
     * Create a cost item form group
     */
    createCostItem(): FormGroup {
        return this.fb.group({
            currency: ['IDR', Validators.required],
            amount: [null, [Validators.required, Validators.pattern(/^[0-9]+$/)]],
            exchangeRate: [1, [Validators.required, Validators.pattern(/^[0-9]+(\.[0-9]+)?$/)]],
            amountInIDR: [{ value: 0, disabled: true }]
        });
    }

    /**
     * Add a new cost item
     */
    addCostItem(): void {
        this.costItems.push(this.createCostItem());
        setTimeout(() => {
            this.initTooltips();
        }, 100);
    }

    /**
     * Remove a cost item
     */
    removeCostItem(index: number): void {
        if (this.costItems.length > 1) {
            this.costItems.removeAt(index);
            this.calculateTotalCost();
        }
    }

    /**
     * Calculate total cost in IDR
     */
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

            // Add to running total
            total += amountInIDR;
        }

        this.totalCostIDR = total;
    }

    /**
     * Format currency with thousand separators
     */
    formatCurrency(value: number | string): string {
        if (!value) return '0';

        // Convert to number if string
        const num = typeof value === 'string' ? parseFloat(value) : value;

        // Format using toLocaleString with proper options
        return num.toLocaleString('id-ID', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    }

    /**
     * Handle currency change
     */
    onCurrencyChange(index: number, event: any): void {
        // Just refreshes UI, no exchange rate needed
    }

    /**
     * Generate cost text with line breaks
     */
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

        // Join with line breaks (no total IDR at end)
        return costTexts.join('\n');
    }

    /**
     * Handle amount input, format and calculate
     */
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

    /**
     * Add item to item changes selection
     */
    addItemChange(item: string) {
        if (!this.selectedItemChanges.includes(item)) {
            this.selectedItemChanges.push(item);
            this.itemChangesArray.push(new FormControl(item));
        }
    }

    /**
     * Add type to change types selection
     */
    addChangeType(type: string) {
        if (!this.selectedChangeTypes.includes(type)) {
            this.selectedChangeTypes.push(type);
            this.changeTypeArray.push(new FormControl(type));
        }
    }

    /**
     * Remove item from item changes selection
     */
    removeItemChange(item: string) {
        const index = this.selectedItemChanges.indexOf(item);
        if (index !== -1) {
            this.selectedItemChanges.splice(index, 1);
            this.itemChangesArray.removeAt(index);
        }
    }

    /**
     * Remove type from change types selection
     */
    removeChangeType(type: string) {
        const index = this.selectedChangeTypes.indexOf(type);
        if (index !== -1) {
            this.selectedChangeTypes.splice(index, 1);
            this.changeTypeArray.removeAt(index);
        }
    }

    /**
     * Select all item changes
     */
    selectAllItemChanges() {
        // Clear current selections
        this.selectedItemChanges = [];
        while (this.itemChangesArray.length) {
            this.itemChangesArray.removeAt(0);
        }

        // Add all items
        this.changeTypes.forEach(item => {
            this.selectedItemChanges.push(item.display);
            this.itemChangesArray.push(new FormControl(item.display));
        });
    }

    /**
     * Select all change types
     */
    selectAllChangeTypes() {
        // Clear current selections
        this.selectedChangeTypes = [];
        while (this.changeTypeArray.length) {
            this.changeTypeArray.removeAt(0);
        }

        // Add all types
        this.changeTypeOptions.forEach(type => {
            this.selectedChangeTypes.push(type);
            this.changeTypeArray.push(new FormControl(type));
        });
    }

    /**
     * Toggle checkbox for support document
     */
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
            ? `Document ${doc.document_type} added`
            : `Document ${doc.document_type} removed`;
        const type = isChecked ? 'success' : 'warning';
        this.showToast(message, type);
    }

    /**
     * Calculate form progress percentage
     */
    getFormProgress(): number {
        const requiredFields = [
            'project_name', 'item_changes', 'change_type',
            'description', 'reason', 'planning_start',
            'planning_end', 'document_number_id'
        ];

        // Check if cost items are valid
        const costValid = this.costItemsValid();

        // Count completed fields
        const completedFields = requiredFields.filter(field => {
            const control = this.formData.get(field);
            return control && control.valid && control.value;
        }).length;

        // Calculate percentage (add 1 to total and completed if costValid)
        const totalFields = requiredFields.length + 1;
        const completedTotal = completedFields + (costValid ? 1 : 0);

        const percentage = Math.round((completedTotal / totalFields) * 100);
        return percentage;
    }

    /**
     * Check if all mandatory fields are complete
     */
    isMandatoryFieldsComplete(): boolean {
        return this.getFormProgress() === 100;
    }

    /**
     * Filter documents by search term
     */
    getFilteredDocuments(): any[] {
        if (!this.documentSearchTerm) return this.documentTypes;

        return this.documentTypes.filter(doc =>
            doc.document_type.toLowerCase().includes(this.documentSearchTerm.toLowerCase())
        );
    }

    /**
     * Get selected documents count
     */
    getSelectedDocumentsCount(): number {
        return this.documentTypes.filter(doc => doc.isChecked).length;
    }

    /**
     * Check if any documents are selected
     */
    hasSelectedDocuments(): boolean {
        return this.getSelectedDocumentsCount() > 0;
    }

    /**
     * Check if cost items are valid
     */
    costItemsValid(): boolean {
        if (this.costItems.length === 0) return false;

        for (let i = 0; i < this.costItems.length; i++) {
            const item = this.costItems.at(i) as FormGroup;
            if (item.invalid) return false;
        }

        return true;
    }

    /**
     * Check if date range is valid
     */
    dateRangeValid(): boolean {
        const startDate = this.formData.get('planning_start')?.value;
        const endDate = this.formData.get('planning_end')?.value;

        if (!startDate || !endDate) return true; // Skip validation if dates are not set

        return new Date(startDate) <= new Date(endDate);
    }

    /**
     * Validate form before submission
     */
    validateForm(): boolean {
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

        // Display validation results using SweetAlert2
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

    /**
     * Display toast notification
     */
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

    /**
     * Submit form data
     */
    onSubmit() {
        console.log("--- Attempting Form Submission ---");

        if (this.formData.invalid) {
            this.formData.markAllAsTouched();

            // Run validation to show errors
            const isValid = this.validateForm();
            if (!isValid) {
                return;
            }
        }

        // Temporarily enable disabled controls to include their values in the payload
        const disabledControls = ['line_code', 'section_code', 'created_by', 'auth_id'];
        disabledControls.forEach(field => {
            const control = this.formData.get(field);
            if (control?.disabled) {
                control.enable({ emitEvent: false });
            }
        });

        // Update cost and cost_text values manually
        const costControl = this.formData.get('cost');
        const costTextControl = this.formData.get('cost_text');

        if (costControl) {
            costControl.setValue(this.totalCostIDR.toString(), { emitEvent: false });
        }

        if (costTextControl) {
            costTextControl.setValue(this.generateCostText(), { emitEvent: false });
        }

        // Get form values including previously disabled controls
        const payload = this.formData.getRawValue();

        // Disable controls again
        disabledControls.forEach(field => {
            const control = this.formData.get(field);
            if (control) {
                control.disable({ emitEvent: false });
            }
        });

        // Ensure TokenStorage values are correctly populated
        payload.created_by = this.GodocUser?.nik || payload.created_by;
        payload.auth_id = this.GodocUser?.auth_id || payload.auth_id;
        payload.department_id = payload.department_id || this.GodocUser?.department?.id;
        payload.section_department_id = payload.section_department_id || this.GodocUser?.section?.id;
        payload.plant_id = payload.plant_id || this.GodocUser?.site?.id;

        // Convert string IDs to numbers
        const numericFields = ['document_number_id', 'department_id', 'section_department_id', 'plant_id', 'auth_id'];
        numericFields.forEach(field => {
            if (payload[field]) {
                payload[field] = Number(payload[field]);
            }
        });

        // Save cost items in JSON format
        payload.cost_items_json = JSON.stringify(payload.costItems);

        console.log("Submission Payload:", payload);
        console.log("Cost Text Format:", payload.cost_text);

        // Set loading state and show loading indicator
        this.loading = true;
        Swal.fire({
            title: 'Submitting Data',
            html: 'Please wait while we process your request...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Send main form data
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

                        // Send support document data
                        this.prepareAndSaveSupportDocuments(proposedChangesId);
                    } else {
                        console.error("Failed to get proposed_id from response:", response);
                        this.loading = false;
                        Swal.close();
                        this.showSuccessAndNavigate();
                    }
                },
                error: (error: any) => {
                    console.error("Form Submission Error:", error);
                    this.loading = false;
                    Swal.close();
                    this.handleError(error, "Error submitting data");
                }
            });
    }

    /**
     * Prepare and save support documents
     */
    prepareAndSaveSupportDocuments(proposedChangesId: number) {
        console.log("All document types from formData2:", this.formData2.value);

        if (this.documentTypes.length === 0) {
            console.log("No support documents available. Skipping support API call.");
            this.showSuccessAndNavigate();
            return;
        }

        // Prepare data to send to API - using formData2
        const formDataArray = this.formData2.get('data') as FormArray;

        // Make sure formDataArray exists
        if (!formDataArray || formDataArray.length === 0) {
            console.log("No support documents in formData2. Skipping support API call.");
            this.showSuccessAndNavigate();
            return;
        }

        // Show loading animation for support documents processing
        Swal.fire({
            title: 'Saving Documents',
            html: 'Processing support documents...',
            timerProgressBar: true,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const supportDocsPayload = formDataArray.controls.map((control: AbstractControl) => {
            // Get value from form control
            const controlValue = control.value;

            // Add proposed_id to each document
            return {
                ...controlValue,
                proposed_id: proposedChangesId,
                created_by: this.GodocUser?.nik || controlValue.created_by || ""
            };
        });

        console.log("Prepared Support Docs Payload from formData2:", supportDocsPayload);

        // Send to API endpoint
        this.service.post("/proposedchanges-support", supportDocsPayload)
            .subscribe({
                next: (response: any) => {
                    console.log("Support Doc Submission Success:", response);
                    Swal.close();
                    this.showSuccessAndNavigate();
                },
                error: (error: any) => {
                    console.error("Support Doc Submission Error:", error);
                    Swal.close();

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

    /**
     * Show success message and navigate to list page
     */
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

    /**
     * Handle API errors
     */
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

    /**
     * Get formatted date in ISO format
     */
    public getFormattedDate(): string {
        return new Date().toISOString();
    }

    /**
     * Navigate Back with confirmation if form is dirty
     */
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

    /**
     * Get currency symbol based on currency code
     */
    getCurrencySymbol(currencyCode: string | null | undefined): string {
        if (!currencyCode) return '';

        const currency = this.currencies.find(c => c.code === currencyCode);
        return currency ? currency.symbol : '';
    }

    /**
     * Check if currency is IDR
     */
    isIDR(currencyCode: string | null | undefined): boolean {
        return currencyCode === 'IDR';
    }


}