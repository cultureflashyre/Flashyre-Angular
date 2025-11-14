import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'

import { AssessmentTakenPage3 } from './assessment-taken-page-3.component'

const routes = [
  {
    path: '',
    component: AssessmentTakenPage3,
  },
]

@NgModule({
  declarations: [AssessmentTakenPage3],
  imports: [CommonModule, RouterModule.forChild(routes)],
  exports: [AssessmentTakenPage3],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AssessmentTakenPage3Module {}