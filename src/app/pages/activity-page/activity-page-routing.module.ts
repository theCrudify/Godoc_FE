import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthorizationComponent } from './authorization/authorization.component';
import { LanguageComponent } from './language/language.component';
import { ProductComponent } from './product/product.component';
import { DocumentComponent } from './document/document.component';
import { WhitelistComponent } from './whitelist/whitelist.component';
const activityPageRoutes: Routes = [
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
  },
  {
    path: 'product',
    component: ProductComponent,
  },
  {
    path: 'documentX',
    component: DocumentComponent,
  },
  {
    path: 'whitelist',
    component: WhitelistComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(activityPageRoutes)],
  exports: [RouterModule]
})
export class ActivityPageRoutingModule { }
