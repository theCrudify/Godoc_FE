import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbDropdownModule, NgbPaginationModule, NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import { HttpClientModule } from '@angular/common/http';

// FlatPicker
import { FlatpickrModule } from 'angularx-flatpickr';

// Simplebar
import { SimplebarAngularModule } from 'simplebar-angular';

// Load Icon
import { defineElement } from "@lordicon/element";
import lottie from 'lottie-web';

import { ApplicationRequestRoutingModule } from './application-request-routing.module';

import { SharedModule } from '../../shared/shared.module';

// Ng Search 
import { NgPipesModule } from 'ngx-pipes';

// Sorting page

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ApplicationRequestRoutingModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    NgbDropdownModule,
    NgbPaginationModule,
    NgbTypeaheadModule,
    FlatpickrModule,
    SharedModule,
    SimplebarAngularModule,
    NgPipesModule
  ]
})
export class ApplicationRequestModule { }
