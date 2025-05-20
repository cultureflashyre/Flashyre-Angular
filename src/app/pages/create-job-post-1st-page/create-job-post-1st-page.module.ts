import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClientModule } from '@angular/common/http';
import { ComponentsModule } from '../../components/components.module';
import { CreateJobPost1stPageComponent } from './create-job-post-1st-page.component';

// Define routes for the module
const routes = [
  {
    path: '',
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
    RouterModule.forChild(routes)
  ],
  exports: [CreateJobPost1stPageComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class CreateJobPost1stPageModule {}