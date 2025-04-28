import { Component, ViewChild, OnInit, OnDestroy } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MatTableDataSource } from "@angular/material/table";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { AppService } from "src/app/shared/service/app.service";
import { TokenStorageService } from "src/app/core/services/token-storage.service";
import { ActivatedRoute, Router } from "@angular/router";
import { DocumentMappingService } from "./document-number-mapping.service";
import { Document } from "./document-number.interface";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Location } from '@angular/common';
import { finalize, catchError, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import Swal from "sweetalert2";
import { environment } from "src/environments/environment";

@Component({
  selector: "app-create-document-number",
  templateUrl: "./create-document-number.component.html",
  styleUrls: ["./create-document-number.component.scss"],
})
export class CreateDocumentNumberComponent implements OnInit, OnDestroy {
  @ViewChild("FileDocumentModal") fileDocumentModal: any;

  // Subject for managing subscriptions
  private destroy$ = new Subject<void>();

  // Constants
  private readonly SPECIAL_DOC_TYPES = ['OTP', 'Internal Memo', 'Surat Ketentuan'];
  private readonly MAX_FILE_SIZE_MB = 5;
  private readonly VALID_FILE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
  
  // Properties
  percentage: number = 0;
  dataSourceFile = new MatTableDataSource<any>([]);
  userData: any;
  id_approval: string | undefined;
  dataApproval: any = {};
  documents: Document[] = [];
  doc_number_new: string = '';
  runningNumbers: any[] = [];
  selectedIdHeader: string = '';
  editingDocument: { [key: number]: boolean } = {};
  editedDocNumber: { [key: number]: string } = {};
  isFileUploading = false;
  displayedColumnsFile: string[] = ["no", "version", "nama_file", "actions"];
  selectedFile: File | null = null;
  status: string = '';  
  
  // Reactive form for file upload
  dataForm = new FormGroup({
    id: new FormControl(null),
    id_header: new FormControl<string | null>(null, Validators.required),
    file: new FormControl("", Validators.required),
  });
  snackBar: any;
  categoryId: any;
  plantId: any;
  areaId: any;
  sectionId: any;
  authId: any;

  constructor(
    private appService: AppService,
    private modalService: NgbModal,
    private tokenStorageService: TokenStorageService,
    private route: ActivatedRoute,
    private router: Router,
    private documentMappingService: DocumentMappingService,
    private _snackBar: MatSnackBar,
    private location: Location
  ) {}

  /**
   * Lifecycle hook - component initialization
   */
  ngOnInit() {
    this.userData = this.tokenStorageService.getUser();
    
    // Subscribe to route parameters
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.id_approval = params["id"];
        this.fetchChangeData();
      });
      
    this.documents = [];
  }

  /**
   * Lifecycle hook - component destruction
   * Clean up subscriptions to prevent memory leaks
   */
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Methods for document count calculations
  getDocumentsWithFiles(): number {
    return this.documents.filter(doc => doc.file !== null).length;
  }
  
  getDocumentsWaitingUpload(): number {
    return this.documents.filter(doc => doc.doc_number !== null && doc.file === null).length;
  }

  /**
   * Fetch the main change data for the approval
   */
  fetchChangeData() {
    // Show loading while fetching data
    this.showLoading("Memuat data perubahan...");
  
    this.appService.get(`/superproposed/${this.id_approval}`)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.stopLoading()),
        catchError(error => {
          console.error('Error fetching change data:', error);
          Swal.fire({
            title: 'Error',
            text: 'Gagal memuat data perubahan',
            icon: 'error',
            confirmButtonColor: '#4361ee'
          });
          return of(null);
        })
      )
      .subscribe((response: any) => {
        const changeData = response?.data?.[0];
        if (!changeData) return;
  
        this.dataApproval = changeData;
  
        const {
          development_code,
          document_category,
          line,
          section,
          category_id,
          plant_id,
          area_id,
          section_id,
          auth_id
        } = changeData;
  
        // Kamu bisa pakai nilai ini untuk kebutuhan lain
        this.categoryId = category_id;
        this.plantId = plant_id;
        this.areaId = area_id;
        this.sectionId = section_id;
        this.authId = auth_id;
  
        // Reset dokumen dan mapping nomor dokumen
        this.documentMappingService.resetDocuments();
        this.mappingDocNumber(line, development_code, document_category);
        this.getCreateNumber();
      });
  }
  

  /**
   * Fetch document numbers for the current approval
   */
  getCreateNumber() {
    this.appService.get(`/additionalbyid/search?proposed_change_id=${this.id_approval}`)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error fetching document numbers:', error);
          Swal.fire({
            title: 'Error', 
            text: 'Gagal memuat nomor dokumen', 
            icon: 'error',
            confirmButtonColor: '#4361ee'
          });
          return of({ data: [] });
        })
      )
      .subscribe((data: any) => {
        if (data && data.data) {
          this.processRunningNumbers(data);
          this.updateProgressIfNeeded();
          this.calculatePercentageAndUpdateAPI();
        }
      });
  }

  /**
   * Process running numbers data from API
   */
  processRunningNumbers(data: any) {
    this.runningNumbers = data.data.map((item: any) => {
      const docNumber = item.running_number.split("/")[3];
      return {
        id: item.id,
        doc_number: docNumber,
        running_number: item.running_number,
        file: item.file,
        is_internal_memo: item.is_internal_memo,
        is_surat_ketentuan: item.is_surat_ketentuan,
      };
    });

    this.updateDocumentsWithRunningNumbers();
  }

  /**
   * Update document list with running numbers
   */
  updateDocumentsWithRunningNumbers() {
    // Create a mapping for quick access by document type
    const docTypeMap = new Map();
    this.documents.forEach(doc => {
      docTypeMap.set(doc.doc_type, doc);
    });

    this.runningNumbers.forEach((runningNumber: any) => {
      // Update document based on doc_type
      const document = docTypeMap.get(runningNumber.doc_number);
      if (document) {
        this.updateDocumentInfo(document, runningNumber);
      }

      // Handle special document types
      if (runningNumber.is_internal_memo) {
        const internalMemo = docTypeMap.get("Internal Memo");
        if (internalMemo) this.updateDocumentInfo(internalMemo, runningNumber);
      }
      
      if (runningNumber.is_surat_ketentuan) {
        const suratKetentuan = docTypeMap.get("Surat Ketentuan");
        if (suratKetentuan) this.updateDocumentInfo(suratKetentuan, runningNumber);
      }
    });
  }

  /**
   * Update document information with running number data
   */
  updateDocumentInfo(document: Document, runningNumber: any) {
    document.id_header = runningNumber.id;
    document.file = runningNumber.file;
    document.doc_number = runningNumber.running_number;
  }

  /**
   * Update progress status if all files are present
   */
  updateProgressIfNeeded() {
    if (this.allFilesPresent()) {
      const progress = "Completed";
      this.updateStatus(progress);
    }
  }

  /**
   * Update the status in the API
   */
  updateStatus(progress: string) {
    this.appService.put(`/transaction/proposed-changes/status/${this.id_approval}`, {
      progress: progress
    })
    .pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Error updating status:', error);
        return of(null);
      })
    )
    .subscribe((res: any) => {
      if (res && !res.status) {
        Swal.fire({
          title: "Error", 
          text: "Gagal memperbarui status", 
          icon: "error",
          confirmButtonColor: '#4361ee'
        });
      }
    });
  }

  /**
   * Save document number after editing
   */
  saveDocNumber(documentId: number) {
    if (!this.editedDocNumber[documentId]) {
      this.showNotification("Harap input document number terlebih dahulu", 3000, 'error');
      return;
    }

    const documentToSend = this.documents.find((doc) => doc.id === documentId);
    if (!documentToSend) {
      console.error("Document not found");
      return;
    }

    // Show loading indicator
    this.showLoading("Menyimpan nomor dokumen...");

    const newDocNumber = this.editedDocNumber[documentId];
    documentToSend.doc_number = newDocNumber;
    this.doc_number_new = newDocNumber;
    this.editingDocument[documentId] = false;

    // Flags for document types
    const isInternalMemo = documentToSend.doc_type.toLowerCase() === "internal memo";
    const isSuratKetentuan = documentToSend.doc_type.toLowerCase() === "surat ketentuan";

    // Convert id_approval to integer if string
    const proposedChangeId = typeof this.id_approval === 'string' 
      ? parseInt(this.id_approval, 10) 
      : this.id_approval;

      const formData = {
        running_number: this.doc_number_new,
        klasifikasi_document: documentToSend.doc_type,
      
        category_id: this.dataApproval.category_id,
        plant_id: this.dataApproval.plant_id,
        area_id: this.dataApproval.area_id, // ✅ sesuai ID area (angka)
        line_code: this.dataApproval.line_code, // ✅ kode line seperti "GBL"
        section_code: this.dataApproval.section_code,
        department_code: this.dataApproval.department_code,
        development_code: this.dataApproval.development_code,
        id_proposed_header: this.id_approval,
        proposed_change_id: proposedChangeId,
        sub_document: documentToSend.doc_type.includes('-') 
          ? documentToSend.doc_type.split('-')[1] 
          : null,
        is_internal_memo: isInternalMemo,
        is_surat_ketentuan: isSuratKetentuan,
        created_by: this.userData.employee_code,
      };
      
    
    this.appService.post("/superproposed", { form_data: formData })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.stopLoading()),
        catchError(error => {
          console.error("Error in request:", error);
          Swal.fire({
            title: "Error", 
            text: "Terjadi kesalahan pada server", 
            icon: "error",
            confirmButtonColor: '#4361ee'
          });
          return of(null);
        })
      )
      .subscribe((res: any) => {
        if (res && res.message && res.message.includes("success")) {
          documentToSend.doc_number = this.doc_number_new;
          this.fetchChangeData();
          Swal.fire({
            title: "Sukses", 
            text: "Dokumen berhasil dibuat", 
            icon: "success",
            confirmButtonColor: '#4361ee'
          });
        } else {
          Swal.fire({
            title: "Error", 
            text: "Gagal membuat dokumen", 
            icon: "error",
            confirmButtonColor: '#4361ee'
          });
        }
      });
  }

  /**
   * Create a new document with improved user experience
   */
  async createDocument(id: number) {
    const documentToSend = this.documents.find((doc) => doc.id === id);
    if (!documentToSend) {
      this.showNotification("Dokumen tidak ditemukan", 3000, 'error');
      return;
    }

    // Verify prerequisites for OTP
    if (documentToSend.doc_type === 'OTP' && !this.arePrerequisiteDocumentsComplete(id)) {
      Swal.fire({
        title: "Perhatian", 
        text: "Dokumen sebelumnya belum lengkap. Tidak bisa membuat OTP.", 
        icon: "warning",
        confirmButtonColor: '#4361ee'
      });
      return;
    }

    // Confirm document creation
    const shouldProceed = await this.confirmAction(
      "Buat Dokumen",
      `Apakah Anda yakin ingin membuat dokumen ${documentToSend.doc_type}?`,
      "Ya, Buat Dokumen"
    );

    if (!shouldProceed) return;

    // Show loading state
    this.showLoading("Sedang membuat dokumen...");

    // Prepare new document number
    const parts = this.dataApproval.document_number.split("/");
    parts[3] = documentToSend.doc_type;
    this.doc_number_new = parts.join("/");

    // Extract sub-document if exists
    const [, part2] = documentToSend.doc_type.split("-");
    
    // Convert id_approval to integer if string
    const proposedChangeId = typeof this.id_approval === 'string' 
      ? parseInt(this.id_approval, 10) 
      : this.id_approval;

      const documentData = {
        running_number: this.doc_number_new,
        klasifikasi_document: documentToSend.doc_type,
        category_id: this.categoryId,
        plant_id: this.plantId,
        auth_id: this.authId,
        line_code: this.dataApproval.line_code,
        section_code: this.dataApproval.section_code,
        department_code: this.dataApproval.department_code,
        development_code: this.dataApproval.development_code,
        id_proposed_header: this.id_approval,
        proposed_change_id: proposedChangeId,
        sub_document: part2 || null,
        is_internal_memo: documentToSend.doc_type.toLowerCase() === "internal memo",
        is_surat_ketentuan: documentToSend.doc_type.toLowerCase() === "surat ketentuan",
        created_by: this.userData?.employee_code || 'system',
      };

    // Set status progress if not complete
    if (!this.allFilesPresent()) {
      this.updateStatus("Not Completed");
    }

    this.appService.post("/superproposed", { form_data: documentData })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.stopLoading();
        }),
        catchError(error => {
          console.error("Error in request:", error);
          Swal.fire({
            title: "Error", 
            text: "Terjadi kesalahan pada server", 
            icon: "error",
            confirmButtonColor: '#4361ee'
          });
          return of(null);
        })
      )
      .subscribe((res: any) => {
        if (res && res.message && res.message.includes("success")) {
          documentToSend.doc_number = this.doc_number_new;
          this.fetchChangeData();

          if (documentToSend.doc_type === 'OTP') {
            this.handleOtpCreationSuccess();
          } else {
            Swal.fire({
              title: "Sukses",
              text: "Dokumen berhasil dibuat",
              icon: "success",
              confirmButtonColor: '#4361ee'
            });
          }
        } else {
          Swal.fire({
            title: "Error", 
            text: "Gagal membuat dokumen", 
            icon: "error",
            confirmButtonColor: '#4361ee'
          });
        }
      });
  }

  /**
   * Check if all prerequisites are complete for OTP creation
   */
  arePrerequisiteDocumentsComplete(documentId: number): boolean {
    const indexOfOtp = this.documents.findIndex(doc => doc.id === documentId);
    return this.documents.slice(0, indexOfOtp).every(doc =>
      doc.doc_number !== null &&
      doc.id_header !== null &&
      doc.file !== null
    );
  }

  /**
   * Handle successful OTP document creation
   */
  handleOtpCreationSuccess() {
    Swal.fire({
      title: "Dokumen OTP Berhasil Dibuat",
      text: "Klik OK untuk melanjutkan ke formulir otorisasi.",
      icon: "success",
      showCancelButton: true,
      confirmButtonText: "OK",
      cancelButtonText: "Batal",
      confirmButtonColor: '#4361ee',
      cancelButtonColor: '#6c757d',
    }).then((result) => {
      if (result.isConfirmed) {
        this.redirectToOtorisasi(this.id_approval);
      }
    });
  }

  /**
   * Determine if the authorization button should be shown
   */
  shouldShowAuthorizationButton(): boolean {
    return this.documents.some(doc => doc.doc_type === "OTP" && doc.doc_number !== null);
  }

  /**
   * Helper to convert string to lowercase
   */
  toLowerCase(str: string): string {
    return str.toLowerCase();
  }

  /**
   * Start editing document number
   */
  startEditing(documentId: number, currentDocNumber: string) {
    this.editingDocument[documentId] = true;
    this.editedDocNumber[documentId] = currentDocNumber;
  }

  /**
   * Cancel editing document number
   */
  cancelEditing(documentId: number) {
    this.editingDocument[documentId] = false;
    this.editedDocNumber[documentId] = 
      this.documents.find((doc) => doc.id === documentId)?.doc_number || "";
  }

  /**
   * Map document numbers using the mapping service
   */
  mappingDocNumber(line: string, development_code: string, document_category: string) {
    this.documents = this.documentMappingService.getDocuments(
      line, development_code, document_category
    );
  }

  /**
   * Copy document number to clipboard
   */
  // copyToClipboard(text: string) {
  //   navigator.clipboard.writeText(text)
  //     .then(() => {
  //       this.showNotification("Document number telah berhasil di salin");
  //     })
  //     .catch(err => {
  //       console.error('Could not copy text: ', err);
  //       // Fallback for browsers without Clipboard API support
  //       const el = document.createElement("textarea");
  //       el.value = text;
  //       document.body.appendChild(el);
  //       el.select();
  //       document.execCommand("copy");
  //       document.body.removeChild(el);
  //       this.showNotification("Document number telah berhasil di salin");
  //     });
  // }

  copyToClipboard(text: string) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
        .then(() => {
          this.showToast("Document number berhasil disalin");
        })
        .catch(err => {
          console.error('Clipboard gagal: ', err);
          this.fallbackCopyText(text);
        });
    } else {
      this.fallbackCopyText(text);
    }
  }

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
  
  fallbackCopyText(text: string) {
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    this.showToast("Document number berhasil disalin");
  }
  

  /**
   * Get category ID from name
   */
  getCategoryIdFromName(categoryName: string): number {
    const categoryMap: { [key: string]: number } = {
      "New Equipment": 2,
      "Change Parts": 3,
      "Maintenance": 4
    };
    return categoryMap[categoryName] || 0;
  }

  /**
   * Get plant ID from name
   */
  getPlantIdFromName(plantName: string): number {
    const plantMap: { [key: string]: number } = {
      "Pabrik Kejayan": 3,
      "Pabrik Sukabumi": 2,
      "HO Otsuka": 1
    };
    return plantMap[plantName] || 0;
  }

  /**
   * Navigate back
   */
  goBack() {
    this.location.back();
  }

  /**
   * Open material modal for file upload
   */
  openMateriModal(content: any, idHeader: any = null) {
    this.selectedIdHeader = idHeader || '';
    this.dataForm.patchValue({ id_header: this.selectedIdHeader });
    this.modalService.open(content);
  }

  /**
   * Redirect to authorization page
   */
  redirectToOtorisasi(id: any) {
    if (!id) return;
    this.router.navigate([`/activity-page/add-authorization/${id}`]);
  }

  /**
   * Handle file selection
   */
  onFileSelected(event: any, formControlName: string) {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    
    const file = event.target.files[0];
    
    // Validate file type
    if (!this.VALID_FILE_TYPES.includes(file.type)) {
      Swal.fire({
        title: "Error", 
        text: "Tipe file tidak valid. Hanya file PNG, JPG, dan PDF yang diperbolehkan.", 
        icon: "error",
        confirmButtonColor: '#4361ee'
      });
      return;
    }
    
    // Validate file size (max 5 MB)
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > this.MAX_FILE_SIZE_MB) {
      Swal.fire({
        title: "Error", 
        text: `Ukuran file terlalu besar. Maksimal ${this.MAX_FILE_SIZE_MB} MB.`, 
        icon: "error",
        confirmButtonColor: '#4361ee'
      });
      return;
    }
    
    // Save file for upload
    this.selectedFile = file;
    this.dataForm.get(formControlName)?.setValue(file.name);
  }

  /**
   * Handle form submission for file upload
   */
  onFormSubmit(event: Event) {
    event.preventDefault();
    
    // Validate ID header
    if (!this.dataForm.value.id_header) {
      this.dataForm.patchValue({ id_header: this.selectedIdHeader });
      if (!this.selectedIdHeader) {
        Swal.fire({
          title: "Error",
          text: "ID dokumen tidak valid",
          icon: "error",
          confirmButtonColor: '#4361ee'
        });
        return;
      }
    }
    
    // Validate file
    if (!this.selectedFile) {
      Swal.fire({
        title: "Error",
        text: "File belum dipilih",
        icon: "error",
        confirmButtonColor: '#4361ee'
      });
      return;
    }
  
    this.isFileUploading = true;
    
    // Show loading state with progress
    Swal.fire({
      title: 'Mengupload File',
      html: 'Harap tunggu...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    // Prepare FormData
    const formData = new FormData();
    formData.append("file", this.selectedFile);
    
    // Ensure tr_additional_doc_id is a valid string
    const docId = this.dataForm.value.id_header || this.selectedIdHeader;
    if (docId) {
      formData.append("tr_additional_doc_id", docId.toString());
    } else {
      Swal.fire({
        title: "Error", 
        text: "ID dokumen tidak valid", 
        icon: "error",
        confirmButtonColor: '#4361ee'
      });
      this.isFileUploading = false;
      return;
    }
    
    // Ensure employee_code is a string
    if (this.userData && this.userData.employee_code) {
      formData.append("created_by", this.userData.employee_code.toString());
    }
  
    // Send to API
    this.appService.postFile("/documents/upload", formData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isFileUploading = false;
          Swal.close();
        }),
        catchError(error => {
          console.error('Error uploading file:', error);
          Swal.fire({
            title: "Error",
            text: "Terjadi kesalahan pada server",
            icon: "error",
            confirmButtonColor: '#4361ee'
          });
          return of(null);
        })
      )
      .subscribe((res: any) => {
        if (res && res.status) {
          this.fetchChangeData();
          Swal.fire({
            title: "Sukses",
            text: "File berhasil diupload",
            icon: "success",
            confirmButtonColor: '#4361ee'
          });
          this.modalService.dismissAll();
          
          // Reset form
          this.dataForm.reset();
          this.selectedFile = null;
          
          // Update percentage after upload
          this.calculatePercentageAndUpdateAPI();
        } else {
          Swal.fire({
            title: "Error",
            text: res?.message || "Gagal mengupload file",
            icon: "error",
            confirmButtonColor: '#4361ee'
          });
        }
      });
  }

  /**
   * Calculate percentage completion and update API
   */
  calculatePercentageAndUpdateAPI() {
    // Filter valid documents (excluding special types)
    const validDocuments = this.documents.filter(doc =>
      !this.SPECIAL_DOC_TYPES.includes(doc.doc_type)
    );

    const totalDocuments = validDocuments.length;
    const documentsWithFileCount = validDocuments.filter(doc => doc.file !== null).length;

    // Calculate percentage
    this.percentage = totalDocuments > 0 
      ? Math.round((documentsWithFileCount / totalDocuments) * 100)
      : 0;
  }

  /**
   * View document file
   */
  lihatFile(id: any): void {
    // Ensure id is valid
    if (!id) {
      Swal.fire({
        title: "Error", 
        text: "ID dokumen tidak valid", 
        icon: "error",
        confirmButtonColor: '#4361ee'
      });
      return;
    }
    
    const docId = id.toString();
    
    this.appService.get(`/document/files?tr_additional_doc_id=${docId}`)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error("Error fetching files:", error);
          Swal.fire({
            title: "Error", 
            text: "Gagal memuat file", 
            icon: "error",
            confirmButtonColor: '#4361ee'
          });
          return of({ status: false, data: [] });
        })
      )
      .subscribe((res: any) => {
        if (res.status && res.data && res.data.length > 0) {
          if (res.data.length === 1) {
            // Directly view file if only one exists
            this.viewFile(res.data[0].id);
          } else {
            // Show modal if multiple files exist
            this.openMateriModalDownload(this.fileDocumentModal, docId);
          }
        } else {
          Swal.fire({
            title: "Info", 
            text: "Tidak ada file yang tersedia", 
            icon: "info",
            confirmButtonColor: '#4361ee'
          });
        }
      });
  }
  
  /**
   * Open modal to show file list for download
   */
  openMateriModalDownload(content: any, id: any) {
    if (!id) return;
    
    const docId = id.toString();
    
    this.appService.get(`/document/files?tr_additional_doc_id=${docId}`)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error("Error fetching files for modal:", error);
          return of({ status: false, data: [] });
        })
      )
      .subscribe((res: any) => {
        if (res.status && res.data) {
          const mappedData = res.data.map((item: any, index: number) => ({
            ...item,
            version: `Version ${item.version || (index + 1)}`,
            nama_file: item.file,
            no: index + 1
          }));
          this.dataSourceFile = new MatTableDataSource<any>(mappedData);
        } else {
          this.dataSourceFile = new MatTableDataSource<any>([]);
        }
        
        this.modalService.open(content, { size: "lg", windowClass: "modal-lg" });
      });
  }

  /**
   * Download file
   */
  downloadFile(id: any): void {
    if (!id) return;
  
    const fileId = id.toString();
    this.showLoading("Mengunduh file...");
    
    this.appService.downloadFile(`/document/files/download/${fileId}`)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.stopLoading()),
        catchError(error => {
          console.error('Download error:', error);
          Swal.fire({
            title: "Error", 
            text: "Gagal mengunduh file", 
            icon: "error",
            confirmButtonColor: '#4361ee'
          });
          return of(null);
        })
      )
      .subscribe((response: any) => {
        if (!response) return;
  
        // Jika response berisi body + headers, pastikan atur dengan benar
        const blob = new Blob([response.body || response], { type: 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
  
        // Ambil nama file dari headers jika tersedia
        const contentDisposition = response.headers?.get?.('content-disposition');
        const filename = contentDisposition ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') : `file-${fileId}`;
        
        anchor.download = filename || `file-${fileId}`;
        anchor.click();
        window.URL.revokeObjectURL(url);
      });
  }
  
  /**
   * View file in new window
   */
  viewFile(id: any): void {
    if (!id) return;
    
    // Ensure id is a valid value
    const fileId = id.toString();
    
    // Use direct URL to view file
    const fileUrl = `${environment.apiUrl}/document/files/view/${fileId}`;
    window.open(fileUrl, '_blank');
  }

  /**
   * Check if all required files are present
   */
  allFilesPresent(): boolean {
    // Check if all required documents have files
    return this.documents.filter(doc => 
      !this.SPECIAL_DOC_TYPES.includes(doc.doc_type)
    ).every(doc => doc.file !== null);
  }

  /**
   * Format column name for display
   */
  formatColumn(input: string): string {
    if (!input) return "";
    
    return input.split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  /**
   * Handle file deletion
   */
  onDelete(item: any) {
    if (!item || !item.id) return;
    
    Swal.fire({
      title: "Konfirmasi Hapus",
      text: "Apakah Anda yakin ingin menghapus file ini?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteItem(item);
      }
    });
  }

  /**
   * Delete file from server
   */
  deleteItem(item: any) {
    const id = item.id;
    this.showLoading("Menghapus file...");
    
    this.appService.delete(`document/create-document-file/${id}`)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.stopLoading()),
        catchError(error => {
          console.error('Delete error:', error);
          Swal.fire({
            title: "Error", 
            text: "Gagal menghapus file", 
            icon: "error",
            confirmButtonColor: '#4361ee'
          });
          return of(null);
        })
      )
      .subscribe((res: any) => {
        if (res) {
          this.dataSourceFile.data = this.dataSourceFile.data.filter(i => i.id !== id);
          Swal.fire({
            title: "Sukses", 
            text: "File berhasil dihapus", 
            icon: "success",
            confirmButtonColor: '#4361ee'
          });
        }
      });
  }

  /**
   * Clear document file list
   */
  clearDocumentFile() {
    this.dataSourceFile = new MatTableDataSource<any>([]);
  }

  /**
   * Get document icon based on type
   */
  getDocumentIcon(docType: string): string {
    // Map document types to appropriate icons
    const iconMap: { [key: string]: string } = {
      'OTP': 'bx bx-file-blank',
      'Internal Memo': 'bx bx-note',
      'Surat Ketentuan': 'bx bx-envelope',
      'FCD': 'bx bx-file',
      'FSP': 'bx bx-file-find',
      'PM Checklist': 'bx bx-check-square',
      'Risk Assessment': 'bx bx-shield-quarter',
      'SOP': 'bx bx-book-content'
    };

    // Default icon if not in mapping
    return iconMap[docType] || 'bx bx-file';
  }

  /**
   * Get icon based on file type
   */
  getFileIcon(fileName: string): string {
    if (!fileName) return 'bx bx-file';
    
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    // Map file extensions to icons
    const iconMap: { [key: string]: string } = {
      'pdf': 'bx bx-file-pdf',
      'jpg': 'bx bx-image',
      'jpeg': 'bx bx-image',
      'png': 'bx bx-image',
      'doc': 'bx bx-file-doc',
      'docx': 'bx bx-file-doc',
      'xls': 'bx bx-file-excel',
      'xlsx': 'bx bx-file-excel',
      'txt': 'bx bx-file-txt'
    };
    
    return extension && iconMap[extension] ? iconMap[extension] : 'bx bx-file';
  }

  /**
   * Show notification with enhanced styling
   */
  showNotification(message: string, duration: number = 3000, type: 'success' | 'error' | 'info' = 'success') {
    let panelClass = ['modern-snackbar'];
    
    switch (type) {
      case 'success':
        panelClass.push('success-snackbar');
        break;
      case 'error':
        panelClass.push('error-snackbar');
        break;
      case 'info':
        panelClass.push('info-snackbar');
        break;
    }
    
    this._snackBar.open(message, "Tutup", {
      duration: duration,
      verticalPosition: 'bottom',
      horizontalPosition: 'center',
      panelClass: panelClass
    });
  }

  /**
   * Show confirmation dialog
   */
  confirmAction(title: string, text: string, confirmText: string = 'Ya', cancelText: string = 'Batal'): Promise<boolean> {
    return new Promise((resolve) => {
      Swal.fire({
        title: title,
        text: text,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        confirmButtonColor: '#4361ee',
        cancelButtonColor: '#6c757d',
      }).then((result) => {
        resolve(result.isConfirmed);
      });
    });
  }

  /**
   * Show loading state
   */
  showLoading(message: string = 'Sedang memproses...') {
    Swal.fire({
      title: 'Harap Tunggu',
      html: message,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  }

  /**
   * Stop loading state
   */
  stopLoading() {
    Swal.close();
  }
}