// src/app/pages/create-job-post-22-page/create-job-post-22-page.module.ts

import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

// ==============================================================================
// === SOLUTION: IMPORT THE REQUIRED MODULES HERE ===============================
// ==============================================================================
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';
// HttpClientModule is also good practice to have if any child makes HTTP requests
import { HttpClientModule } from '@angular/common/http';
// ==============================================================================

import { ComponentsModule } from '../../components/components.module';
import { CreateJobPost22Page } from './create-job-post-22-page.component';

const routes = [
  {
    path: '',
    component: CreateJobPost22Page,
  },
];

@NgModule({
  declarations: [CreateJobPost22Page],
  imports: [
    CommonModule,
    ComponentsModule,
    RouterModule.forChild(routes),

    // --- ADDED IMPORTS ---
    FormsModule,           // For [(ngModel)]
    ReactiveFormsModule,   // For FormGroup and FormBuilder
    MatSnackBarModule,     // For MatSnackBar
    HttpClientModule,      // For services making HTTP calls
  ],
  exports: [CreateJobPost22Page],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CreateJobPost22PageModule {}