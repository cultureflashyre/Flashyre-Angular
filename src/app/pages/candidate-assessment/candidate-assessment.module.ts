import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'


import { ComponentsModule } from '../../components/components.module'
import { CandidateAssessment } from './candidate-assessment.component'

const routes = [
  {
    path: '',
    component: CandidateAssessment,
  },
]

@NgModule({
  declarations: [CandidateAssessment],
  imports: [CommonModule, ComponentsModule, RouterModule.forChild(routes)],
  exports: [CandidateAssessment],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CandidateAssessmentModule {}
