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

import { LanguageComponent } from './language/language.component';
import { AuthorizationComponent } from './authorization/authorization.component';
import { NgxLoadingModule } from 'ngx-loading';
import { SharedModule } from '../../shared/shared.module';
import { ProductComponent } from './product/product.component';
import { WhitelistComponent } from './whitelist/whitelist.component';
import { SiteComponent } from './site/site.component';
import { CountryComponent } from './country/country.component';
import { DepartmentComponent } from './department/department.component';
import { UserComponent } from './user/user.component';

// import { TitleCasePipe } from '../../utils/pipes/title-case.pipe';
@NgModule({
  declarations: [
    AuthorizationComponent,
    TitleCasePipe,
    LanguageComponent,
    ProductComponent,
    WhitelistComponent,



    //Master Data
    SiteComponent,
    CountryComponent,
    DepartmentComponent,
    UserComponent,

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
