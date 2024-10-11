import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
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
import { Ng2SearchPipeModule } from 'ng2-search-filter';

// Load Icon
import { defineElement } from 'lord-icon-element';
import lottie from 'lottie-web';
import { MasterDataRoutingModule } from './master-data-routing.module';
import { TitleCasePipe } from '../../utils/pipes/title-case.pipe';

import { LanguageComponent } from './language/language.component';
import { AuthorizationComponent } from './authorization/authorization.component';
import { NgxLoadingModule } from 'ngx-loading';
import { SharedModule } from '../../shared/shared.module';
// import { TitleCasePipe } from '../../utils/pipes/title-case.pipe';
@NgModule({
  declarations: [
    AuthorizationComponent,
    TitleCasePipe,
    LanguageComponent,
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
  ]
})
export class MasterDataModule { }
