import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthorizationComponent } from './authorization/authorization.component';
import { LanguageComponent } from './language/language.component';
import { ProductComponent } from './product/product.component';
import { SiteComponent } from './site/site.component';
import { WhitelistComponent } from './whitelist/whitelist.component';
import { CountryComponent } from './country/country.component';
import { DepartmentComponent } from './department/department.component';
import { UserComponent } from './user/user.component';
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
  },
  {
    path: 'product',
    component: ProductComponent,
  },
 
  {
    path: 'whitelist',
    component: WhitelistComponent,
  },

  {
    path: 'site',
    component: SiteComponent,
  },
  {
    path: 'country',
    component: CountryComponent,
  },
  {
    path: 'department',
    component: DepartmentComponent,
  },
  {
    path: 'user',
    component: UserComponent,
  },

  

];

@NgModule({
  imports: [RouterModule.forChild(masterDataRoutes)],
  exports: [RouterModule]
})
export class MasterDataRoutingModule { }
