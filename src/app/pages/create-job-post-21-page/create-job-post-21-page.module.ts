import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NgxSpinnerModule } from 'ngx-spinner';

import { ComponentsModule } from '../../components/components.module';
import { CreateJobPost21Page } from './create-job-post-21-page.component';

const routes = [
  {
    path: '', // This path is relative to the parent route defined in app-routing.module.ts
    component: CreateJobPost21Page,
  },
];

@NgModule({
  declarations: [CreateJobPost21Page],
  imports: [
    CommonModule,
    ComponentsModule,
    RouterModule.forChild(routes),
    // Added imports for the component's dependencies
    HttpClientModule,
    MatSnackBarModule,
    NgxSpinnerModule, // For the loading spinner
  ],
  exports: [CreateJobPost21Page],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CreateJobPost21PageModule {}