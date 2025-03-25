import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  NgbNavModule,
  NgbDropdownModule,
  NgbAccordionModule,
  NgbTooltipModule,
  NgbPaginationModule,
} from '@ng-bootstrap/ng-bootstrap';

// Swiper Slider
// import { NgxUsefulSwiperModule } from 'ngx-useful-swiper';

// Select Drop down
import { NgSelectModule } from '@ng-select/ng-select';

// Flatpicker
import { FlatpickrModule } from 'angularx-flatpickr';

// Feather Icon
import { FeatherModule } from 'angular-feather';
import { allIcons } from 'angular-feather/icons';

// Ng Search

// Load Icon
import { MasterDataRoutingModule } from './master-data-routing.module';
import { TitleCasePipe } from '../../utils/pipes/title-case.pipe';

import { AuthorizationComponent } from './authorization/authorization.component';
import { NgxLoadingModule } from 'ngx-loading';
import { SharedModule } from '../../shared/shared.module';
import { DepartmentComponent } from './department/department.component';
import { SectionDepartmentComponent } from './section-department/section-department.component';
import { LineComponent } from './line/line.component';
import { MasterAreaComponent } from './master-area/master-area.component';
import { MasterHeadDepartmentComponent } from './master-head-department/master-head-department.component';
import { MasterHeadSectionComponent } from './master-head-section/master-head-section.component';
import { MasterSupportDocComponent } from './master-support-doc/master-support-doc.component';
import { MasterSubdocumentComponent } from './master-subdocument/master-subdocument.component';
import { MasterDevelopmentComponent } from './master-development/master-development.component';
import { MasterDoctypeComponent } from './master-doctype/master-doctype.component';
import { MasterDocCategoriesComponent } from './master-doc-categories/master-doc-categories.component';
// import { TitleCasePipe } from '../../utils/pipes/title-case.pipe';
@NgModule({
  declarations: [
    AuthorizationComponent,
    TitleCasePipe,
    LineComponent,
    MasterAreaComponent,





    DepartmentComponent,
    SectionDepartmentComponent,
    MasterHeadSectionComponent,
    MasterHeadDepartmentComponent,

    MasterSupportDocComponent,
    MasterSubdocumentComponent,
    MasterDevelopmentComponent,
    MasterDoctypeComponent,
    MasterDocCategoriesComponent

  ],
  imports: [
    CommonModule,
    MasterDataRoutingModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbNavModule,
    NgbDropdownModule,
    NgbAccordionModule,
    NgbTooltipModule,
    NgbPaginationModule,
    NgSelectModule,
    FlatpickrModule,
    FeatherModule.pick(allIcons),
    SharedModule,
    NgxLoadingModule,
  ],
  exports: [
    // Ekspor TitleCasePipe agar bisa digunakan oleh module lain
    TitleCasePipe
  ]
})

export class MasterDataModule { }
