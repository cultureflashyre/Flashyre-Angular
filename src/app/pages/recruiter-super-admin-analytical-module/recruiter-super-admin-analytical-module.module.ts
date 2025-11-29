import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'

import { ComponentsModule } from '../components/components.module'
import { RecruiterSuperAdminAnalyticalModule } from './recruiter-super-admin-analytical-module.component'

const routes = [
  {
    path: '',
    component: RecruiterSuperAdminAnalyticalModule,
  },
]

@NgModule({
  declarations: [RecruiterSuperAdminAnalyticalModule],
  imports: [CommonModule, ComponentsModule, RouterModule.forChild(routes)],
  exports: [RecruiterSuperAdminAnalyticalModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RecruiterSuperAdminAnalyticalModuleModule {}
