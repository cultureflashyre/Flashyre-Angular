// src/app/pages/admin-candidate-scores-page/admin-candidate-scores-page.module.ts
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { AdminCandidateScoresPageComponent } from './admin-candidate-scores-page.component';
import { FormsModule } from '@angular/forms'; // Add FormsModule for ngModel

const routes = [
  {
    path: '',
    component: AdminCandidateScoresPageComponent
  }
];

@NgModule({ declarations: [AdminCandidateScoresPageComponent],
    exports: [AdminCandidateScoresPageComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA], 
    imports: [CommonModule,
         // For navbar
        RouterModule.forChild(routes),
        FormsModule // Enable ngModel binding
    ], providers: [provideHttpClient(withInterceptorsFromDi())] })
export class AdminCandidateScoresPageModule {}