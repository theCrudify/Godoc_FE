import { Component, OnInit, TemplateRef } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ngxLoadingAnimationTypes } from 'ngx-loading';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppService } from 'src/app/shared/service/app.service';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';
import { Subject } from 'rxjs';
import Swal from 'sweetalert2';

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

interface AuthDocMember {
  id?: number;
  employee_code: string;
  employee_name: string;
  status: string;
  created_date?: string;
}

type EnabledFields = 'concept' | 'standart' | 'method';

@Component({
  selector: 'app-authorization-edit',
  templateUrl: './authorization-edit.component.html',
  styleUrls: ['./authorization-edit.component.scss']
})
export class AuthorizationEditComponent implements OnInit {
  public ngxLoadingAnimationTypes = ngxLoadingAnimationTypes;
  public loading = true;
  public primaryColour = PrimaryWhite;
  public secondaryColour = SecondaryGrey;
  public loadingTemplate!: TemplateRef<any>;

  // Form data
  dataForm!: FormGroup;
  errorMessage: string = '';
  docId: number = 0;
  userData: any;

  // Fields state
  isEnabled = {
    concept: false,
    standart: false,
    method: false,
  };

  // Employee selection
  searchBy: string = "employee_name";
  searchTerm$ = new Subject<string>();
  employeesData: Employee[] = [];
  selectedEmployees: AuthDocMember[] = [];
  selectedEmployee: any = null;
  isAuthorizationValid: boolean = true;

  // Original document data
  originalData: any = null;

  public config = {
    animationType: ngxLoadingAnimationTypes.circle,
    primaryColour: this.primaryColour,
    secondaryColour: this.secondaryColour,
    tertiaryColour: this.primaryColour,
    backdropBorderRadius: "3px",
  };

  constructor(
    private service: AppService,
    private route: ActivatedRoute,
    private router: Router,
    private _snackBar: MatSnackBar,
    private fb: FormBuilder,
    private tokenStorageService: TokenStorageService
  ) {
    this.createForm();
  }

  ngOnInit() {
    this.userData = this.tokenStorageService.getUser();

    this.route.params.subscribe(params => {
      this.docId = +params['id']; // Convert to number
      this.loadAuthDocDetail(this.docId);
    });

    // Load employees data
    this.loadEmployees();
  }

  createForm() {
    this.dataForm = this.fb.group({
      doc_number: ['', Validators.required],
      implementation_date: ['', Validators.required],
      evaluation: ['', Validators.required],
      description: ['', Validators.required],
      conclution: ['', Validators.required],
      concept: ['Tidak Ada', Validators.required],
      standart: ['Tidak Ada', Validators.required],
      method: ['Tidak Ada', Validators.required],
      selectedAuthorization: [null]
    });
  }

