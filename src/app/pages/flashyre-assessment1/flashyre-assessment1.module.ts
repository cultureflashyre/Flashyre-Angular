import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'

import { ComponentsModule } from '../../components/components.module'
import { FlashyreAssessment1 } from './flashyre-assessment1.component'

const routes = [
  {
    path: '',
    component: FlashyreAssessment1,
  },
]

@NgModule({
  declarations: [FlashyreAssessment1],
  imports: [CommonModule, ComponentsModule, RouterModule.forChild(routes)],
  exports: [FlashyreAssessment1],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FlashyreAssessment1Module {}
