import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ngxLoadingAnimationTypes } from 'ngx-loading';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppService } from 'src/app/shared/service/app.service';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { of } from 'rxjs';
import { catchError, finalize } from "rxjs/operators";
import { FormBuilder, FormGroup } from '@angular/forms';

import Swal from 'sweetalert2';

const PrimaryWhite = "#ffffff";
const SecondaryGrey = "#ccc";

interface AuthDocMember {
  id: number;
  employee_code: string;
  employee_name: string;
  status: string;
  created_date: string;
}

// Interface yang diperbarui untuk AuthDocDetail sesuai dengan response API
interface AuthDocDetail {
  id: number;
  doc_number: string;
  auth_id: number;
  auth_id2: number;
  auth_id3: number;
  auth_id4: number;
  auth_id5: number | null;
  proposed_change_id: number;
  authdoc_id: number;
  plant_id: number;
  department_id: number;
  section_department_id: number;
  progress: string;
  status: string;
  material: string;
  remark: string;
  created_by: string;
  created_date: string;
  updated_at: string;
  updated_by: string | null;
  is_deleted: boolean;

  // Nested objects
  tr_proposed_changes: {
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
  };

  mst_plant: {
    id: number;
    plant_name: string;
    plant_code: string;
    address: string;
    created_at: string;
    created_by: string;
    updated_at: string | null;
    updated_by: string | null;
  };

  mst_department: {
    id: number;
    department_name: string;
    department_code: string;
    plant_id: number;
    status: boolean;
    is_deleted: boolean;
    created_by: string | null;
    created_at: string;
    updated_by: string | null;
    updated_at: string;
  };

  mst_section_department: {
    id: number;
    department_id: number;
    section_name: string;
    status: boolean;
    created_by: string | null;
    created_at: string;
    updated_by: string | null;
    updated_at: string | null;
    is_deleted: boolean;
  };

  tr_authorization_doc: {
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
  };

  // Property di root yang terkait dengan tr_proposed_changes
  line_code: string;
  project_name: string;

  // Data employee
  uth0: {
    id: number;
    employee_code: string;
    employee_name: string;
    email: string;
    number_phone: string;
    gender: string;
    department_id: number;
    section_id: number;
    plant_id: number;
    role_id: number;
    status: boolean;
    created_at: string;
    created_by: string;
    updated_at: string;
    updated_by: string | null;
    is_deleted: boolean;
  };

  uth1: {
    id: number;
    employee_code: string;
    employee_name: string;
    email: string;
    number_phone: string;
    gender: string;
    department_id: number;
    section_id: number;
    plant_id: number;
    role_id: number;
    status: boolean;
    created_at: string;
    created_by: string;
    updated_at: string;
    updated_by: string | null;
    is_deleted: boolean;
  };

  uth2: {
    id: number;
    employee_code: string;
    employee_name: string;
    email: string;
    number_phone: string;
    gender: string;
    department_id: number;
    section_id: number;
    plant_id: number;
    role_id: number;
    status: boolean;
    created_at: string;
    created_by: string;
    updated_at: string;
    updated_by: string | null;
    is_deleted: boolean;
  };

  uth3: {
    id: number;
    employee_code: string;
    employee_name: string;
    email: string;
    number_phone: string;
    gender: string;
    department_id: number;
    section_id: number;
    plant_id: number;
    role_id: number;
    status: boolean;
    created_at: string;
    created_by: string;
    updated_at: string;
    updated_by: string | null;
    is_deleted: boolean;
  };

  // Menambahkan properti authdocMembers untuk backward compatibility
  authdocMembers?: AuthDocMember[];
}

@Component({
  selector: 'app-handover-edit',
  templateUrl: './handover-edit.component.html',
  styleUrls: ['./handover-edit.component.scss']
})
export class handoverEditComponent implements OnInit {

  @ViewChild('approveModal', { static: false }) approveModal!: TemplateRef<any>;
  @ViewChild('notApproveModal', { static: false }) notApproveModal!: TemplateRef<any>;
  @ViewChild('rejectModal', { static: false }) rejectModal!: TemplateRef<any>;

