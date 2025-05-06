import { Component, OnInit, OnDestroy } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import Swal from "sweetalert2";
import { ngxLoadingAnimationTypes } from "ngx-loading";
import { TokenStorageService } from "src/app/core/services/token-storage.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { catchError } from "rxjs/operators";
import { of, Subject } from "rxjs";
import { AppService } from "src/app/shared/service/app.service";
import { takeUntil } from "rxjs/operators";

const PrimaryWhite = "#ffffff";
const SecondaryGrey = "#ccc";
const STORAGE_KEY = 'handover_form_data';

interface Employee {
  employee_code: string;
  employee_name: string;
  email?: string;
  phone_number?: string;
  user_id?: string;
  id_user?: string;
  combinedLabel?: string;
}

// Define EnabledFields type for the toggleable sections
type EnabledFields = 'concept' | 'standart' | 'method';

interface AuthDoc {
  id: number;
  proposed_change_id: number;
  doc_number: string;
  implementation_date: string;
  evaluation: string;
  description: string;
  conclution: string;
  concept: string;
  standart: string;
  method: string;
  status: string;
  progress: string;
  created_by: string;
  auth_id: number;
  plant_id: number;
  created_date: string;
  department_id: number;
  section_department_id: number;
  updated_at: string;
  proposedChange: {
    id: number;
    project_name: string;
    document_number_id: number;
    item_changes: string;
    line_code: string;
    section_code: string;
    section_name: string;
    department_id: number;
    section_department_id: number;
    plant_id: number;
    auth_id: number;
    change_type: string;
    description: string;
    reason: string;
    cost: string;
    cost_text: string;
    planning_start: string;
    planning_end: string;
    created_date: string;
    created_by: string;
    updated_at: string;
    need_engineering_approval: boolean;
    need_production_approval: boolean;
    other_sytem: string;
    status: string;
    progress: string;
    is_deleted: boolean;
  }
}

// Interface to define the shape of our localStorage data
interface StoredFormData {
  formValues: any;
  selectedAuthDocId?: number;
  selectedEmployee1?: Employee | null;
  selectedEmployee2?: Employee | null;
  selectedEmployee3?: Employee | null;
  selectedEmployee4?: Employee | null;
  currentStep?: number;
  timestamp: number; // To track when the data was saved
}

@Component({
  selector: 'app-handover-create',
  templateUrl: './handover-create.component.html',
  styleUrls: ['./handover-create.component.scss']
})
export class handoverCreateComponent implements OnInit, OnDestroy {
  // Cleanup subject for unsubscribing
  private destroy$ = new Subject<void>();

  // ngx-loading configuration
  public ngxLoadingAnimationTypes = ngxLoadingAnimationTypes;
  public loading = true;
  public primaryColour = PrimaryWhite;
  public secondaryColour = SecondaryGrey;
  public config = {
    animationType: ngxLoadingAnimationTypes.circle,
    primaryColour: this.primaryColour,
    secondaryColour: this.secondaryColour,
    tertiaryColour: this.primaryColour,
    backdropBorderRadius: "3px",
  };

  // Progress indicators for form sections
  formProgress = {
    documentSelection: false,
    detailsComplete: false,
    employeeSelection: false  // This will now require all employees to be filled
  };

  // Current active step in the wizard
  currentStep = 1;
  totalSteps = 4;

  // Toggle state for optional fields
  isEnabled = {
    concept: false,
    standart: false,
    method: false,
  };

  // Form definition
  public dataForm = new FormGroup({
    id: new FormControl<string | null>(null),
    doc_number: new FormControl<string>("", Validators.required),
    material: new FormControl<string>("", [Validators.required, Validators.minLength(10)]),
    remark: new FormControl<string>("", [Validators.required, Validators.minLength(10)]),

    // Hidden form controls
    auth_id: new FormControl<number | null>(null), // Will be auto-populated from token
    auth_id2: new FormControl<number | null>(null),
    auth_id3: new FormControl<number | null>(null),
    auth_id4: new FormControl<number | null>(null),
    authdoc_id: new FormControl<number | null>(null),
    selectedhandover: new FormControl<string | null>(null),

    // New form controls for document information display
    project_name: new FormControl<string>({ value: '', disabled: true }),
    section_info: new FormControl<string>({ value: '', disabled: true })
  });

