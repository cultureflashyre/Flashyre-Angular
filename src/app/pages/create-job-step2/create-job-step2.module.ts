import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ComponentsModule } from '../../components/components.module';
import { AdminCreateJobStep2 } from './create-job-step2.component';

// Define routes for the module
const routes = [
  {
    path: '',
    component: AdminCreateJobStep2
  }
];

@NgModule({
  declarations: [AdminCreateJobStep2],
  imports: [
    CommonModule,
    ComponentsModule,
    RouterModule.forChild(routes),
    HttpClientModule,
    NgxSpinnerModule // For the AI generation loading spinner
  ],
  exports: [AdminCreateJobStep2],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class CreateJobStep2Module {}