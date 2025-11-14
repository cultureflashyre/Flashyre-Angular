import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { CandidateAssessment } from './candidate-assessment.component'

const routes = [
  {
    path: '',
    component: CandidateAssessment,
  },
]

@NgModule({
  declarations: [CandidateAssessment],
  imports: [CommonModule, RouterModule.forChild(routes), FormsModule],
  exports: [CandidateAssessment],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CandidateAssessmentModule {}