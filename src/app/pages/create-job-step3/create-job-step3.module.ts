import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ComponentsModule } from '../../components/components.module';
import { AdminCreateJobStep3 } from './create-job-step3.component';

// Define routes for the module
const routes = [
  {
    path: '',
    component: AdminCreateJobStep3
  }
];

@NgModule({ declarations: [AdminCreateJobStep3],
    exports: [AdminCreateJobStep3],
    schemas: [CUSTOM_ELEMENTS_SCHEMA], imports: [CommonModule,
        FormsModule,
        ReactiveFormsModule,
        ComponentsModule,
        RouterModule.forChild(routes),
        NgxSpinnerModule // For the AI generation loading spinner
    ], providers: [provideHttpClient(withInterceptorsFromDi())] })
export class CreateJobStep3Module {}