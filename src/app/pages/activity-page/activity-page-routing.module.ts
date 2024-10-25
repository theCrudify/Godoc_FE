import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DocumentListComponent } from './documents/document-list/document-list.component';
import { DocumentCreateComponent } from './documents/document-create/document-create.component';
import { DocumentDetailComponent } from './documents/document-detail/document-detail.component';
import { ApprovalFormComponent } from './approvals/approval-form/approval-form.component';
const activityPageRoutes: Routes = [
  // {
  //   path: 'signin', loadChildren: () => import('./auth/signin/signin.module').then(m => m.SigninModule)
  // },

  //Activity

  {
    path: 'document-list',
    component: DocumentListComponent,
  },
 
  {
    path: 'document-create',
    component: DocumentCreateComponent,
  },

  {
    path: 'document-detail',
    component: DocumentDetailComponent,
  },
















  {
    path: 'approval-form',
    component: ApprovalFormComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(activityPageRoutes)],
  exports: [RouterModule]
})
export class ActivityPageRoutingModule { }
