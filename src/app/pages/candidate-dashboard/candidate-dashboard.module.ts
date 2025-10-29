import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'

import { ComponentsModule } from '../../components/components.module'
import { CandidateDashboard } from './candidate-dashboard.component'
import { SafeHtmlPipe } from 'src/app/shared/pipes/safe-html.pipe'
import { SharedPipesModule } from 'src/app/shared/shared-pipes.module'

const routes = [
  {
    path: '',
    component: CandidateDashboard,
  },
]

@NgModule({
  declarations: [CandidateDashboard],
  imports: [SharedPipesModule, CommonModule, ComponentsModule, RouterModule.forChild(routes)],
  exports: [CandidateDashboard],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CandidateDashboardModule {}
