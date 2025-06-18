import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  NgbNavModule,
  NgbDropdownModule,
  NgbAccordionModule,
  NgbTooltipModule, // Ini dari ng-bootstrap
  NgbPaginationModule,
} from '@ng-bootstrap/ng-bootstrap';

// Swiper Slider (dibiarkan terkomentar jika tidak dipakai)
// import { NgxUsefulSwiperModule } from 'ngx-useful-swiper';

// Select Drop down
import { NgSelectModule } from '@ng-select/ng-select';

// Flatpicker
import { FlatpickrModule } from 'angularx-flatpickr';

// Feather Icon
import { FeatherModule } from 'angular-feather';
import { allIcons } from 'angular-feather/icons';

// Ng Search (Jika masih digunakan)
// import { Ng2SearchPipeModule } from 'ng2-search-filter';

// Load Icon
import { defineElement } from 'lord-icon-element';
import lottie from 'lottie-web';
import { MasterDataModule } from '../master-data/master-data.module';  // Impor MasterDataModule

import { NgxLoadingModule } from 'ngx-loading';
import { SharedModule } from '../../shared/shared.module';
import { ActivityPageRoutingModule } from './activity-page-routing.module';
import { ListDocumentNumberComponent } from './01-document-numbers/list-document-number/list-document-number.component';
import { DocumentNumberComponent } from './01-document-numbers/document-number/document-number.component';
import { DetailProposedChangesComponent } from './02-proposed-changes/detail-proposed-changes/detail-proposed-changes.component';
import { EditProposedChangesComponent } from './02-proposed-changes/edit-proposed-changes/edit-proposed-changes.component';
import { FormComponent } from './02-proposed-changes/form/form.component';
import { ProposedChangesListComponent } from './02-proposed-changes/list/list.component';
import { ApprovalModalComponent } from './02-proposed-changes/list/modal/approval/approval-modal.component';
import { HistoryModalComponent } from './02-proposed-changes/list/modal/history/history-modal.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
// --- IMPORT ANGULAR MATERIAL YANG DIBUTUHKAN ---
import { MatTooltipModule } from '@angular/material/tooltip';       // Untuk [matTooltip]
// Diperlukan oleh MatDatepickerModule
// import { MatMomentDateModule } from '@angular/material-moment-adapter'; // Alternatif jika pakai Moment.js
import { MatTableModule } from '@angular/material/table';           // Untuk <table mat-table>, [dataSource], matColumnDef
import { MatPaginatorModule } from '@angular/material/paginator';   // Untuk <mat-paginator>
import { MatSortModule } from '@angular/material/sort';             // Untuk atribut matSort pada table
import { MatButtonModule } from '@angular/material/button';         // Kemungkinan perlu untuk tombol lain
import { MatIconModule } from '@angular/material/icon';             // Kemungkinan perlu untuk ikon suffix atau <mat-icon>
import { ListApprovalProposedchangesComponent } from './02-approval-proposed-changes/list-approval-proposedchanges/list-approval-proposedchanges.component';
import { FormApprovalProposedchangesComponent } from './02-approval-proposed-changes/form-approval-proposedchanges/form-approval-proposedchanges.component';
import { CreateDocumentNumberComponent } from './02-proposed-changes/create-document-number/create-document-number.component';
import { AuthorizationCreateComponent } from './03-authorization-doc/authorization-create/authorization-create.component';
import { AuthorizationListComponent } from './03-authorization-doc/authorization-list/authorization-list.component';
import { OtoHistoryModalComponent } from './03-authorization-doc/authorization-list/modal/history/otohistory-modal.component';
import { OtoApprovalModalComponent } from './03-authorization-doc/authorization-list/modal/approval/otoapproval-modal.component';
import { AuthorizationDetailComponent } from './03-authorization-doc/authorization-detail/authorization-detail.component';
import { AuthorizationEditComponent } from './03-authorization-doc/authorization-edit/authorization-edit.component';
import { AuthorizationListApproverComponent } from './03-authorization-doc-approver/authorization-list-approver/authorization-list-approver.component';
import { handoverCreateComponent } from './04-handover-doc/handover-create/handover-create.component';
import { handoverDetailComponent } from './04-handover-doc/handover-detail/handover-detail.component';
import { handoverEditComponent } from './04-handover-doc/handover-edit/handover-edit.component';
import { handoverListApproverComponent } from './04-handover-doc-approver/handover-list-approver/handover-list-approver.component';
import { handoverListComponent } from './04-handover-doc/handover-list/handover-list.component';
import { HistoryHandoverModalComponent } from './04-handover-doc/handover-list/modal/history/historyhandover-modal.component';
import { ApprovalHandoverComponent } from './04-handover-doc/handover-list/modal/approval/handover-modal.component';
import { handoverApproverComponent } from './04-handover-doc/handover-approver/handover-approver.component';
import { completionListComponent } from './05-completion/completion-list/completion-list.component';
import { ApprovalCompletionComponent } from './05-completion/completion-list/modal/approval/completionapproval-modal.component';
import { HistoryCompletionModalComponent } from './05-completion/completion-list/modal/history/completionhandover-modal.component';
import { ratingcompletionComponent } from './05-completion/ratingcompletion/ratingcompletion';
import { RatingModalComponent } from './05-completion/ratingcompletion/rating-modal.component';
import { completionAdminComponent } from './05-completion/completion-admin/completion-admin.component';
import { NotfoundComponent } from './notfound/notfound.component';
import { AdminProposedChangesListComponent } from './02-proposed-changes/admin/listadmin.component';
import { AdminAuthorizationListComponent } from './03-authorization-doc/admin/adminauthorization-list.component copy';
import { AdminhandoverListComponent } from './04-handover-doc/admin/adminhandover.component';
import { ApproverChangeModalComponent } from './02-proposed-changes/list/modal/approver-change/approver-change-modal.component';
import { AdminBypassModalComponent } from './02-proposed-changes/list/modal/admin-bypass/admin-bypass-modal.component';
import { PendingRequestsComponent } from './02-proposed-changes/admin/pending-request/pending-requests.component';
import { ApprovalRequestsComponent } from './02-proposed-changes/admin/approval-requests/approval-requests.component';
import { ApprovalRequestsDetailComponent } from './02-proposed-changes/admin/approval-requests-detail/approval-requests-detail.component';

