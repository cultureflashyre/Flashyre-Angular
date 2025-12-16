import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NgxSpinnerModule } from 'ngx-spinner';

 
import { CreateJobPost21Page } from './create-job-post-21-page.component';

const routes = [
  {
    path: '', // This path is relative to the parent route defined in app-routing.module.ts
    component: CreateJobPost21Page,
  },
];

@NgModule({ declarations: [CreateJobPost21Page],
    exports: [CreateJobPost21Page],
    schemas: [CUSTOM_ELEMENTS_SCHEMA], imports: [CommonModule,
         
        RouterModule.forChild(routes),
        MatSnackBarModule,
        NgxSpinnerModule], providers: [provideHttpClient(withInterceptorsFromDi())] })
export class CreateJobPost21PageModule {}