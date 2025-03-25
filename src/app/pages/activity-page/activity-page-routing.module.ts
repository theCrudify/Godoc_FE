import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListDocumentNumberComponent } from './01-document-numbers/list-document-number/list-document-number.component';


const activityPageRoutes: Routes = [
  // {
  //   path: 'signin', loadChildren: () => import('./auth/signin/signin.module').then(m => m.SigninModule)
  // },

  //Activity









  {
    path: "document-number",
    component: ListDocumentNumberComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(activityPageRoutes)],
  exports: [RouterModule]
})
export class ActivityPageRoutingModule { }
