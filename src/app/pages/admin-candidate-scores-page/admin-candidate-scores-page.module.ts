// src/app/pages/admin-candidate-scores-page/admin-candidate-scores-page.module.ts
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ComponentsModule } from '../../components/components.module'; // Import ComponentsModule for navbar
import { AdminCandidateScoresPageComponent } from './admin-candidate-scores-page.component';

const routes = [
  {
    path: '',
    component: AdminCandidateScoresPageComponent
  }
];

@NgModule({
  declarations: [AdminCandidateScoresPageComponent],
  imports: [
    CommonModule,
    ComponentsModule, // For navbar
    RouterModule.forChild(routes),
    HttpClientModule, // If the component or its children make HTTP calls
    // Any other modules needed by admin-candidate-sourced-component if it has direct dependencies here
  ],
  exports: [AdminCandidateScoresPageComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AdminCandidateScoresPageModule {}