  public ngxLoadingAnimationTypes = ngxLoadingAnimationTypes;
  public loading = true;
  public primaryColour = PrimaryWhite;
  public secondaryColour = SecondaryGrey;
  public loadingTemplate!: TemplateRef<any>;

  authDoc: AuthDocDetail | null = null;
  errorMessage: string = '';
  docId: number = 0;
  GodocUser: any;
  fromPage: string | null = null;
  approvalNote: string = '';

  // Form untuk edit
  editForm: FormGroup;
  isSaving: boolean = false;

  //Acces Step
  hasRejectionAccess: boolean = false;
  isCreator: boolean = false;
  isApprover: boolean = false;
  isAdminUser: boolean = false;
  isSuperAdminUser: boolean = false;

  public config = {
    animationType: ngxLoadingAnimationTypes.circle,
    primaryColour: this.primaryColour,
    secondaryColour: this.secondaryColour,
    tertiaryColour: this.primaryColour,
    backdropBorderRadius: "3px",
  };
  authData: any;

  constructor(
    private service: AppService,
    private route: ActivatedRoute,
    private router: Router,
    private _snackBar: MatSnackBar,
    private tokenStorage: TokenStorageService,
    private modalService: NgbModal,
    private fb: FormBuilder
  ) {
    // Initialize form
    this.editForm = this.fb.group({
      material: [''],
      remark: ['']
    });
  }

  ngOnInit() {
    this.GodocUser = this.tokenStorage.getUser();
    console.log('GodocUser:', this.GodocUser);
    this.route.params.subscribe(params => {
      this.docId = +params['id']; // Convert to number
      this.checkUserRole(this.docId);
    });
  }

  checkUserRole(id: number) {
    this.loading = true;

    // Check if user is Admin or Super Admin first
    if (this.GodocUser?.role?.role_name === "Admin" || this.GodocUser?.role?.role_name === "Super Admin") {
      console.log(`User is ${this.GodocUser.role.role_name}`);
      this.isAdminUser = true;
      this.loadDocumentDirectly(id);
      return;
    }

    // Untuk user biasa, periksa apakah dia approver terlebih dahulu
    this.checkIfUserIsApprover(id);
  }

  checkIfUserIsApprover(id: number) {
    const url = `/ongoinghandover?approval_auth_id=${this.GodocUser.auth_id}&id=${id}`;
    console.log('🔍 Memeriksa status approver:', url);

    this.service.get(url).subscribe({
      next: (response: any) => {
        console.log('📦 Respons API approver:', response);

        const approverData = response?.data?.[0];

        if (approverData) {
          console.log('✅ User dianggap APPROVER karena datanya ada');
          this.isApprover = true;
          this.loadDocumentDirectly(id);
        } else {
          console.log('❌ Tidak ditemukan data approver, cek apakah creator');
          this.checkIfUserIsCreator(id);
        }
      },
      error: (error) => {
        console.error('❗ Error saat memeriksa status approver:', error);
        this.checkIfUserIsCreator(id);
      }
    });
  }

  checkIfUserIsCreator(id: number) {
    const url = `/handover/${id}`;
    console.log('Memeriksa status creator:', url);

    this.service.get(url).subscribe({
      next: (response: any) => {
        console.log('Respons API dokumen:', response);

        if (response && response.status === 'success' && response.data && response.data.length > 0) {
          this.authDoc = response.data[0];
          console.log('Auth ID dokumen:', this.authDoc?.auth_id);
          console.log('Auth ID user:', this.GodocUser?.auth_id);

          // Periksa apakah user adalah creator dengan membandingkan auth_id
          if (this.authDoc?.auth_id === this.GodocUser?.auth_id) {
            this.isCreator = true;
            console.log('User ADALAH creator dokumen ini');
            
            // Initialize form with existing values
            this.updateFormValues();
            
            this.loading = false;
          } else {
            console.log('User bukan approver dan bukan creator - akses ditolak');
            this.denyAccessAndRedirect();
          }
        } else {
          this.showToast(`You Don't Have Access to this Document!`, 'error');
          this.loading = false;
          this.denyAccessAndRedirect();
        }
      },
      error: (error) => {
        console.error('Error saat mengambil detail dokumen:', error);
        this.errorMessage = error.message || 'Gagal memuat detail dokumen';
        this.loading = false;
        this.denyAccessAndRedirect();
      }
    });
  }

