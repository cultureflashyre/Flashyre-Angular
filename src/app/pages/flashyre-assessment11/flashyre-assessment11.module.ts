import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // For ngModel
import { HttpClientModule } from '@angular/common/http'; // For HttpClient

import { ComponentsModule } from '../../components/components.module';
import { FlashyreAssessment11 } from './flashyre-assessment11.component';
import { AssessmentService } from '../../services/assessment.service'; // Adjust path as needed

const routes = [
  {
    path: '', // Updated to accept assessment ID as a route parameter
    component: FlashyreAssessment11,
  },
];

@NgModule({
  declarations: [FlashyreAssessment11],
  imports: [
    CommonModule,
    ComponentsModule,
    RouterModule.forChild(routes),
    FormsModule,
    HttpClientModule,
  ],
  providers: [AssessmentService], // Add the service here
  exports: [FlashyreAssessment11],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FlashyreAssessment11Module {}