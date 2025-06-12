import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthorizationComponent } from './authorization/authorization.component';
import { LineComponent } from './line/line.component';

import { DepartmentComponent } from './department/department.component';
import { SectionDepartmentComponent } from './section-department/section-department.component';
import { AreaComponent } from '../charts/Apexcharts/area/area.component';
import { MasterAreaComponent } from './master-area/master-area.component';
import { MasterHeadSectionComponent } from './master-head-section/master-head-section.component';
import { MasterHeadDepartmentComponent } from './master-head-department/master-head-department.component';
import { MasterSupportDocComponent } from './master-support-doc/master-support-doc.component';
import { MasterSubdocumentComponent } from './master-subdocument/master-subdocument.component';
import { MasterDevelopmentComponent } from './master-development/master-development.component';
import { MasterDoctypeComponent } from './master-doctype/master-doctype.component';
import { MasterDocCategoriesComponent } from './master-doc-categories/master-doc-categories.component';
import { MasterApproverProposedComponent } from './master-approver-proposed/master-approver-proposed.component';
const masterDataRoutes: Routes = [
  // {
  //   path: 'signin', loadChildren: () => import('./auth/signin/signin.module').then(m => m.SigninModule)
  // },
    {
    path: 'approverv1',
    component: MasterApproverProposedComponent,
  },

  {
    path: 'authorization',
    component: AuthorizationComponent,
  },
  {
    path: 'department',
    component: DepartmentComponent,
  },
  {
    path: 'section-department',
    component: SectionDepartmentComponent,
  },
  {
    path: 'line',
    component: LineComponent,
  },

  {
    path: 'head-section',
    component: MasterHeadSectionComponent,
  },

  {
    path: 'head-department',
    component: MasterHeadDepartmentComponent,
  },



  {
    path: 'master-area',
    component: MasterAreaComponent,
  },

  {
    path: 'master-support-doc',
    component: MasterSupportDocComponent,
  },


  {
    path: 'master-subdoc',
    component: MasterSubdocumentComponent,
  },

  {
    path: 'master-development',
    component: MasterDevelopmentComponent,
  },

  {
    path: 'master-doctype',
    component: MasterDoctypeComponent,
  },

  {
    path: 'master-doccategories',
    component: MasterDocCategoriesComponent,
  },
  


];

@NgModule({
  imports: [RouterModule.forChild(masterDataRoutes)],
  exports: [RouterModule]
})
export class MasterDataRoutingModule { }
