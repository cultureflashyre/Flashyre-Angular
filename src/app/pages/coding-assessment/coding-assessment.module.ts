import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ProblemDescriptionComponent } from '../../components/problem-description/problem-description.component';
import { CodeEditorComponent } from '../../components/code-editor/code-editor.component';
import { TestResultsComponent } from '../../components/coding-test-results/coding-test-results.component';
import { CodingAssessmentComponent } from './coding-assessment.component';
import { AssessmentService } from '../../services/coding-assessment.service';
import { ApiService } from '../../services/api.service';
import { ComponentsModule } from 'src/app/components/components.module';

const routes = [
  {
    path: '',
    component: CodingAssessmentComponent,
  },
];

@NgModule({
  declarations: [
    CodingAssessmentComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    HttpClientModule,
    MatToolbarModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatSelectModule,
    ComponentsModule,
    RouterModule.forChild(routes),
    
  ],
  providers: [
    AssessmentService,
    ApiService
  ],
  exports: [CodingAssessmentComponent]
})
export class CodingAssessmentModule {}