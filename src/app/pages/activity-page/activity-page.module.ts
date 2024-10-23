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
import { MasterDataModule } from '../master-data/master-data.module';  // Impor MasterDataModule

import { NgxLoadingModule } from 'ngx-loading';
import { SharedModule } from '../../shared/shared.module';
import { ActivityPageRoutingModule } from './activity-page-routing.module';
import { DocumentListComponent } from './documents/document-list/document-list.component';
import { DocumentCreateComponent } from './documents/document-create/document-create.component';
@NgModule({
  declarations: [



    //Activity
    DocumentListComponent,
    DocumentCreateComponent,

  ],
  imports: [
    CommonModule,
    ActivityPageRoutingModule,
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
    MasterDataModule
  ]
})
export class ActivityPageModule { }
