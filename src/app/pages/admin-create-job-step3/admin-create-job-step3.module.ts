import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ComponentsModule } from '../../components/components.module';
import { AdminCreateJobStep3 } from './admin-create-job-step3.component';

// Define routes for the module
const routes = [
  {
    path: '',
    component: AdminCreateJobStep3
  }
];

@NgModule({
  declarations: [AdminCreateJobStep3],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    ComponentsModule,
    RouterModule.forChild(routes),
    NgxSpinnerModule // For the AI generation loading spinner
  ],
  exports: [AdminCreateJobStep3],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AdminCreateJobStep3Module {}