  loadAuthDocDetail(id: number) {
    this.loading = true;
    this.service.get(`/authdoc/${id}`).subscribe({
      next: (response: any) => {
        console.log('Auth Doc Detail response:', response);
        if (response && response.status === 'success' && response.data && response.data.length > 0) {
          this.originalData = response.data[0];
          
          // Ensure authdocMembers is properly initialized
          if (!this.originalData.authdocMembers) {
            this.originalData.authdocMembers = [];
          }
          
          // Reset selectedEmployees before populating
          this.selectedEmployees = [];
          
          // Populate form with document data
          this.populateForm(this.originalData);
        } else {
          this.errorMessage = 'No data found for this document';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching auth doc detail:', error);
        this.errorMessage = error.message || 'Failed to load document details';
        this.loading = false;
        this.showNotification('snackbar-danger', this.errorMessage, 'bottom', 'right');
      }
    });
  }
  
  populateForm(data: any) {
    // Set initial form values
    this.dataForm.patchValue({
      doc_number: data.doc_number || '',
      implementation_date: data.implementation_date ? new Date(data.implementation_date).toISOString().split('T')[0] : '',
      evaluation: data.evaluation || '',
      description: data.description || '',
      conclution: data.conclution || '',
      concept: data.concept || 'Tidak Ada',
      standart: data.standart || 'Tidak Ada',
      method: data.method || 'Tidak Ada',
    });
  
    // Set enabled fields based on content
    this.isEnabled.concept = data.concept && data.concept !== 'Tidak Ada';
    this.isEnabled.standart = data.standart && data.standart !== 'Tidak Ada';
    this.isEnabled.method = data.method && data.method !== 'Tidak Ada';
  
    // Update form controls enabled state
    this.updateEnabledFields();
  
    // Clear selectedEmployees first to avoid duplication
    this.selectedEmployees = [];
    
    // Load existing members - only add non-deleted members
    if (data.authdocMembers && data.authdocMembers.length > 0) {
      // Only include members that aren't marked as deleted
      data.authdocMembers.forEach((member: any) => {
        if (!member.is_deleted) {
          this.selectedEmployees.push({
            id: member.id,
            employee_code: member.employee_code,
            employee_name: member.employee_name,
            status: member.status || "active",
            created_date: member.created_date
          });
        }
      });
      
      console.log('Loaded members:', this.selectedEmployees);
    }
  }



  updateEnabledFields() {
    // Enable/disable form controls based on isEnabled state
    if (this.isEnabled.concept) {
      this.dataForm.get('concept')?.enable();
    } else {
      this.dataForm.get('concept')?.disable();
    }

    if (this.isEnabled.standart) {
      this.dataForm.get('standart')?.enable();
    } else {
      this.dataForm.get('standart')?.disable();
    }

    if (this.isEnabled.method) {
      this.dataForm.get('method')?.enable();
    } else {
      this.dataForm.get('method')?.disable();
    }
  }

  onCheckboxChange(field: EnabledFields, event: Event) {
    const checkbox = event.target as HTMLInputElement;
    this.isEnabled[field] = checkbox.checked;

    const formControl = this.dataForm.get(field);

    if (!checkbox.checked) {
      // When checkbox is unchecked, set default value and disable input
      formControl?.setValue("Tidak Ada");
      formControl?.disable();
    } else {
      // When checkbox is checked, clear value and enable input
      formControl?.setValue('');
      formControl?.enable();
    }
  }

  onEmployeeChange(event: any): void {
    this.selectedEmployee = event;
    console.log("Selected employee:", this.selectedEmployee);
  }

  onSearchEmployees(event: any): void {
    const searchText = event.term;
    if (searchText && searchText.length > 2) {
      this.loadEmployees(searchText);
    }
  }

  addSelectedEmployee(): void {
    if (this.selectedEmployee) {
      // Check if employee is already selected
      const isDuplicate = this.selectedEmployees.some(
        (emp) => emp.employee_code === this.selectedEmployee.employee_code
      );

      if (!isDuplicate) {
        // Add to selected employees
        this.selectedEmployees.push({
          employee_code: this.selectedEmployee.employee_code,
          employee_name: this.selectedEmployee.employee_name,
          status: "active"
        });
        // Reset selected employee
        this.selectedEmployee = null;
        this.dataForm.get('selectedAuthorization')?.setValue(null);
        this.isAuthorizationValid = true;
      } else {
        this.showNotification(
          "snackbar-info",
          "Employee already added",
          "bottom",
          "right"
        );
      }
    } else {
      this.showNotification(
        "snackbar-info",
        "Please select an employee first",
        "bottom",
        "right"
      );
    }

    console.log("Selected employees:", this.selectedEmployees);
  }

  removeSelectedEmployee(employee: AuthDocMember): void {
    this.selectedEmployees = this.selectedEmployees.filter(
      (emp) => emp.employee_code !== employee.employee_code
    );
  }

  loadEmployees(searchTerm: string = '') {
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
          console.log("Loaded employees:", this.employeesData);
        }
      },
      error: (error) => this.handleError(error, 'Error fetching employee data')
    });
  }

  // Form validation helpers
  isAtLeastOneConceptFilled(): boolean {
    const concept = this.isEnabled.concept ? this.dataForm.get('concept')?.value : 'Tidak Ada';
    const standart = this.isEnabled.standart ? this.dataForm.get('standart')?.value : 'Tidak Ada';
    const method = this.isEnabled.method ? this.dataForm.get('method')?.value : 'Tidak Ada';

    // At least one of them must not be "Tidak Ada"
    return concept !== 'Tidak Ada' || standart !== 'Tidak Ada' || method !== 'Tidak Ada';
  }

  isBasicInfoComplete(): boolean {
    return this.dataForm.get('implementation_date')?.valid ?? false;
  }

  isMainContentComplete(): boolean {
    return (
      this.dataForm.get('description')?.valid &&
      this.dataForm.get('evaluation')?.valid &&
      this.dataForm.get('conclution')?.valid
    ) ?? false;
  }

  isFormComplete(): boolean {
    return (
      this.isBasicInfoComplete() &&
      this.isMainContentComplete() &&
      this.isAtLeastOneConceptFilled() &&
      this.selectedEmployees.length > 0
    );
  }

  canSubmitForm(): boolean {
    return this.isFormComplete();
  }

  getCompletionPercentage(): number {
    let totalFields = 6; // Implementation date, description, evaluation, conclusion, at least one concept, employees
    let completedFields = 0;

    if (this.isBasicInfoComplete()) completedFields++;
    if (this.dataForm.get('description')?.valid) completedFields++;
    if (this.dataForm.get('evaluation')?.valid) completedFields++;
    if (this.dataForm.get('conclution')?.valid) completedFields++;
    if (this.isAtLeastOneConceptFilled()) completedFields++;
    if (this.selectedEmployees.length > 0) completedFields++;

    return Math.round((completedFields / totalFields) * 100);
  }

  getProgressBarClass(): string {
    const percentage = this.getCompletionPercentage();
    if (percentage === 100) return 'bg-success';
    if (percentage >= 60) return 'bg-warning';
    return 'bg-danger';
  }