  denyAccessAndRedirect() {
    this.showToast(`You Don't Have Access to this Document!`, 'error');
    this.loading = false;
    console.log('Mengalihkan ke halaman handover-list-approver');
    this.router.navigate(['/activity-page/handover-list-approver']);
  }

  loadDocumentDirectly(id: number) {
    const url = `/handover/${id}`;
    console.log('Memuat detail dokumen:', url);

    this.service.get(url).subscribe({
      next: (response: any) => {
        console.log('Respons load dokumen:', response);

        if (response && response.status === 'success' && response.data && response.data.length > 0) {
          this.authDoc = response.data[0];
          
          // Initialize form with existing values
          this.updateFormValues();
        } else {
          this.errorMessage = 'Tidak ada data untuk dokumen ini';
          this.denyAccessAndRedirect();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error saat mengambil detail dokumen:', error);
        this.errorMessage = error.message || 'Gagal memuat detail dokumen';
        this.loading = false;
        this.showNotification('snackbar-danger', this.errorMessage, 'bottom', 'right');
        this.denyAccessAndRedirect();
      }
    });
  }

  updateFormValues() {
    if (this.authDoc) {
      this.editForm.patchValue({
        material: this.authDoc.material || '',
        remark: this.authDoc.remark || ''
      });
    }
  }

  saveChanges() {
    if (!this.editForm.valid) {
      this.showToast('Please fill all required fields correctly', 'error');
      return;
    }

    this.isSaving = true;
    
    const payload = {
      ...this.editForm.value,
      updated_by: this.GodocUser.employee_code
    };

    console.log('Saving changes with payload:', payload);

    this.service.put(`/handover/${this.docId}`, payload).pipe(
      catchError((error) => {
        this.handleError(error, 'Failed to update document');
        this.isSaving = false;
        return of(null);
      }),
      finalize(() => {
        this.isSaving = false;
      })
    ).subscribe((response: any) => {
      if (response && response.status === 'success') {
        this.showToast('Document updated successfully', 'success');
        
        // Update local document data
        if (this.authDoc) {
          this.authDoc.material = payload.material;
          this.authDoc.remark = payload.remark;
          this.authDoc.updated_by = payload.updated_by;
          this.authDoc.updated_at = new Date().toISOString();
        }
        
        // Navigate back after successful update
        setTimeout(() => {
          this.goBack();
        }, 1500);
      }
    });
  }

  cancelEdit() {
    // Ask for confirmation before canceling
    Swal.fire({
      title: 'Cancel Editing?',
      text: 'Your changes will not be saved.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, cancel edit',
      cancelButtonText: 'No, continue editing',
      confirmButtonColor: '#6c757d',
      cancelButtonColor: '#3f51b5'
    }).then((result) => {
      if (result.isConfirmed) {
        this.goBack();
      }
    });
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  showNotification(
    colorName: string,
    text: string,
    placementFrom: 'top' | 'bottom',
    placementAlign: 'left' | 'center' | 'right'
  ) {
    this._snackBar.open(text, '', {
      duration: 3000,
      verticalPosition: placementFrom,
      horizontalPosition: placementAlign,
    });
  }

  goBack() {
    window.history.back();
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'submitted':
        return 'badge bg-primary';
      case 'approved':
        return 'badge bg-success';
      case 'rejected':
        return 'badge bg-danger';
      case 'in progress':
        return 'badge bg-warning';
      default:
        return 'badge bg-secondary';
    }
  }

  showToast(message: string, type: 'error' | 'success' | 'warning' | 'info' = 'info') {
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
}