import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'

import { ComponentsModule } from '../../components/components.module'
import { CandidateJobDetailView } from './candidate-job-detail-view.component'

const routes = [
  {
    path: '',
    component: CandidateJobDetailView,
  },
]

@NgModule({
  declarations: [CandidateJobDetailView],
  imports: [CommonModule, ComponentsModule, RouterModule.forChild(routes)],
  exports: [CandidateJobDetailView],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CandidateJobDetailViewModule {}
