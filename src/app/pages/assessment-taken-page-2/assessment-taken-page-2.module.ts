import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'



import { ComponentsModule } from '../../components/components.module'
import { AssessmentTakenPage2 } from './assessment-taken-page-2.component'

const routes = [
  {
    path: '',
    component: AssessmentTakenPage2,
  },
]

@NgModule({
  declarations: [AssessmentTakenPage2],
  imports: [CommonModule, ComponentsModule, RouterModule.forChild(routes)],
  exports: [AssessmentTakenPage2],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AssessmentTakenPage2Module {}
