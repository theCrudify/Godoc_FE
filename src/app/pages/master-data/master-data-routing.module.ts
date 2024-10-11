import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthorizationComponent } from './authorization/authorization.component';
import { LanguageComponent } from './language/language.component';
const masterDataRoutes: Routes = [
  // {
  //   path: 'signin', loadChildren: () => import('./auth/signin/signin.module').then(m => m.SigninModule)
  // },
  {
    path: 'authorization',
    component: AuthorizationComponent,
  },
  {
    path: 'language',
    component: LanguageComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(masterDataRoutes)],
  exports: [RouterModule]
})
export class MasterDataRoutingModule { }
