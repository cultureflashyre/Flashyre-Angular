import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AceModule } from 'ngx-ace-wrapper';

import { RouterModule, Routes } from '@angular/router';
import { CodingAssessment } from './coding-assessment.component';
import { MarkdownModule } from 'ngx-markdown';


const routes: Routes = [
  { path: '', component: CodingAssessment }, // Default: list problems
  { path: ':id', component: CodingAssessment } // Specific problem
];

@NgModule({
  declarations: [CodingAssessment],
  imports: [
    CommonModule,
    FormsModule,
    AceModule,
    
    MarkdownModule.forChild(),
    RouterModule.forChild(routes)
  ],
  exports: [CodingAssessment]
})
export class CodingAssessmentModule {}