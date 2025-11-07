import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ComponentsModule } from '../../components/components.module';
import { AdminCreateJobStep1Component } from './create-job.component';
import { NgxSpinnerModule } from 'ngx-spinner';

// Define routes for the module
const routes = [
  {
    path: '',
    component: AdminCreateJobStep1Component
  },
  {
    path: ':id',
    component: AdminCreateJobStep1Component
  }
];

@NgModule({ declarations: [AdminCreateJobStep1Component],
    exports: [AdminCreateJobStep1Component],
    schemas: [CUSTOM_ELEMENTS_SCHEMA], imports: [CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatSnackBarModule,
        ComponentsModule,
        RouterModule.forChild(routes), // ← CRITICAL FIX: Changed from RouterModule to RouterModule.forChild(routes)
        NgxSpinnerModule], providers: [provideHttpClient(withInterceptorsFromDi())] })
export class CreateJobModule {}