@NgModule({
  declarations: [
    //Activity
    ListDocumentNumberComponent,
    DocumentNumberComponent,
    ProposedChangesListComponent,
    FormComponent,
    EditProposedChangesComponent,
    DetailProposedChangesComponent,

    ListApprovalProposedchangesComponent,
    FormApprovalProposedchangesComponent,
    CreateDocumentNumberComponent,

    //Authorization
    AuthorizationCreateComponent,
    AuthorizationListComponent,
    AuthorizationDetailComponent,
    AuthorizationEditComponent,

    //AuthorizationApprover
    AuthorizationListApproverComponent,


    //Modal ProposedChanges
    ApprovalModalComponent,
    HistoryModalComponent,

    //Modal Otorisasi
    OtoApprovalModalComponent,
    OtoHistoryModalComponent,


    handoverCreateComponent,
    handoverDetailComponent,
    handoverEditComponent,
    handoverListApproverComponent,
    handoverListComponent,
    handoverApproverComponent,

    HistoryHandoverModalComponent,
    ApprovalHandoverComponent,

    completionListComponent,
    ApprovalCompletionComponent,
    HistoryCompletionModalComponent,
    ratingcompletionComponent,
    RatingModalComponent,
    completionAdminComponent,


    NotfoundComponent,
    AdminProposedChangesListComponent,
    AdminAuthorizationListComponent,
    AdminhandoverListComponent,
    ApproverChangeModalComponent,
    AdminBypassModalComponent,
    PendingRequestsComponent,
    ApprovalRequestsComponent,


    // Proposed Changes Admin
    AdminProposedChangesListComponent,
    ApprovalRequestsComponent, // ← New component added here
    ApprovalRequestsDetailComponent, // ← New detail component added here


  ],
  imports: [
    // Modul Inti & Pihak Ketiga Awal
    CommonModule, // Cukup sekali
    ActivityPageRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    NgbNavModule,
    NgbDropdownModule,
    NgbAccordionModule,
    NgbTooltipModule, // <-- Ini NgbTooltip, bukan MatTooltip
    NgbPaginationModule,
    NgSelectModule,
    FlatpickrModule.forRoot(),
    FeatherModule.pick(allIcons),
    SharedModule,
    NgxLoadingModule.forRoot({}),
    MasterDataModule,
    // Ng2SearchPipeModule, // Aktifkan jika masih dipakai

    // --- MODUL ANGULAR MATERIAL YANG DITAMBAHKAN ---
    MatTooltipModule,       // Mengatasi error [matTooltip]
    MatFormFieldModule,     // Mengatasi error <mat-form-field>, <mat-label>, <mat-hint>
    MatInputModule,         // Biasanya dibutuhkan bersama MatFormFieldModule
    MatDatepickerModule,    // Mengatasi error datepicker & range picker elements/bindings
    MatNativeDateModule,    // Penyedia adaptasi tanggal default untuk MatDatepickerModule
    // MatMomentDateModule, // Gunakan ini jika Anda memakai Moment.js untuk tanggal
    MatTableModule,         // Mengatasi error <table mat-table>, [dataSource], matColumnDef
    MatPaginatorModule,     // Mengatasi error <mat-paginator> & bindings
    MatSortModule,          // Mengatasi error [matSort]
    MatButtonModule,        // Tambahkan jika diperlukan untuk <button mat-button> dll.
    MatIconModule           // Tambahkan jika diperlukan untuk <mat-icon> atau matIconSuffix
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA] // Bisa dicoba dihapus jika semua komponen sudah dikenali, tapi aman untuk dibiarkan
})
export class ActivityPageModule {
  constructor() {
    // Define lord-icon element (biasanya cukup dilakukan sekali di AppModule)
    // Pastikan ini tidak menyebabkan error jika sudah di-define di tempat lain
    try {
      defineElement(lottie.loadAnimation);
    } catch (e) {
      // Mungkin sudah didefinisikan, abaikan error
      // console.warn('Lord Icon element already defined or error defining:', e);
    }
  }
}