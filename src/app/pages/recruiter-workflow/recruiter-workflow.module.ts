import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'

import { ComponentsModule } from '../components/components.module'
import { RecruiterWorkflow } from './recruiter-workflow.component'

const routes = [
  {
    path: '',
    component: RecruiterWorkflow,
  },
]

@NgModule({
  declarations: [RecruiterWorkflow],
  imports: [CommonModule, ComponentsModule, RouterModule.forChild(routes)],
  exports: [RecruiterWorkflow],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RecruiterWorkflowModule {}
