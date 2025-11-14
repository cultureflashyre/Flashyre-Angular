import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'

import { CandidateDashboard } from './candidate-dashboard.component'

const routes = [
  {
    path: '',
    component: CandidateDashboard,
  },
]

@NgModule({
  declarations: [CandidateDashboard],
  imports: [CommonModule, RouterModule.forChild(routes)],
  exports: [CandidateDashboard],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CandidateDashboardModule {}
