import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'


import { ComponentsModule } from '../../components/components.module'
import { AssessmentViolationMessage } from './assessment-violation-message.component'

const routes = [
  {
    path: '',
    component: AssessmentViolationMessage,
  },
]

@NgModule({
  declarations: [AssessmentViolationMessage],
  imports: [CommonModule, ComponentsModule, RouterModule.forChild(routes)],
  exports: [AssessmentViolationMessage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AssessmentViolationMessageModule {}
