import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComponentsModule } from '../../components/components.module';
import { CreateJobPost1stPageComponent } from './create-job-post-1st-page.component';

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
    ComponentsModule,
    RouterModule.forChild(routes)
  ],
  exports: [CreateJobPost1stPageComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class CreateJobPost1stPageModule {}