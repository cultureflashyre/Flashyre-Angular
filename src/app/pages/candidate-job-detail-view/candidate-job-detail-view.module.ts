import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms';

import { CandidateJobDetailView } from './candidate-job-detail-view.component'

const routes = [
  {
    path: '',
    component: CandidateJobDetailView,
  },
]

@NgModule({
  declarations: [CandidateJobDetailView],
  imports: [CommonModule, RouterModule.forChild(routes), FormsModule ],
  exports: [CandidateJobDetailView],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CandidateJobDetailViewModule {}