// Updated onFormSubmit method to handle employee updates properly
onFormSubmit(event: Event) {
  event.preventDefault();

  // Mark all fields as 'touched' to display validation
  this.dataForm.markAllAsTouched();

  // Check if form is complete
  if (!this.isFormComplete()) {
    Swal.fire({
      icon: "warning",
      title: "Incomplete Form",
      text: "Please complete all required fields before submitting.",
    });
    return;
  }

  // Format data for API
  const formValue = this.dataForm.value;
  
  // Find employees that were in the original data but not in the current selection
  let deletedMemberIds: number[] = [];
  
  // Get IDs of all currently selected employees
  const currentEmployeeCodes = this.selectedEmployees.map(emp => emp.employee_code);
  
  // If we have original data with members
  if (this.originalData && this.originalData.authdocMembers) {
    // Find members that exist in original data but not in current selection
    this.originalData.authdocMembers.forEach((member: any) => {
      // If this member has an ID and is not in current selection
      if (member.id && !currentEmployeeCodes.includes(member.employee_code)) {
        deletedMemberIds.push(member.id);
      }
    });
  }
  
  console.log("Deleted member IDs:", deletedMemberIds);

  const requestData = {
    id: this.docId,
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
    proposed_change_id: Number(this.originalData.proposed_change_id),

    // Format employee data for members array
    members: this.selectedEmployees.map(emp => ({
      id: emp.id, // Include ID if it exists (for existing members)
      employee_code: emp.employee_code,
      employee_name: emp.employee_name,
      status: emp.status || "active"
    })),
    
    // Add deleted member IDs array
    deleted_member_ids: deletedMemberIds
  };

  // Loading starts
  this.loading = true;
  console.log("Sending update request data:", requestData);

  // Send data
  this.service.put(`/authdoc/${this.docId}`, requestData)
    .subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response && response.status === 'success') {
          Swal.fire({
            icon: "success",
            title: "Success!",
            text: "Authorization document successfully updated",
            confirmButtonColor: "#3f51b5"
          }).then(() => {
            this.router.navigate(["/activity-page/authorization-list"]);
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to update the document",
            confirmButtonColor: "#3f51b5"
          });
        }
      },
      error: (error) => {
        console.error("Error updating form:", error);
        this.loading = false;
        this.handleError(error, 'Error updating document');
      }
    });
}

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

  handleError(error: any, defaultMessage: string) {
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
      confirmButtonColor: "#3f51b5"
    });
  }

  goBack(): void {
    sessionStorage.setItem("reloadBackPage", "true");
    window.history.back();
  }

}