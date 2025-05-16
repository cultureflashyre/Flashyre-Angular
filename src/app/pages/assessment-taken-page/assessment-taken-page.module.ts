import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ComponentsModule } from '../../components/components.module';
import { AssessmentTakenPage } from './assessment-taken-page.component';

@NgModule({
  declarations: [
    AssessmentTakenPage
  ],
  imports: [
    CommonModule,
    ComponentsModule,
    RouterModule.forChild([{ path: '', component: AssessmentTakenPage }]),
    HttpClientModule
  ],
  exports: [AssessmentTakenPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AssessmentTakenPageModule {}