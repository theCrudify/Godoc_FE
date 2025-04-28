import { Component, OnInit, TemplateRef } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import Swal from "sweetalert2";
import { ngxLoadingAnimationTypes } from "ngx-loading";
import { TokenStorageService } from "src/app/core/services/token-storage.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { catchError } from "rxjs/operators";
import { of, Subject } from "rxjs";
import { AppService } from "src/app/shared/service/app.service";

const PrimaryWhite = "#ffffff";
const SecondaryGrey = "#ccc";

interface Employee {
  employee_code: string;
  employee_name: string;
  email?: string;
  phone_number?: string;
  user_id?: string;
  combinedLabel?: string;
}

// Define EnabledFields type for the toggleable sections
type EnabledFields = 'concept' | 'standart' | 'method';

@Component({
  selector: 'app-authorization-create',
  templateUrl: './authorization-create.component.html',
  styleUrls: ['./authorization-create.component.scss']
})
export class AuthorizationCreateComponent implements OnInit {
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

  // Toggle state for optional fields
  isEnabled = {
    concept: false,
    standart: false,
    method: false,
  };

  // Form definition
  public dataForm = new FormGroup({
    id: new FormControl(null),
    doc_number: new FormControl("", Validators.required),
    implementation_date: new FormControl("", Validators.required),
    evaluation: new FormControl("", Validators.required),
    description: new FormControl("", Validators.required),
    conclution: new FormControl("", Validators.required),
    concept: new FormControl("Tidak Ada", Validators.required),
    standart: new FormControl("Tidak Ada", Validators.required),
    method: new FormControl("Tidak Ada", Validators.required),
    running_number: new FormControl(null),
    selectedAuthorization: new FormControl(null)
  });

  // Employee selection
  searchBy: string = "employee_name";
  searchTerm$ = new Subject<string>();
  employeesData: Employee[] = [];
  selectedEmployees: Employee[] = [];
  selectedEmployee: any = null;

  // Validation state
  isAuthorizationValid: boolean = true;

  // Other data
  userData: any;
  id_document: any;
  department_id: any;
  section_department_id: any;

