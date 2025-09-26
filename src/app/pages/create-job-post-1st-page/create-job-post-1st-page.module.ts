import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClientModule } from '@angular/common/http';
import { ComponentsModule } from '../../components/components.module';
import { CreateJobPost1stPageComponent } from './create-job-post-1st-page.component';
import { NgxSpinnerModule } from 'ngx-spinner';

// Define routes for the module
const routes = [
  {
    path: '', // This path handles creating a new job (e.g., /create-job-post-1st-page)
    component: CreateJobPost1stPageComponent
  },
  {
    path: ':id', // This new path handles editing a job (e.g., /create-job-post-1st-page/some-id)
    component: CreateJobPost1stPageComponent
  }
];

@NgModule({
  declarations: [CreateJobPost1stPageComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    HttpClientModule,
    ComponentsModule,
    RouterModule.forChild(routes),
    NgxSpinnerModule // Importing NgxSpinnerModule for loading spinner functionality
  ],
  exports: [CreateJobPost1stPageComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class CreateJobPost1stPageModule {}