import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'

import { ComponentsModule } from '../../components/components.module'
import { AssessmentTakenPage3 } from './assessment-taken-page-3.component'
import { SafeHtmlPipe } from 'src/app/shared/pipes/safe-html.pipe'
import { SharedPipesModule } from 'src/app/shared/shared-pipes.module'
const routes = [
  {
    path: '',
    component: AssessmentTakenPage3,
  },
]

@NgModule({
  declarations: [AssessmentTakenPage3],
  imports: [SharedPipesModule, CommonModule, ComponentsModule, RouterModule.forChild(routes)],
  exports: [AssessmentTakenPage3],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AssessmentTakenPage3Module {}