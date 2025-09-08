import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AceModule } from 'ngx-ace-wrapper';
import { ComponentsModule } from '../../components/components.module';
import { RouterModule, Routes } from '@angular/router';
import { CodingAssessment } from './coding-assessment.component';

const routes: Routes = [
  { path: '', component: CodingAssessment } // Map empty path to CodingAssessment
];

@NgModule({
  declarations: [CodingAssessment],
  imports: [
    CommonModule,
    FormsModule,
    AceModule,
    ComponentsModule,
    RouterModule.forChild(routes) // Use forChild for lazy-loaded module
  ],
  exports: [CodingAssessment]
})
export class CodingAssessmentModule {}