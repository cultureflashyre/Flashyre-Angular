import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClientModule } from '@angular/common/http';
import { ComponentsModule } from '../../components/components.module';
import { AdminCreateJobStep1Component } from './admin-create-job-step1.component';
import { NgxSpinnerModule } from 'ngx-spinner';

// Define routes for the module
const routes = [
  {
    path: '',
    component: AdminCreateJobStep1Component
  }
];

@NgModule({
  declarations: [AdminCreateJobStep1Component],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    HttpClientModule,
    ComponentsModule,
    RouterModule,
    NgxSpinnerModule // Importing NgxSpinnerModule for loading spinner functionality
  ],
  exports: [AdminCreateJobStep1Component],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AdminCreateJobStep1Module {}