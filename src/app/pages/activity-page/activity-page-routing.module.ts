import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListDocumentNumberComponent } from './01-document-numbers/list-document-number/list-document-number.component';
import { DocumentNumberComponent } from './01-document-numbers/document-number/document-number.component';
import { DetailProposedChangesComponent } from './02-proposed-changes/detail-proposed-changes/detail-proposed-changes.component';
import { EditProposedChangesComponent } from './02-proposed-changes/edit-proposed-changes/edit-proposed-changes.component';
import { FormComponent } from './02-proposed-changes/form/form.component';

//Main List Proposed Chnages
import { ProposedChangesListComponent } from './02-proposed-changes/list/list.component';
import { ApprovalModalComponent } from './02-proposed-changes/list/modal/approval/approval-modal.component';
import { HistoryModalComponent } from './02-proposed-changes/list/modal/history/history-modal.component';
import { ListApprovalProposedchangesComponent } from './02-approval-proposed-changes/list-approval-proposedchanges/list-approval-proposedchanges.component';
import { FormApprovalProposedchangesComponent } from './02-approval-proposed-changes/form-approval-proposedchanges/form-approval-proposedchanges.component';
import { CreateDocumentNumberComponent } from './02-proposed-changes/create-document-number/create-document-number.component';
import { AuthorizationCreateComponent } from './03-authorization-doc/authorization-create/authorization-create.component';
import { AuthorizationListComponent } from './03-authorization-doc/authorization-list/authorization-list.component';
import { AuthorizationDetailComponent } from './03-authorization-doc/authorization-detail/authorization-detail.component';
import { AuthorizationEditComponent } from './03-authorization-doc/authorization-edit/authorization-edit.component';
import { AuthorizationListApproverComponent } from './03-authorization-doc-approver/authorization-list-approver/authorization-list-approver.component';
import { handoverCreateComponent } from './04-handover-doc/handover-create/handover-create.component';
import { handoverListApproverComponent } from './04-handover-doc-approver/handover-list-approver/handover-list-approver.component';
import { handoverEditComponent } from './04-handover-doc/handover-edit/handover-edit.component';
import { handoverDetailComponent } from './04-handover-doc/handover-detail/handover-detail.component';
import { handoverListComponent } from './04-handover-doc/handover-list/handover-list.component';
import { handoverApproverComponent } from './04-handover-doc/handover-approver/handover-approver.component';
import { completionListComponent } from './05-completion/completion-list/completion-list.component';
import { ratingcompletionComponent } from './05-completion/ratingcompletion/ratingcompletion';


const activityPageRoutes: Routes = [
  // {
  //   path: 'signin', loadChildren: () => import('./auth/signin/signin.module').then(m => m.SigninModule)
  // },

  //Activity
  {
    path: "document-number",
    component: ListDocumentNumberComponent,
  },
  {
    path: "form-number",
    component: DocumentNumberComponent,
  },
  {
    path: "proposedchanges-detail/:id",  // Tambahkan parameter :id di sini
    component: DetailProposedChangesComponent,
  },
  {
    path: "proposedchanges-edit/:id",   // Tambahkan parameter :id di sini juga
    component: EditProposedChangesComponent,
  },
  {
    path: "proposedchanges-form",
    component: FormComponent,
  },
  {
    path: "proposedchanges-list",
    component: ProposedChangesListComponent,
  },

  // Sesi Approval Proposed Changes
  {
    path: "list-approval-pc",
    component: ListApprovalProposedchangesComponent,
  },
  {
    path: "approval-detail/:id",  // Tambahkan parameter :id di sini
    component: FormApprovalProposedchangesComponent,
  },


  //Additional Documents
  {
    path: "create-add-number/:id",
    component: CreateDocumentNumberComponent,
  },
  //Authorization
  {
    path: "add-authorization/:id",
    component: AuthorizationCreateComponent,
  },

  {
    path: "authorization-list",
    component: AuthorizationListComponent,
  },

  {
    path: "authorization-detail/:id",  // Tambahkan parameter :id di sini
    component: AuthorizationDetailComponent,
  },

  {
    path: "authorization-edit/:id",  // Tambahkan parameter :id di sini 
    component: AuthorizationEditComponent,
  },

  {
    path: "authorization-list-approver",
    component: AuthorizationListApproverComponent,
  },

  //Authorization
  {
    path: "add-handover",
    component: handoverCreateComponent,
  },

  {
    path: "handover-list",
    component: handoverListComponent,
  },

  {
    path: "handover-detail/:id",  // Tambahkan parameter :id di sini
    component: handoverDetailComponent,
  },

  {
    path: "handover-approver/:id",  // Tambahkan parameter :id di sini
    component: handoverApproverComponent,
  },

  {
    path: "handover-edit/:id",  // Tambahkan parameter :id di sini 
    component: handoverEditComponent,
  },

  {
    path: "handover-list-approver",
    component: handoverListApproverComponent,
  },

  {
    path: "completion-list",
    component: completionListComponent,
  },

  {
    path: "rating-list",
    component: ratingcompletionComponent,
  },



];

@NgModule({
  imports: [RouterModule.forChild(activityPageRoutes)],
  exports: [RouterModule]
})
export class ActivityPageRoutingModule { }