import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'
import { HttpClientModule } from '@angular/common/http'; // 

import { ComponentsModule } from '../../components/components.module'
import { FlashyreAssessments } from './flashyre-assessments.component'

const routes = [
  {
    path: '',
    component: FlashyreAssessments,
  },
]

@NgModule({
  declarations: [FlashyreAssessments],
  imports: [CommonModule, ComponentsModule, RouterModule.forChild(routes), HttpClientModule],
  exports: [FlashyreAssessments],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FlashyreAssessmentsModule {}
