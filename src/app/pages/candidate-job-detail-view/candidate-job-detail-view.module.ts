import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'

import { ComponentsModule } from '../../components/components.module'
import { CandidateJobDetailViewComponent } from './candidate-job-detail-view.component'

const routes = [
  {
    path: '',
    component: CandidateJobDetailViewComponent,
  },
]

@NgModule({
  declarations: [CandidateJobDetailViewComponent],
  imports: [CommonModule, ComponentsModule, RouterModule.forChild(routes)],
  exports: [CandidateJobDetailViewComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CandidateJobDetailViewModule {}