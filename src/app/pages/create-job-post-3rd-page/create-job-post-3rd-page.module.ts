// src/app/pages/create-job-post-3rd-page/create-job-post-3rd-page.module.ts

import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

// Import Angular Material modules required for the date picker
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar';

// Import shared components module
import { ComponentsModule } from '../../components/components.module';

// Import the page component itself
import { CreateJobPost3rdPageComponent } from './create-job-post-3rd-page.component';

const routes: Routes = [
  {
    path: '',
    component: CreateJobPost3rdPageComponent,
  },
];

@NgModule({
  declarations: [
    CreateJobPost3rdPageComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule, // Essential for FormArray, FormGroup, etc.
    ComponentsModule,    // For navbar, footer, progress bar, etc.
    
    // Angular Material Modules for the date picker and its input field
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatSnackBarModule,
  ],
  exports: [
    CreateJobPost3rdPageComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CreateJobPost3rdPageModule {}  