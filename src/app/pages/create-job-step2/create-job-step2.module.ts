import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgxSpinnerModule } from 'ngx-spinner';
 
import { AdminCreateJobStep2 } from './create-job-step2.component';

// Define routes for the module
const routes = [
  {
    path: '',
    component: AdminCreateJobStep2
  }
];

@NgModule({ declarations: [AdminCreateJobStep2],
    exports: [AdminCreateJobStep2],
    schemas: [CUSTOM_ELEMENTS_SCHEMA], imports: [CommonModule,
         
        RouterModule.forChild(routes),
        NgxSpinnerModule // For the AI generation loading spinner
    ], providers: [provideHttpClient(withInterceptorsFromDi())] })
export class CreateJobStep2Module {}