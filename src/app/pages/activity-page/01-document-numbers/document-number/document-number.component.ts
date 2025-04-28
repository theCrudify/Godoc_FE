import { Component, OnInit, OnDestroy, TemplateRef, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import Swal from "sweetalert2";
import { AppService } from "src/app/shared/service/app.service";
import { TokenStorageService } from "src/app/core/services/token-storage.service";
import { finalize, debounceTime, takeUntil, distinctUntilChanged } from "rxjs/operators";
import { Subject, Observable, of } from "rxjs";
import { catchError } from "rxjs/operators";
import { ActivatedRoute, ParamMap, Router } from "@angular/router";

interface DropdownItem {
    id?: number;
    code?: string;
    display: string;
    code_area?: string;
    [key: string]: any; // For additional properties
}

// Interface untuk line yang lebih spesifik (opsional)
interface LineItem extends DropdownItem {
    id: number;
    code: string;
    display: string;
    line_name?: string; // Nama line tanpa kode
}

@Component({
    selector: "app-document-number",
    templateUrl: "./document-number.component.html",
    styleUrls: ["./document-number.component.scss"],
})
export class DocumentNumberComponent implements OnInit, OnDestroy {
    // Core properties
    GodocUser: any;
    breadCrumbItems: Array<{ label: string; active?: boolean }> = [];
    loading = false;
    showGuidance = true;
    formProgress = 0;
    formProgressStatus = "Not Started";
    private destroy$ = new Subject<void>();

    // Loading states for different form components
    loadingStates = {
        lines: false,
        departments: false,
        areas: false,
        categories: false,
        developments: false
    };

    // Dropdown lists with caching
    lines: DropdownItem[] = [];
    departments: DropdownItem[] = [];
    areas: DropdownItem[] = [];
    categories: DropdownItem[] = [];
    developments: DropdownItem[] = [];

    // Selected values
    selectedCodeLine: string | null = null;
    selectedDepartmentDisplay: string | null = null;

    @ViewChild("modalForm") modalForm!: TemplateRef<any>;
    formData!: FormGroup;

    constructor(
        private service: AppService,
        private fb: FormBuilder,
        private modal: NgbModal,
        private tokenStorage: TokenStorageService,
        private router: Router,

    ) { }

    ngOnInit(): void {
        this.GodocUser = this.tokenStorage.getUser();
        this.initForm();
        this.initBreadcrumbs();
        this.setupFormValueChanges();
        this.loadInitialData();
        this.checkManufactureDepartmentAndAutoFill();

        console.log("User Data:", this.GodocUser);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    initBreadcrumbs(): void {
        this.breadCrumbItems = [
            { label: "Master Data" },
            { label: "Document Number", active: true },
        ];
    }

    loadInitialData(): void {
        // Load only the immediately needed data to improve initial load performance
        this.loadDepartments();
        this.loadCategories();
        if (!(this.GodocUser?.department?.department_name === 'Manufacture Department' &&
            this.formData.get('line_code')?.value)) {
            this.loadedLines();
        }

        // Update department display
        this.updateDepartmentDisplay();


    }

    updateDepartmentDisplay(): void {
        if (this.GodocUser?.department) {
            const deptCode = this.GodocUser.department.department_code || '';
            const deptName = this.GodocUser.department.department_name || '';
            this.selectedDepartmentDisplay = `${deptCode} - ${deptName}`;
        } else {
            this.selectedDepartmentDisplay = 'Not assigned';
        }
    }

    getCurrentDepartmentDisplay(): string {
        return this.selectedDepartmentDisplay || 'Department not assigned';
    }

    setupFormValueChanges(): void {
        // Track form changes for progress calculation
        this.formData.valueChanges
            .pipe(
                debounceTime(300),
                distinctUntilChanged(),
                takeUntil(this.destroy$)
            )
            .subscribe(() => {
                this.calculateFormProgress();
            });

        // Handle category_id changes
        this.formData.get("category_id")?.valueChanges
            .pipe(
                debounceTime(200),
                takeUntil(this.destroy$)
            )
            .subscribe(value => {
                if (value) {
                    this.loadDevelopments();
                } else {
                    this.developments = [];
                }
            });
    }

    calculateFormProgress(): void {
        const requiredFields = ['category_id', 'development_code', 'line_code', 'area_id'];
        const totalFields = requiredFields.length;
        let completedFields = 0;

        requiredFields.forEach(field => {
            if (this.formData.get(field)?.valid && this.formData.get(field)?.value) {
                completedFields++;
            }
        });

        this.formProgress = Math.round((completedFields / totalFields) * 100);

        // Set status text based on progress
        if (this.formProgress === 0) this.formProgressStatus = "Not Started";
        else if (this.formProgress < 50) this.formProgressStatus = "Started";
        else if (this.formProgress < 100) this.formProgressStatus = "Almost Complete";
        else this.formProgressStatus = "Complete";
    }

    /**
     * Generic method to load dropdown data with error handling and loading state
     */
    loadDropdownData<T>(
        endpoint: string,
        searchTerm: string = "",
        mapFn: (item: any) => DropdownItem = this.defaultMapFn,
        filterFn: (item: DropdownItem) => boolean = () => true
    ): void {
        // Set the specific loading state
        const loadingKey = endpoint.replace("/", "") as keyof typeof this.loadingStates;
        this.loadingStates[loadingKey] = true;

        this.service
            .get(`${endpoint}?search=${searchTerm}`)
            .pipe(
                finalize(() => {
                    this.loadingStates[loadingKey] = false;
                }),
                catchError(error => {
                    this.handleError(error, `Error fetching ${endpoint} data`);
                    return of({ data: [] });
                })
            )
            .subscribe({
                next: (result: any) => {
                    if (result && result.data) {
                        // Map and filter the data
                        (this as any)[endpoint.replace("/", "")] = result.data
                            .map(mapFn)
                            .filter(filterFn);
                    } else {
                        (this as any)[endpoint.replace("/", "")] = [];
                    }
                }
            });
    }

    /**
     * Load departments with optimized caching
     */
    loadDepartments = (searchTerm: string = ""): void => {
        // Only load if no data or search term provided
        if (this.departments.length === 0 || searchTerm) {
            this.loadDropdownData("/departments", searchTerm, (item: any) => ({
                id: item.id,
                code: item.department_code,
                display: `${item.department_code} - ${item.department_name}`,
            }));
        }
    };

    /**
     * Load lines with optimized caching
     */
    /**
     * Load lines dengan optimized caching
     */
    loadedLines = (searchTerm: string = ""): void => {
        // Hanya load jika tidak ada data atau ada search term
        if (this.lines.length === 0 || searchTerm) {
            this.loadingStates.lines = true;

            this.service.get(`/lines?search=${searchTerm}`)
                .pipe(
                    finalize(() => {
                        this.loadingStates.lines = false;
                    }),
                    catchError(error => {
                        this.handleError(error, "Error fetching lines data");
                        return of({ data: [] });
                    })
                )
                .subscribe({
                    next: (result: any) => {
                        if (result && result.data) {
                            this.lines = result.data.map((item: any) => {
                                const lineName = item.line || '';
                                const lineCode = item.code_line || '';

                                return {
                                    id: item.id,
                                    code: lineCode,
                                    display: `${lineName} - ${lineCode}`,
                                    line_name: lineName // Simpan nama line murni untuk pencarian
                                };
                            });

                            // Cek apakah perlu auto-fill berdasarkan Manufacture Department
                            this.checkAndSelectLineBasedOnSection();
                        } else {
                            this.lines = [];
                        }
                    }
                });
        }
    };

    /**
     * Periksa dan pilih line berdasarkan section jika dari Manufacture Department
     */
    private checkAndSelectLineBasedOnSection(): void {
        // Skip jika form line sudah terisi
        if (this.formData.get('line_code')?.value) {
            return;
        }

        // Cek apakah user dari Manufacture Department
        if (this.GodocUser?.department?.department_name === 'Manufacture Department' &&
            this.GodocUser?.section?.section_name) {

            const sectionName = this.GodocUser.section.section_name;

            // Extract line name dari section name
            let lineName = '';
            if (sectionName.includes('Line')) {
                lineName = sectionName.replace(/\s*Line\s*/i, '').trim();
            }

            if (lineName && this.lines.length > 0) {
                // Cari line yang sesuai dengan line name dari section
                const matchedLine = this.lines.find((line: DropdownItem) =>
                    line.display.toLowerCase().includes(lineName.toLowerCase()) ||
                    (line['line_name'] && line['line_name'].toLowerCase().includes(lineName.toLowerCase()))
                );

                if (matchedLine) {
                    console.log('Line yang sesuai ditemukan berdasarkan section:', matchedLine);

                    // Auto-fill line code
                    this.formData.patchValue({
                        line_code: matchedLine.code
                    });

                    // Trigger change event untuk mengaktifkan area field dan memuat area
                    this.onLineChange(matchedLine);
                }
            }
        }
    }
    /**
     * Handle line selection change
     */
    onLineChange(selectedLine: any): void {
        if (selectedLine?.code) {
            const searchTerm = selectedLine.code.trim();
            this.selectedCodeLine = searchTerm;
            this.loadAreas(searchTerm);
        } else {
            this.areas = [];
            this.selectedCodeLine = null;
        }
    }

    /**
     * Load areas based on line selection
     */
    loadAreas = (searchTerm: string = ""): void => {
        this.loadingStates.areas = true;

        this.service
            .get(`/areas?search=${searchTerm}`)
            .pipe(
                finalize(() => {
                    this.loadingStates.areas = false;
                }),
                catchError(error => {
                    this.handleError(error, "Error fetching areas data");
                    return of({ data: [] });
                })
            )
            .subscribe({
                next: (result: any) => {
                    if (result && result.data) {
                        // Filter areas to match the selected line
                        this.areas = result.data
                            .map((item: any) => {
                                const codeLine = item.line_details?.code_line ?? "";
                                return {
                                    id: item.id,
                                    code_area: item.code_area,
                                    display: `${codeLine} - ${item.code_area} - ${item.area}`,
                                };
                            })
                            .filter((area: DropdownItem) => {
                                // Only show areas matching the selected line
                                if (!this.selectedCodeLine) return true;
                                return area.display.includes(this.selectedCodeLine);
                            });
                    } else {
                        this.areas = [];
                    }
                }
            });
    };

    /**
     * Handle area selection change
     */
    onAreaChange(selectedArea: any): void {
        if (selectedArea && selectedArea.code_area) {
            this.formData.patchValue({ section_code: selectedArea.code_area });
        } else {
            this.formData.patchValue({ section_code: null });
        }
    }

    /**
     * Load categories with optimized implementation
     */
    loadCategories(searchTerm: string = ""): void {
        // Only load if no data or search term provided
        if (this.categories.length === 0 || searchTerm) {
            this.loadDropdownData("/categories", searchTerm, (item: any) => ({
                id: item.id,
                display: item.category || "Unnamed Category",
            }));
        }
    }

    /**
     * Load developments with filtering based on selected category
     */
    loadDevelopments(searchTerm: string = "") {
        this.loading = true;
        // console.log('Loading Developments - Search Term:', searchTerm);

        // Reset development_code saat category berubah
        this.formData.get("development_code")?.setValue(null);

        const selectedCategory = this.formData.get("category_id")?.value;
        // console.log('Selected Category:', selectedCategory);

        this.service.get(`/development?search=${searchTerm}`).subscribe({
            next: (result: any) => {
                console.log("Developments Raw Data:", result);

                if (result && result.data) {
                    this.developments = result.data
                        .map((item: any) => ({
                            id: item.id,
                            code: item.development_code,
                            display: `${item.development_code} - ${item.development_desc}`,
                        }))

                        // 4 itu id dari Process Improvement
                        .filter((dev: DropdownItem) => {
                            if (selectedCategory === 4) {
                                return dev.code === "PSD"; // Hanya tampilkan PSD jika kategori Process Improvement
                            } else {
                                return dev.code === "PJD"; // Tampilkan PJD untuk kategori lain
                            }
                        });

                    // console.log('Filtered Developments:', this.developments);
                } else {
                    // console.warn('No development data found');
                    this.developments = [];
                }

                this.loading = false;
            },
            error: (error) => {
                // console.error('Error loading developments:', error);
                this.handleError(error, "Error fetching developments");
                this.loading = false;
            },
        });
    }
    /**
     * Initialize form with validation
     */
    initForm(): void {
        const GodocUser = this.tokenStorage.getUser() || {};

        this.formData = this.fb.group({
            category_id: [null, [Validators.required]],
            klasifikasi_document: ["Usulan Perubahan (UP)", Validators.required],
            line_code: [null, [Validators.required]],
            section_code: [null],
            section_id: [{
                value: GodocUser?.section?.id,
                disabled: true
            }, Validators.required],

            auth_id: [{
                value: GodocUser?.auth_id,
                disabled: true
            }, Validators.required],

            department_code: [{
                value: GodocUser?.department?.department_code || null,
                disabled: true
            }, Validators.required],
            development_code: [null, [Validators.required]],
            plant_id: [GodocUser?.site?.id],
            is_internal_memo: [false],
            is_surat_ketentuan: [false],
            created_by: [GodocUser?.nik || null],
            created_date: [this.getFormattedDate()],
            area_id: [{
                value: null,
                disabled: true
            }, Validators.required],
        });

        // Tetapkan listener untuk perubahan line_code
        this.formData.get("line_code")?.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe((value) => {
                if (value) {
                    this.formData.get("area_id")?.enable();
                } else {
                    this.formData.get("area_id")?.disable();
                }
            });
    }

    /**
     * Reset form with confirmation
     */
    resetForm(): void {
        Swal.fire({
            title: 'Reset Form?',
            text: 'This will clear all entered data. Continue?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, Reset',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                const GodocUser = this.tokenStorage.getUser() || {};

                // Simpan nilai yang tidak ingin direset
                const sectionIdValue = this.formData.get('section_id')?.value;
                const sectionAuthValue = this.formData.get('auth_id')?.value;
                const departmentCodeValue = this.formData.get('department_code')?.value;
                const plantIdValue = this.formData.get('plant_id')?.value;
                const createdByValue = this.formData.get('created_by')?.value;

                // Reset form
                this.formData.reset();

                // Setel kembali nilai yang tidak ingin direset
                this.formData.patchValue({
                    klasifikasi_document: "Usulan Perubahan (UP)",
                    section_id: sectionIdValue,
                    auth_id: sectionAuthValue,
                    department_code: departmentCodeValue,
                    plant_id: plantIdValue,
                    created_by: createdByValue,
                    created_date: this.getFormattedDate(),
                    is_internal_memo: false,
                    is_surat_ketentuan: false
                });

                // Re-disable control yang seharusnya disabled
                this.formData.get('section_id')?.disable();
                this.formData.get('department_code')?.disable();
                this.formData.get('area_id')?.disable();
                this.formData.get('auth_id')?.disable();


                // Show toast notification
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    icon: 'success',
                    title: 'Form reset successfully'
                    
                });

                
            }
        });
    }

    /**
     * Check if field is invalid and touched
     */
    isFieldInvalid(fieldName: string): boolean {
        const field = this.formData.get(fieldName);
        return !!field && field.invalid && field.touched;
    }

    /**
     * Submit form with validation and error handling
     */
    onSubmit(): void {
        // Mark all fields as touched to trigger validation visuals
        Object.keys(this.formData.controls).forEach(key => {
            this.formData.get(key)?.markAsTouched();
        });

        if (this.formData.invalid) {
            const invalidControls = Object.keys(this.formData.controls)
                .filter(key => this.formData.get(key)?.invalid)
                .map(key => this.getFieldLabel(key))
                .join(', ');

            Swal.fire({
                icon: "warning",
                title: "Form Incomplete",
                text: `Please complete these required fields: ${invalidControls}`,
            });
            return;
        }

        // Show confirmation before submission
        Swal.fire({
            title: 'Submit Document Number Request?',
            text: 'This will create a new document number',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, Submit',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                this.submitForm();
            }
        });
    }

    /**
     * Perform actual form submission
     */
    private submitForm(): void {
        // Prepare payload with raw values to include disabled fields
        const payload = {
            ...this.formData.getRawValue(),
            created_by: this.GodocUser?.nik,
            created_date: this.getFormattedDate()
        };
    
        this.loading = true;
    
        this.service.post("/documentnumbers/", payload)
            .pipe(finalize(() => this.loading = false))
            .subscribe({
                next: (response) => {
                    Swal.fire({
                        icon: "success",
                        title: "Success!",
                        text: "Document number has been successfully created",
                        confirmButtonText: "OK"
                    }).then(() => {
                        // After clicking OK, navigate to the new page
                        if (this.modalForm) {
                            this.modal.dismissAll();
                        }
    
                        // Reset form after successful submission
                        this.router.navigate(['/activity-page/document-number']);
                    });
                },
                error: (error) => {
                    this.handleError(error, "Error submitting document number");
                },
            });
    }
    
    /**
     * Get human-readable field label from field name
     */
    private getFieldLabel(fieldName: string): string {
        const labels: { [key: string]: string } = {
            'category_id': 'Category',
            'development_code': 'Development',
            'line_code': 'Line',
            'area_id': 'Area',
            'klasifikasi_document': 'Klasifikasi Dokumen',
            'department_code': 'Department',
            'section_code': 'Section Code'
        };

        return labels[fieldName] || fieldName;
    }

    /**
     * Handle API errors with improved user feedback
     */
    handleError(error: any, defaultMessage: string): void {
        let errorMessage = defaultMessage;
        let errorDetails = '';

        if (error.status === 0) {
            errorMessage = "Cannot connect to server";
            errorDetails = "Please check your internet connection and try again";
        } else if (error.error) {
            if (error.error.message) {
                errorMessage = error.error.message;
            } else if (typeof error.error === "string") {
                errorMessage = error.error;
            } else if (error.error.errors) {
                errorMessage = "Validation errors";
                const validationErrors = error.error.errors;
                errorDetails = Object.keys(validationErrors)
                    .map((field) => `${this.getFieldLabel(field)}: ${validationErrors[field].join(", ")}`)
                    .join("\n");
            }
        }

        Swal.fire({
            icon: "error",
            title: errorMessage,
            text: errorDetails || "Please try again or contact IT support",
            confirmButtonText: "OK"
        });
    }

    /**
     * Default mapping function for dropdown items
     */
    private defaultMapFn(item: any): DropdownItem {
        return {
            id: item.id,
            display: item.name || item.title || item.toString(),
        };
    }

    /**
     * Get formatted date for submission
     */
    public getFormattedDate(): string {
        return new Date().toISOString();
    }

    /**
     * Show helper tooltips for fields based on their current state
     */
    getFieldTooltip(fieldName: string): string {
        const tooltips: { [key: string]: string } = {
            'category_id': 'Pilih kategori dokumen untuk menentukan jenis dokumen',
            'development_code': 'Kode pengembangan yang sesuai dengan kategori',
            'line_code': 'Pilih line produksi yang relevan',
            'area_id': 'Area spesifik dalam line yang dipilih',
            'department_code': 'Departemen Anda (otomatis terisi)'
        };

        // Add context-specific tooltips
        if (fieldName === 'development_code' && !this.formData.get('category_id')?.value) {
            return 'Anda harus memilih Category terlebih dahulu';
        }

        if (fieldName === 'area_id' && !this.formData.get('line_code')?.value) {
            return 'Anda harus memilih Line terlebih dahulu';
        }

        return tooltips[fieldName] || '';
    }

    /**
     * Track form field interaction statistics
     */
    trackFieldInteraction(fieldName: string): void {
        // Implementasi analitik untuk melacak interaksi pengguna dengan form
        // Bisa digunakan untuk meningkatkan UX di masa mendatang
        console.log(`Field interaction: ${fieldName} at ${new Date().toISOString()}`);
    }

    /**
     * Create a new line if it doesn't exist
     */
    createNewLine(): void {
        Swal.fire({
            title: 'Tambah Line Baru',
            html: `
        <input id="line-name" class="swal2-input" placeholder="Nama Line">
        <input id="line-code" class="swal2-input" placeholder="Kode Line">
      `,
            showCancelButton: true,
            confirmButtonText: 'Simpan',
            cancelButtonText: 'Batal',
            focusConfirm: false,
            preConfirm: () => {
                const lineName = (document.getElementById('line-name') as HTMLInputElement).value;
                const lineCode = (document.getElementById('line-code') as HTMLInputElement).value;

                if (!lineName || !lineCode) {
                    Swal.showValidationMessage('Nama dan Kode Line harus diisi');
                    return false;
                }

                return { lineName, lineCode };
            }
        }).then((result) => {
            if (result.isConfirmed && result.value) {
                // Contoh implementasi: Menambahkan line baru
                this.addNewLine(result.value.lineName, result.value.lineCode);
            }
        });
    }

    /**
     * Add a new line to the system
     */
    private addNewLine(name: string, code: string): void {
        this.loading = true;

        const payload = {
            line: name,
            code_line: code,
            created_by: this.GodocUser?.nik || 'system'
        };

        this.service.post('/lines', payload)
            .pipe(finalize(() => this.loading = false))
            .subscribe({
                next: (response) => {
                    // Tambahkan line baru ke daftar line
                    this.lines.push({
                        id: response.data.id,
                        code: code,
                        display: `${name} - ${code}`
                    });

                    // Set line yang baru dibuat sebagai line terpilih
                    this.formData.patchValue({ line_code: code });

                    Swal.fire({
                        icon: 'success',
                        title: 'Line Baru Berhasil Ditambahkan',
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 3000
                    });
                },
                error: (error) => {
                    this.handleError(error, 'Gagal menambahkan line baru');
                }
            });
    }

    /**
     * Generate document preview before submission
     */
    previewDocument(): void {
        if (this.formData.invalid) {
            Swal.fire({
                icon: 'warning',
                title: 'Form Belum Lengkap',
                text: 'Lengkapi semua field yang diperlukan untuk melihat preview'
            });
            return;
        }

        const formValues = this.formData.getRawValue();
        const categoryName = this.getCategoryName(formValues.category_id);
        const developmentCode = formValues.development_code;
        const lineCode = formValues.line_code;
        const areaInfo = this.getAreaInfo(formValues.area_id);

        // Generate sample document number format
        const docNumberFormat = `${developmentCode}-${lineCode}-${areaInfo?.code_area || 'XXX'}-${this.generateRandomSuffix()}`;

        Swal.fire({
            title: 'Preview Dokumen',
            html: `
        <div class="preview-container" style="text-align: left; padding: 15px; border: 1px solid #eee; border-radius: 5px;">
          <p><strong>Kategori:</strong> ${categoryName}</p>
          <p><strong>Klasifikasi:</strong> ${formValues.klasifikasi_document}</p>
          <p><strong>Development:</strong> ${developmentCode}</p>
          <p><strong>Line:</strong> ${this.getLineName(lineCode)}</p>
          <p><strong>Area:</strong> ${areaInfo?.display || 'Tidak tersedia'}</p>
          <p><strong>Format Nomor Dokumen:</strong> <span style="font-weight: bold; color: #0d6efd;">${docNumberFormat}</span></p>
        </div>
      `,
            confirmButtonText: 'OK',
            width: '600px'
        });
    }

    /**
     * Helper functions for preview
     */
    private getCategoryName(categoryId: number): string {
        const category = this.categories.find(c => c.id === categoryId);
        return category?.display || 'Tidak tersedia';
    }

    private getLineName(lineCode: string): string {
        const line = this.lines.find(l => l.code === lineCode);
        return line?.display || lineCode || 'Tidak tersedia';
    }

    private getAreaInfo(areaId: number): DropdownItem | undefined {
        return this.areas.find(a => a.id === areaId);
    }

    private generateRandomSuffix(): string {
        // Generate 4-digit random number for document preview
        return Math.floor(1000 + Math.random() * 9000).toString();
    }

    /**
 * Cek apakah user dari Manufacture Department dan auto-fill line berdasarkan section
 */
    /**
     * Cek apakah user dari Manufacture Department dan auto-fill line berdasarkan section
     */
    private checkManufactureDepartmentAndAutoFill(): void {
        // Pastikan user data tersedia
        if (!this.GodocUser?.department || !this.GodocUser?.section) {
            return;
        }

        // Cek apakah user dari Manufacture Department
        const isManufactureDept =
            this.GodocUser.department.department_name === 'Manufacture Department' &&
            this.GodocUser.department.status === true;

        if (isManufactureDept) {
            console.log('User dari Manufacture Department terdeteksi');

            // Ambil line name dari section_name
            // Contoh: " Line Glass Bottle" -> "Glass Bottle" atau "Line XYZ" -> "XYZ"
            const sectionName = this.GodocUser.section.section_name || '';
            let lineName = '';

            if (sectionName.includes('Line')) {
                // Extract line name dari section name (hapus kata "Line" dan whitespace)
                lineName = sectionName.replace(/\s*Line\s*/i, '').trim();
                console.log('Line yang diambil dari section:', lineName);
            }

            // Jika line name ditemukan, load lines dan auto-fill
            if (lineName) {
                // Load lines terlebih dahulu
                this.loadingStates.lines = true;
                this.service.get('/lines')
                    .pipe(finalize(() => this.loadingStates.lines = false))
                    .subscribe({
                        next: (result: any) => {
                            if (result && result.data) {
                                // Map data lines
                                this.lines = result.data.map((item: any) => ({
                                    id: item.id,
                                    code: item.code_line,
                                    display: `${item.line} - ${item.code_line}`
                                }));

                                // Cari line yang sesuai dengan line name dari section
                                const matchedLine = this.lines.find((line: DropdownItem) =>
                                    line.display.toLowerCase().includes(lineName.toLowerCase())
                                );

                                if (matchedLine) {
                                    console.log('Line yang sesuai ditemukan:', matchedLine);

                                    // Auto-fill line code
                                    this.formData.patchValue({
                                        line_code: matchedLine.code
                                    });

                                    // Trigger change event untuk mengaktifkan area field dan memuat area
                                    this.onLineChange(matchedLine);

                                    // Disable line field jika user dari Manufacture Department
                                    // Sudah dihandle pada template dengan conditional rendering
                                } else {
                                    console.log('Line yang sesuai tidak ditemukan dalam daftar');

                                    // Jika tidak ada yang cocok, mungkin bisa menggunakan default line dari department tersebut
                                    if (this.lines.length > 0) {
                                        // Misalnya, ambil line pertama saja dari array sebagai fallback
                                        console.log('Menggunakan default line:', this.lines[0]);
                                        this.formData.patchValue({
                                            line_code: this.lines[0].code
                                        });
                                        this.onLineChange(this.lines[0]);
                                    }
                                }
                            }
                        },
                        error: (error) => {
                            console.error('Error saat load lines:', error);
                        }
                    });
            }
        }
    }

    /**
   * Mendapatkan text display dari selected line
   */
    getSelectedLineDisplay(): string {
        const lineCode = this.formData.get('line_code')?.value;

        if (!lineCode) {
            // Jika belum ada line terpilih, tampilkan "Loading..." jika sedang auto-fill
            if (this.isManufactureDepartmentUser()) {
                return "Loading line berdasarkan section...";
            }
            return "No line selected";
        }

        // Cari line dalam array lines berdasarkan code
        const selectedLine = this.lines.find(line => line.code === lineCode);

        if (selectedLine) {
            return selectedLine.display;
        }

        // Jika line belum tersedia di array lines (mungkin masih loading)
        // Cari line dari section name
        if (this.isManufactureDepartmentUser() && this.GodocUser?.section?.section_name) {
            const sectionName = this.GodocUser.section.section_name;
            let lineName = '';

            if (sectionName.includes('Line')) {
                lineName = sectionName.replace(/\s*Line\s*/i, '').trim();
                return `${lineName} - ${lineCode}`;
            }
        }

        return lineCode;
    }

    /**
 * Tampilkan informasi section untuk user Manufacture Department
 */
    getManufactureDepartmentInfo(): string | null {
        // Cek apakah user dari Manufacture Department
        if (this.GodocUser?.department?.department_name === 'Manufacture Department' &&
            this.GodocUser?.section?.section_name) {

            const sectionName = this.GodocUser.section.section_name;
            return `User dari ${this.GodocUser.department.department_name}, Section: ${sectionName}`;
        }

        return null;
    }

    /**
     * Cek apakah user dari Manufacture Department
     */
    isManufactureDepartmentUser(): boolean {
        return this.GodocUser?.department?.department_name === 'Manufacture Department' &&
            this.GodocUser?.department?.status === true;
    }
}