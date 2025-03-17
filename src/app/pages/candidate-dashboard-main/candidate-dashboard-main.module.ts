import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'



import { ComponentsModule } from '../../components/components.module'
import { CandidateDashboardMain } from './candidate-dashboard-main.component'

const routes = [
  {
    path: '',
    component: CandidateDashboardMain,
  },
]

@NgModule({
  declarations: [CandidateDashboardMain],
  imports: [CommonModule, ComponentsModule, RouterModule.forChild(routes)],
  exports: [CandidateDashboardMain],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CandidateDashboardMainModule {}