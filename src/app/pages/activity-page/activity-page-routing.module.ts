import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DocumentListComponent } from './documents/document-list/document-list.component';
import { DocumentCreateComponent } from './documents/document-create/document-create.component';
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
];

@NgModule({
  imports: [RouterModule.forChild(activityPageRoutes)],
  exports: [RouterModule]
})
export class ActivityPageRoutingModule { }
