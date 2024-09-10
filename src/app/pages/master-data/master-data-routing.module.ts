import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthorizationComponent } from './authorization/authorization.component';
const masterDataRoutes: Routes = [
  // {
  //   path: 'signin', loadChildren: () => import('./auth/signin/signin.module').then(m => m.SigninModule)
  // },
  {
    path: 'authorization',
    component: AuthorizationComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(masterDataRoutes)],
  exports: [RouterModule]
})
export class MasterDataRoutingModule { }