  constructor(
    private service: AppService,
    private router: Router,
    private tokenStorageService: TokenStorageService,
    private route: ActivatedRoute,
    private _snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    // Get user data
    this.userData = this.tokenStorageService.getUser();

    // Initialize form controls disabled state based on default values
    if (!this.isEnabled.concept) this.dataForm.get('concept')?.disable();
    if (!this.isEnabled.standart) this.dataForm.get('standart')?.disable();
    if (!this.isEnabled.method) this.dataForm.get('method')?.disable();

    // Get document ID from route parameter
    this.getIdParams();

    // Load employee data
    this.loadEmployees();

    // Load document data
    this.loadDocumentData();

    // Set loading to false once initialization is complete
    this.loading = false;
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
   * Loads document data based on the ID
   */
  loadDocumentData(): void {
    if (!this.id_document) return;

    // Get additional document data
    this.service
      .get("/additionalbyid/search?proposed_change_id=" + this.id_document)
      .subscribe({
        next: (res: any) => {
          console.log("Additional doc response:", res);
          const filteredData = res.data.filter(
            (item: any) => item.klasifikasi_document === "OTP"
          );

          if (filteredData.length) {
            // Use running_number as doc_number
            this.dataForm.get("doc_number")!.setValue(filteredData[0].running_number);
          }
        },
        error: (error) => {
          this.handleError(error, 'Error fetching additional document data');
        }
      });

    ;
  }

  /**
   * Handles employee selection change
   */
  onEmployeeChange(event: any): void {
    this.selectedEmployee = event;
    console.log("Selected employee:", this.selectedEmployee);
  }

  /**
   * Handles employee search
   */
  onSearchEmployees(event: any): void {
    const searchText = event.term;
    if (searchText && searchText.length > 2) {
      this.loadEmployees(searchText);
    }
  }

  /**
   * Adds the currently selected employee to the list
   */
  addSelectedEmployee(): void {
    if (!this.selectedEmployee) {
      this.showNotification(
        "snackbar-info",
        "Please select an employee first",
        "bottom",
        "right"
      );
      return;
    }

    // Check for duplicate
    const isDuplicate = this.selectedEmployees.some(
      (emp) => emp.employee_code === this.selectedEmployee.employee_code
    );

    if (isDuplicate) {
      this.showNotification(
        "snackbar-info",
        "Employee already added",
        "bottom",
        "right"
      );
      return;
    }

    // Add to selected employees
    this.selectedEmployees.push(this.selectedEmployee);

    // Reset selected employee
    this.selectedEmployee = null;
    this.dataForm.get('selectedAuthorization')?.setValue(null);
    this.isAuthorizationValid = true;
  }

  /**
   * Removes an employee from the selected list
   */
  removeSelectedEmployee(employee: Employee): void {
    this.selectedEmployees = this.selectedEmployees.filter(
      (emp) => emp.employee_code !== employee.employee_code
    );
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
    this._snackBar.open(text, "", {
      duration: 3000,
      verticalPosition: placementFrom,
      horizontalPosition: placementAlign,
      panelClass: [colorName]
    });
  }

  /**
   * Handles checkbox change for optional sections
   */
  onCheckboxChange(field: EnabledFields, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.isEnabled[field] = checkbox.checked;

    const formControl = this.dataForm.get(field);
    if (!formControl) return;

    if (!checkbox.checked) {
      // When checkbox is unchecked, set default value and disable input
      formControl.setValue("Tidak Ada");
      formControl.disable();
    } else {
      // When checkbox is checked, clear value and enable input
      formControl.setValue('');
      formControl.enable();
    }
  }

  /**
   * Loads employee data from the API
   */
  loadEmployees(searchTerm: string = ''): void {
    this.service.get(`/users/employees?search=${searchTerm}`).subscribe({
      next: (result: any) => {
        if (result && result.data) {
          this.employeesData = result.data.map((item: any) => ({
            employee_code: item.employee_code,
            employee_name: item.employee_name,
            email: item.email,
            phone_number: item.phone_number,
            user_id: item.user_id,
            combinedLabel: `${item.employee_code} - ${item.employee_name}${item.email ? ' - ' + item.email : ''}`
          }));
        }
      },
      error: (error) => this.handleError(error, 'Error fetching employee data')
    });
  }

  /**
   * Checks if at least one of the optional fields is filled
   */
  isAtLeastOneConceptFilled(): boolean {
    const concept = this.isEnabled.concept ? this.dataForm.get('concept')?.value : 'Tidak Ada';
    const standart = this.isEnabled.standart ? this.dataForm.get('standart')?.value : 'Tidak Ada';
    const method = this.isEnabled.method ? this.dataForm.get('method')?.value : 'Tidak Ada';

    return concept !== 'Tidak Ada' || standart !== 'Tidak Ada' || method !== 'Tidak Ada';
  }

  /**
   * Checks if basic info fields are complete
   */
  isBasicInfoComplete(): boolean {
    return !!this.dataForm.get('implementation_date')?.valid;
  }

  /**
   * Checks if main content fields are complete
   */
  isMainContentComplete(): boolean {
    return !!(
      this.dataForm.get('description')?.valid &&
      this.dataForm.get('evaluation')?.valid &&
      this.dataForm.get('conclution')?.valid
    );
  }

  /**
   * Checks if employee selection is complete
   */
  isMembersComplete(): boolean {
    return this.selectedEmployees.length > 0;
  }

  /**
   * Checks if the entire form is complete and ready to submit
   */
  isFormComplete(): boolean {
    return !!(
      this.isBasicInfoComplete() &&
      this.isMainContentComplete() &&
      this.isAtLeastOneConceptFilled() &&
      this.isMembersComplete()
    );
  }

  /**
   * Calculates the completion percentage for the progress bar
   */
  getCompletionPercentage(): number {
    let totalFields = 7; // All important fields
    let completedFields = 0;

    if (this.dataForm.get('doc_number')?.valid) completedFields++;
    if (this.dataForm.get('implementation_date')?.valid) completedFields++;
    if (this.dataForm.get('description')?.valid) completedFields++;
    if (this.dataForm.get('evaluation')?.valid) completedFields++;
    if (this.dataForm.get('conclution')?.valid) completedFields++;
    if (this.isAtLeastOneConceptFilled()) completedFields++;
    if (this.selectedEmployees.length > 0) completedFields++;

    return Math.round((completedFields / totalFields) * 100);
  }

  /**
   * Returns the appropriate CSS class for the progress bar
   */
  getProgressBarClass(): string {
    const percentage = this.getCompletionPercentage();
    if (percentage === 100) return 'bg-success';
    if (percentage >= 60) return 'bg-warning';
    return 'bg-danger';
  }

  /**
   * Returns the appropriate CSS class for the completion text
   */
  getCompletionClass(): string {
    const percentage = this.getCompletionPercentage();
    if (percentage === 100) return 'text-success fw-bold';
    if (percentage >= 60) return 'text-warning fw-bold';
    return 'text-danger fw-bold';
  }

  /**
   * Handles form submission
   */
  onFormSubmit(event: Event): void {
    event.preventDefault();

    // Mark all fields as 'touched' to show validation
    this.dataForm.markAllAsTouched();

    // Validate at least one of concept, standart, or method is filled
    if (!this.isAtLeastOneConceptFilled()) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "At least one of 'Work Concept', 'Standard', or 'Testing Method' must be filled!",
      });
      return;
    }

    // Validate overall form
    if (!this.dataForm.valid) {
      Swal.fire({
        icon: "error",
        title: "Incomplete Form",
        text: "Please complete all required fields!",
      });
      return;
    }

    // Validate employee selection
    if (this.selectedEmployees.length < 1) {
      this.isAuthorizationValid = false;
      Swal.fire({
        icon: "error",
        title: "Incomplete Form",
        text: "You must select at least one employee!",
      });
      return;
    }

    // Format data for API
    const formValue = this.dataForm.value;
    const requestData = {
      doc_number: formValue.doc_number,
      implementation_date: formValue.implementation_date,
      evaluation: formValue.evaluation,
      description: formValue.description,
      conclution: formValue.conclution,
      concept: this.isEnabled.concept ? formValue.concept : "Tidak Ada",
      standart: this.isEnabled.standart ? formValue.standart : "Tidak Ada",
      method: this.isEnabled.method ? formValue.method : "Tidak Ada",
      created_by: this.userData.nik,
      auth_id: Number(this.userData.auth_id),
      plant_id: Number(this.userData.site.id),
      department_id: Number(this.userData.department.id),
      section_department_id: Number(this.userData.section.id),
      proposed_change_id: Number(this.id_document),

      // Format employee data for members array
      members: this.selectedEmployees.map(emp => ({
        employee_code: emp.employee_code,
        employee_name: emp.employee_name,
        status: "active"
      }))
    };

    // Start loading
    this.loading = true;
    console.log("Sending request data:", requestData);

    // Submit data
    this.service.post("/authdoc", requestData)
      .pipe(
        catchError(error => {
          console.error("Error submitting form:", error);
          this.loading = false;
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "An error occurred while saving the data",
            confirmButtonColor: "#f44336"
          });
          return of(null);
        })
      )
      .subscribe((response: any) => {
        this.loading = false;
        if (response && response.message) {
          Swal.fire({
            icon: "success",
            title: "Success!",
            text: "Authorization document has been created successfully",
            confirmButtonColor: "#4caf50"
          }).then(() => {
            this.router.navigate(["/activity-page/authorization-list"]);
          });
        }
      });
  }

  /**
   * Generic error handler
   */
  handleError(error: any, defaultMessage: string): void {
    let errorMessage = defaultMessage;

    if (error.status === 0) {
      errorMessage = 'Cannot connect to the server. Please ensure the server is running.';
    } else if (error.error) {
      if (error.error.message) {
        errorMessage = error.error.message;
      } else if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.error.errors) {
        // Handle Joi validation
        const validationErrors = error.error.errors;
        errorMessage = Object.keys(validationErrors)
          .map(field => `${field}: ${validationErrors[field].join(', ')}`)
          .join('\n');
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: errorMessage,
      confirmButtonColor: "#f44336"
    });
  }

  goBack(): void {
    sessionStorage.setItem("reloadBackPage", "true");
    window.history.back();
  }

}