  // Employee selection variables
  searchBy: string = "employee_name";
  searchTerm$ = new Subject<string>();
  employeesData: Employee[] = [];

  // Selected employees objects for different positions
  selectedEmployee1: Employee | null = null;
  selectedEmployee2: Employee | null = null;
  selectedEmployee3: Employee | null = null;
  selectedEmployee4: Employee | null = null;

  // Validation state
  ishandoverValid: boolean = true;
  formSubmitted: boolean = false;

  // Document data
  authDocs: AuthDoc[] = [];
  selectedAuthDoc: AuthDoc | null = null;
  filteredAuthDocs: AuthDoc[] = [];

  // User and document data
  userData: any;
  id_document: any;
  department_id: any;
  section_department_id: any;
  GodocUser: any;

  // Filtered employee lists for each dropdown
  filteredEmployees2: Employee[] = [];
  filteredEmployees3: Employee[] = [];
  filteredEmployees4: Employee[] = [];

  // To track if we've loaded saved data
  private hasLoadedSavedData = false;

  constructor(
    private service: AppService,
    private router: Router,
    private tokenStorageService: TokenStorageService,
    private route: ActivatedRoute,
    private _snackBar: MatSnackBar
  ) { }

  // Updated ngOnInit method
  ngOnInit(): void {
    // Get user data from token storage
    this.GodocUser = this.tokenStorageService.getUser();

    // Set auth_id from token automatically and set primary employee to current user
    if (this.GodocUser && this.GodocUser.auth_id) {
      this.dataForm.get('auth_id')?.setValue(this.GodocUser.auth_id);
      console.log("Auto-populated auth_id from token:", this.GodocUser.auth_id);

      // Create employee object for the current user
      this.selectedEmployee1 = {
        employee_code: this.GodocUser.employee_code || this.GodocUser.nik,
        employee_name: this.GodocUser.employee_name || this.GodocUser.name,
        id_user: this.GodocUser.id
      };

      // Since we now require all employees to be selected, don't update this yet
      this.ishandoverValid = false;

      console.log("Auto-set primary employee to current user:", this.selectedEmployee1);
    } else {
      console.error("No auth_id found in token");
      this.showNotification(
        "snackbar-warning",
        "User authentication issue detected. Please log in again.",
        "top",
        "center"
      );
    }

    // Initialize form controls disabled state based on default values
    if (!this.isEnabled.concept) this.dataForm.get('concept')?.disable();
    if (!this.isEnabled.standart) this.dataForm.get('standart')?.disable();
    if (!this.isEnabled.method) this.dataForm.get('method')?.disable();

    // Get document ID from route parameter
    this.getIdParams();

    // Load employee data
    this.loadEmployees();

    // Load auth documents
    this.loadAuthDocs();

    // Listen for form value changes to save to localStorage
    this.dataForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.saveFormToLocalStorage();
      });

    // Add event handler for beforeunload to save data before page refreshes
    window.addEventListener('beforeunload', () => {
      this.saveFormToLocalStorage();
    });

    // Also listen for app-level events like browser refresh
    window.addEventListener('pagehide', () => {
      this.saveFormToLocalStorage();
    });

    // Set loading to false once initialization is complete
    setTimeout(() => {
      this.loading = false;
    }, 1000);
  }

  ngOnDestroy(): void {
    // Cleanup subscriptions
    this.destroy$.next();
    this.destroy$.complete();

    // Remove event listeners
    window.removeEventListener('beforeunload', () => {
      this.saveFormToLocalStorage();
    });

    window.removeEventListener('pagehide', () => {
      this.saveFormToLocalStorage();
    });
  }

  /**
   * Gets the ID parameter from the route
   */
  getIdParams(): void {
    this.route.params.subscribe((params) => {
      this.id_document = params["id"];
    });
  }

  /**
   * Loads auth documents for the current user
   */
  loadAuthDocs(): void {
    if (!this.GodocUser || !this.GodocUser.auth_id) {
      this.showNotification(
        "snackbar-error",
        "User authentication required. Please log in again.",
        "top",
        "center"
      );
      return;
    }

    const auth_id = this.GodocUser.auth_id;
    this.loading = true;

    this.service.get(`/authdoc/by-auth/${auth_id}`).subscribe({
      next: (result: any) => {
        this.loading = false;
        if (result && result.data) {
          this.authDocs = result.data;

          // Filter for documents with OTP in the doc_number
          this.filteredAuthDocs = this.authDocs.filter(doc =>
            doc.doc_number && doc.doc_number.includes('/OTP/')
          );

          if (this.filteredAuthDocs.length === 0) {
            this.showNotification(
              "snackbar-info",
              "No OTP documents found for conversion to FST",
              "bottom",
              "center"
            );
          }
          console.log("OTP documents loaded:", this.filteredAuthDocs);

          // After loading documents, try to restore saved form data
          this.tryLoadSavedFormData();
        }
      },
      error: (error) => {
        this.loading = false;
        this.handleError(error, 'Error fetching auth documents');
      }
    });
  }

  /**
   * Saves the current form state to localStorage
   */
  saveFormToLocalStorage(): void {
    // Skip saving if we haven't finished loading the initial data
    if (!this.authDocs.length || this.loading) {
      return;
    }

    // Check if a form was previously submitted
    const wasSubmitted = localStorage.getItem('handover_form_submitted');
    if (wasSubmitted === 'true') {
      // Don't save data if form was already submitted
      return;
    }

    const formData: StoredFormData = {
      formValues: this.dataForm.getRawValue(),
      selectedAuthDocId: this.selectedAuthDoc?.id,
      selectedEmployee1: this.selectedEmployee1,
      selectedEmployee2: this.selectedEmployee2,
      selectedEmployee3: this.selectedEmployee3,
      selectedEmployee4: this.selectedEmployee4,
      currentStep: this.currentStep,
      timestamp: Date.now()
    };

    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      console.log('Form data saved to localStorage');
    } catch (e) {
      console.error('Failed to save form data to localStorage:', e);
    }
  }

  /**
   * Attempts to load saved form data from localStorage
   */
  tryLoadSavedFormData(): void {
    // Skip if we've already loaded saved data or if docs aren't loaded yet
    if (this.hasLoadedSavedData || !this.authDocs.length) {
      return;
    }

    try {
      // Check if a form was previously submitted but the page was refreshed
      // before the redirect could happen
      const wasSubmitted = localStorage.getItem('handover_form_submitted');
      if (wasSubmitted === 'true') {
        console.log('Form was previously submitted, clearing all saved data');
        this.clearSavedFormData(true);
        localStorage.removeItem('handover_form_submitted');
        this.hasLoadedSavedData = true;
        return;
      }

      const savedData = localStorage.getItem(STORAGE_KEY);
      if (!savedData) {
        console.log('No saved form data found');
        return;
      }

      const formData: StoredFormData = JSON.parse(savedData);

      // Check if saved data is recent enough (within 24 hours)
      const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
      if (formData.timestamp < twentyFourHoursAgo) {
        console.log('Saved form data is too old, discarding');
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      // Ask user if they want to restore saved data
      Swal.fire({
        title: 'Restore previous work?',
        text: 'We found your previously started form. Would you like to continue where you left off?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, restore',
        cancelButtonText: 'No, start fresh',
        confirmButtonColor: '#28a745'
      }).then((result) => {
        if (result.isConfirmed) {
          this.restoreSavedFormData(formData);
        } else {
          // User chose to start fresh, clear the saved data
          this.clearSavedFormData(true);
        }
      });

    } catch (e) {
      console.error('Error loading saved form data:', e);
    }

    // Mark that we've attempted to load saved data
    this.hasLoadedSavedData = true;
  }

  /**
   * Restores the form state from saved data
   */
  restoreSavedFormData(formData: StoredFormData): void {
    try {
      this.loading = true;

      // Restore form values
      if (formData.formValues) {
        // Filter out null/undefined values to prevent errors
        const validFormValues = Object.keys(formData.formValues)
          .filter(key => formData.formValues[key] !== null && formData.formValues[key] !== undefined)
          .reduce((obj, key) => {
            obj[key] = formData.formValues[key];
            return obj;
          }, {} as any);

        this.dataForm.patchValue(validFormValues);
      }

      // Restore selected document
      if (formData.selectedAuthDocId) {
        this.selectedAuthDoc = this.authDocs.find(doc => doc.id === formData.selectedAuthDocId) || null;

        // If we found the document, update related fields
        if (this.selectedAuthDoc) {
          const sectionInfo = `${this.selectedAuthDoc.proposedChange.section_code}${this.selectedAuthDoc.proposedChange.section_name ? ' - ' + this.selectedAuthDoc.proposedChange.section_name : ''}`;
          this.dataForm.get("project_name")!.setValue(this.selectedAuthDoc.proposedChange.project_name);
          this.dataForm.get("section_info")!.setValue(sectionInfo);
        }
      }

      // Restore selected employees
      this.selectedEmployee1 = formData.selectedEmployee1 || this.selectedEmployee1;
      this.selectedEmployee2 = formData.selectedEmployee2 || null;
      this.selectedEmployee3 = formData.selectedEmployee3 || null;
      this.selectedEmployee4 = formData.selectedEmployee4 || null;

      // Restore current step
      if (formData.currentStep) {
        this.currentStep = formData.currentStep;
      }

      // Update progress state
      this.updateProgressState();

      // Show success notification
      this.showNotification(
        "snackbar-success",
        "Your previous work has been restored successfully",
        "bottom",
        "right"
      );

      console.log("Form state restored from localStorage");
    } catch (e) {
      console.error('Error restoring form data:', e);
      this.showNotification(
        "snackbar-error",
        "Failed to restore your previous work",
        "bottom",
        "right"
      );
    } finally {
      this.loading = false;
    }
  }

  /**
   * Clears saved form data from localStorage
   * @param allHandoverData - If true, clears all handover-related localStorage data
   */
  clearSavedFormData(allHandoverData: boolean = false): void {
    try {
      // Remove the specific form data
      localStorage.removeItem(STORAGE_KEY);

      // If requested, clear all handover-related data
      if (allHandoverData) {
        // Find and remove all localStorage items that start with 'handover_'
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('handover_')) {
            localStorage.removeItem(key);
          }
        });
      }

      console.log('Saved form data cleared');
    } catch (e) {
      console.error('Error clearing saved form data:', e);
    }
  }

  /**
   * Move to a specific step in the form wizard
   */
  // Modify goToStep method to enforce employee selection
  goToStep(stepNumber: number): void {
    if (stepNumber < 1 || stepNumber > this.totalSteps) return;

    // Validate before allowing navigation to next step
    if (stepNumber > this.currentStep) {
      if (this.currentStep === 1 && !this.dataForm.get('doc_number')?.valid) {
        this.showNotification(
          "snackbar-warning",
          "Please select a document before proceeding",
          "bottom",
          "center"
        );
        return;
      }

      if (this.currentStep === 2 && (!this.dataForm.get('material')?.valid || !this.dataForm.get('remark')?.valid)) {
        this.showNotification(
          "snackbar-warning",
          "Please complete material and remarks fields",
          "bottom",
          "center"
        );
        return;
      }

      // Updated validation for step 3, requiring all employees to be selected
      if (this.currentStep === 3) {
        if (!this.selectedEmployee1 || !this.selectedEmployee2 ||
          !this.selectedEmployee3 || !this.selectedEmployee4) {
          this.showNotification(
            "snackbar-warning",
            "All four employees must be selected",
            "bottom",
            "center"
          );
          return;
        }
      }
    }

    this.currentStep = stepNumber;

    // Update progress indicators
    this.updateProgressState();

    // Save updated state to localStorage
    this.saveFormToLocalStorage();
  }

  // Update the progress state calculation
  updateProgressState(): void {
    this.formProgress.documentSelection = !!this.dataForm.get('doc_number')?.valid;
    this.formProgress.detailsComplete = !!this.dataForm.get('material')?.valid && !!this.dataForm.get('remark')?.valid;

    // Require all employees to be selected (no longer optional)
    this.formProgress.employeeSelection = !!this.selectedEmployee1 &&
      !!this.selectedEmployee2 &&
      !!this.selectedEmployee3 &&
      !!this.selectedEmployee4;

    // Update the overall validation status
    this.ishandoverValid = this.formProgress.documentSelection &&
      this.formProgress.detailsComplete &&
      this.formProgress.employeeSelection;
  }

  /**
   * Handles document selection change
   */
  onDocumentChange(event: any): void {
    const selectedDocNumber = event.target.value;
    if (!selectedDocNumber) {
      this.dataForm.get("doc_number")!.setValue("");
      this.dataForm.get("project_name")!.setValue("");
      this.dataForm.get("section_info")!.setValue("");
      this.selectedAuthDoc = null;
      this.saveFormToLocalStorage();
      return;
    }

    // Find the selected document
    const selectedDoc = this.authDocs.find(doc => doc.doc_number === selectedDocNumber);
    if (selectedDoc) {
      this.selectedAuthDoc = selectedDoc;

      // Update the doc_number in the form, transforming OTP to FST
      const transformedDocNumber = selectedDocNumber.replace('/OTP/', '/FST/');
      this.dataForm.get("doc_number")!.setValue(transformedDocNumber);

      // Set the hidden form fields
      this.dataForm.get("authdoc_id")!.setValue(selectedDoc.id);

      // Set the display-only fields
      const sectionInfo = `${selectedDoc.proposedChange.section_code}${selectedDoc.proposedChange.section_name ? ' - ' + selectedDoc.proposedChange.section_name : ''}`;
      this.dataForm.get("project_name")!.setValue(selectedDoc.proposedChange.project_name);
      this.dataForm.get("section_info")!.setValue(sectionInfo);

      // Update progress state
      this.updateProgressState();

      // Save to localStorage
      this.saveFormToLocalStorage();

      // Show success notification
      this.showNotification(
        "snackbar-success",
        `Document ${transformedDocNumber} selected successfully`,
        "bottom",
        "right"
      );

      console.log("Selected document:", selectedDoc);
    }
  }

  /**
   * Handles employee selection for a specific position
   */
  // Updated onEmployeeChange method to filter out selected employees
  onEmployeeChange(event: any, position: number): void {
    const selectedEmployee = event;

    // Check if this employee is already selected in another position
    const isAlreadySelected = this.checkDuplicateEmployee(selectedEmployee?.employee_code, position);

    if (isAlreadySelected) {
      this.showNotification(
        "snackbar-warning",
        `Employee ${selectedEmployee?.employee_name} is already selected in another position`,
        "bottom",
        "right"
      );

      // Reset the selection
      switch (position) {
        case 1:
          this.selectedEmployee1 = null;
          break;
        case 2:
          this.selectedEmployee2 = null;
          break;
        case 3:
          this.selectedEmployee3 = null;
          break;
        case 4:
          this.selectedEmployee4 = null;
          break;
      }
      return;
    }

    console.log(`Selected employee for position ${position}:`, selectedEmployee);

    switch (position) {
      case 1:
        this.selectedEmployee1 = selectedEmployee;
        break;
      case 2:
        this.selectedEmployee2 = selectedEmployee;
        break;
      case 3:
        this.selectedEmployee3 = selectedEmployee;
        break;
      case 4:
        this.selectedEmployee4 = selectedEmployee;
        break;
    }

    // Update the filtered lists to exclude selected employees
    this.updateFilteredEmployeeLists();

    // Update progress indicators
    this.updateProgressState();

    // Save updated state to localStorage
    this.saveFormToLocalStorage();
  }



  /**
   * Check if an employee is already selected in another position
   */
  checkDuplicateEmployee(employeeCode: string, currentPosition: number): boolean {
    if (!employeeCode) return false;

    const positions = [
      { pos: 1, employee: this.selectedEmployee1 },
      { pos: 2, employee: this.selectedEmployee2 },
      { pos: 3, employee: this.selectedEmployee3 },
      { pos: 4, employee: this.selectedEmployee4 }
    ];

    return positions.some(p =>
      p.pos !== currentPosition &&
      p.employee &&
      p.employee.employee_code === employeeCode
    );
  }

  // Add filtering function for employees in dropdown
  getFilteredEmployees(excludeIds: string[]): Employee[] {
    // Filter out employees that are already selected
    return this.employeesData.filter(emp =>
      !excludeIds.includes(emp.employee_code)
    );
  }


  /**
   * Validates employee selection across all positions
   */
  // Update employee validation
  validateEmployeeSelections(): boolean {
    // Check if all required employees are selected
    if (!this.selectedEmployee1 || !this.selectedEmployee2 ||
      !this.selectedEmployee3 || !this.selectedEmployee4) {
      this.showNotification(
        "snackbar-error",
        "All four employees must be selected",
        "bottom",
        "right"
      );
      return false;
    }

    // Check for duplicates
    const employees = [
      this.selectedEmployee1,
      this.selectedEmployee2,
      this.selectedEmployee3,
      this.selectedEmployee4
    ];

    const uniqueCodes = new Set(employees.map(emp => emp!.employee_code));
    if (uniqueCodes.size !== employees.length) {
      this.showNotification(
        "snackbar-error",
        "Duplicate employees selected",
        "bottom",
        "right"
      );
      return false;
    }

    return true;
  }
  /**
   * Handles employee search
   */
  // Updated onSearchEmployees method to filter results
  onSearchEmployees(event: any): void {
    const searchText = event.term;
    if (searchText && searchText.length > 2) {
      this.loading = true;
      this.loadEmployees(searchText);
    }
  }


  /**
   * Displays a notification snackbar
   */
  showNotification(
    colorName: string,
    text: string,
    placementFrom: 'top' | 'bottom',
    placementAlign: 'left' | 'center' | 'right'
  ): void {
    const iconMap: Record<string, 'success' | 'error' | 'warning' | 'info' | 'question'> = {
      'snackbar-success': 'success',
      'snackbar-error': 'error',
      'snackbar-warning': 'warning',
      'snackbar-info': 'info'
      // tambahkan mapping lainnya jika perlu
    };

    // Posisi tetap di pojok kanan atas
    const position = 'top-end'; // 'top-end' = pojok kanan atas

    const icon = iconMap[colorName] || 'info';

    Swal.fire({
      toast: true,
      position,
      icon,
      title: text,
      showConfirmButton: false,
      timer: 4000,
      timerProgressBar: true
    });
  }

  /**
   * Loads employees from the API
   */
  loadEmployees(searchTerm: string = ''): void {
    this.service.get(`/userGodoc?search=${searchTerm}`).subscribe({
      next: (result: any) => {
        this.loading = false;
        if (result && result.data) {
          this.employeesData = result.data.map((item: any) => ({
            employee_code: item.employee_code,
            employee_name: item.employee_name,
            id_user: item.id,
            // Add combined label for better display in dropdown
            combinedLabel: `${item.employee_name} (${item.employee_code})`
          }));

          // Update filtered lists for each dropdown
          this.updateFilteredEmployeeLists();
        }
      },
      error: (error) => {
        this.loading = false;
        this.handleError(error, 'Error fetching employee data');
      }
    });
  }

  // New method to update filtered employee lists for each dropdown
  updateFilteredEmployeeLists(): void {
    // Get all selected employee codes to filter them out
    const selectedCodes = [
      this.selectedEmployee1?.employee_code,
      this.selectedEmployee2?.employee_code,
      this.selectedEmployee3?.employee_code,
      this.selectedEmployee4?.employee_code
    ].filter(code => code !== undefined);

    // Filter for employee 2
    this.filteredEmployees2 = this.employeesData.filter(emp =>
      !selectedCodes.includes(emp.employee_code) ||
      (this.selectedEmployee2 && emp.employee_code === this.selectedEmployee2.employee_code)
    );

    // Filter for employee 3
    this.filteredEmployees3 = this.employeesData.filter(emp =>
      !selectedCodes.includes(emp.employee_code) ||
      (this.selectedEmployee3 && emp.employee_code === this.selectedEmployee3.employee_code)
    );

    // Filter for employee 4
    this.filteredEmployees4 = this.employeesData.filter(emp =>
      !selectedCodes.includes(emp.employee_code) ||
      (this.selectedEmployee4 && emp.employee_code === this.selectedEmployee4.employee_code)
    );
  }

  /**
   * Generic error handler
   */
  handleError(error: any, message: string): void {
    console.error(message, error);
    this.showNotification(
      "snackbar-error",
      message,
      "bottom",
      "right"
    );
  }

  /**
   * Checks if basic info fields are complete
   */
  isBasicInfoComplete(): boolean {
    return !!this.dataForm.get('doc_number')?.valid;
  }

  /**
   * Get progress percentage based on current state
   */
  getProgressPercentage(): number {
    let percentage = 0;
    if (this.formProgress.documentSelection) percentage += 25;
    if (this.formProgress.detailsComplete) percentage += 25;
    if (this.formProgress.employeeSelection) percentage += 25;

    // Add final 25% only when all sections are complete
    if (this.formProgress.documentSelection &&
      this.formProgress.detailsComplete &&
      this.formProgress.employeeSelection) {
      percentage += 25;
    }

    return percentage;
  }

  /**
   * Handles form submission
   */
  onFormSubmit(event: Event): void {
    event.preventDefault();
    this.formSubmitted = true;

    // Mark all fields as 'touched' to show validation
    this.dataForm.markAllAsTouched();

    // Validate overall form
    if (!this.dataForm.valid) {
      Swal.fire({
        icon: "error",
        title: "Incomplete Form",
        text: "Please complete all required fields!",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    // Validate employee selection
    if (!this.validateEmployeeSelections()) {
      this.ishandoverValid = false;
      return;
    }

    // Set loading state
    this.loading = true;

    // Format data for API
    const formValue = this.dataForm.value;

    // Define the request data type
    interface RequestData {
      doc_number: string | null | undefined;
      proposed_change_id?: number;
      auth_id: number | null | undefined;
      plant_id?: number;
      department_id?: number;
      section_department_id?: number;
      material: string | null | undefined;
      created_by: string;
      remark: string | null | undefined;
      authdoc_id?: number;
      auth_id2?: number;
      auth_id3?: number;
      auth_id4?: number;
    }

    // Base request data
    const requestData: RequestData = {
      doc_number: formValue.doc_number,
      proposed_change_id: this.selectedAuthDoc?.proposed_change_id,
      auth_id: this.GodocUser?.auth_id, // Auto-populated from token - primary employee
      plant_id: this.selectedAuthDoc?.plant_id,
      department_id: this.selectedAuthDoc?.department_id,
      section_department_id: this.selectedAuthDoc?.section_department_id,
      material: formValue.material,
      created_by: this.GodocUser.nik || this.GodocUser.employee_code,
      remark: formValue.remark,
      authdoc_id: this.selectedAuthDoc?.id
    };

    // Add optional employee auth IDs if present
    if (this.selectedEmployee2) {
      requestData['auth_id2'] = Number(this.selectedEmployee2.id_user);
    }

    if (this.selectedEmployee3) {
      requestData['auth_id3'] = Number(this.selectedEmployee3.id_user);
    }

    if (this.selectedEmployee4) {
      requestData['auth_id4'] = Number(this.selectedEmployee4.id_user);
    }

    console.log("Submitting data:", requestData);

    // Clear the localStorage immediately when submitting to prevent saving after successful submission
    this.clearSavedFormData(true);

    // Add a flag to localStorage to indicate form has been submitted
    // This is useful if submission succeeds but user refreshes before redirect
    localStorage.setItem('handover_form_submitted', 'true');

    // Submit the form data
    this.service.post("/handover", requestData).subscribe({
      next: (response: any) => {
        this.loading = false;

        // Clear saved form data on successful submission
        this.clearSavedFormData(true);

        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Handover document created successfully!",
          confirmButtonColor: "#28a745",
        }).then(() => {
          // Ensure localStorage is cleared again before navigation
          this.clearSavedFormData(true);

          // Remove the submitted flag
          localStorage.removeItem('handover_form_submitted');

          this.router.navigate(['/activity-page/handover-list']);
        });
      },
      error: (error) => {
        this.loading = false;

        // Remove the submitted flag on error
        localStorage.removeItem('handover_form_submitted');

        // Since submission failed, restore the form data
        this.saveFormToLocalStorage();

        this.handleError(error, 'Error creating handover document');
      }
    });
  }

  /**
   * Navigate back to the previous page
   */
  onCancel(): void {
    Swal.fire({
      title: "Cancel handover creation?",
      text: "Do you want to save your progress for later or discard all changes?",
      icon: "warning",
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      denyButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Save & exit",
      denyButtonText: "Discard changes",
      cancelButtonText: "Continue editing"
    }).then((result) => {
      if (result.isConfirmed) {
        // User chose to save and exit
        this.saveFormToLocalStorage();
        this.showNotification(
          "snackbar-info",
          "Your progress has been saved. You can continue later.",
          "bottom",
          "center"
        );
        this.router.navigate(['/activity-page/handover-list']);
      } else if (result.isDenied) {
        // User chose to discard changes
        this.clearSavedFormData(true);
        this.showNotification(
          "snackbar-warning",
          "All changes have been discarded.",
          "bottom",
          "center"
        );
        this.router.navigate(['/activity-page/handover-list']);
      }
      // If canceled, just stay on the current page
    });
  }

  getAvailableEmployeesForPosition(position: number): Employee[] {
    // Create a set of already selected employees, except the current position
    const selectedCodes = new Set<string>();

    // Add all selected employees except for the position we're filling
    if (position !== 1 && this.selectedEmployee1) selectedCodes.add(this.selectedEmployee1.employee_code);
    if (position !== 2 && this.selectedEmployee2) selectedCodes.add(this.selectedEmployee2.employee_code);
    if (position !== 3 && this.selectedEmployee3) selectedCodes.add(this.selectedEmployee3.employee_code);
    if (position !== 4 && this.selectedEmployee4) selectedCodes.add(this.selectedEmployee4.employee_code);

    // Filter out employees that are already selected in other positions
    return this.employeesData.filter(emp => !selectedCodes.has(emp.employee_code));
  }
}