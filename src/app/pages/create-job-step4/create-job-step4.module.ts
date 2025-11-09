import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ComponentsModule } from '../../components/components.module';
import { AdminCreateJobStep4Component } from './create-job-step4.component';

// Define routes for the module
const routes = [
  {
    path: '',
    component: AdminCreateJobStep4Component
  }
];

@NgModule({ declarations: [AdminCreateJobStep4Component],
    exports: [AdminCreateJobStep4Component],
    schemas: [CUSTOM_ELEMENTS_SCHEMA], imports: [CommonModule,
        FormsModule,
        ReactiveFormsModule,
        ComponentsModule,
        RouterModule.forChild(routes)], providers: [provideHttpClient(withInterceptorsFromDi())] })
export class CreateJobStep4Module {}