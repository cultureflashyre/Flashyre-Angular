import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ComponentsModule } from '../../components/components.module';
import { AdminCreateJobStep4Component } from './admin-create-job-step4.component';

// Define routes for the module
const routes = [
  {
    path: '',
    component: AdminCreateJobStep4Component
  }
];

@NgModule({
  declarations: [AdminCreateJobStep4Component],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    ComponentsModule,
    RouterModule.forChild(routes)
  ],
  exports: [AdminCreateJobStep4Component],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AdminCreateJobStep4Module {}