import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Add FormsModule for form inputs
import { ComponentsModule } from '../../components/components.module';
import { CreateJobPost1stPage } from './create-job-post-1st-page.component';

const routes = [
  {
    path: '',
    component: CreateJobPost1stPage,
  },
];

@NgModule({
  declarations: [CreateJobPost1stPage],
  imports: [
    CommonModule,
    ComponentsModule,
    FormsModule, // Added for form handling
    RouterModule.forChild(routes),
  ],
  exports: [CreateJobPost1stPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CreateJobPost1stPageModule {}