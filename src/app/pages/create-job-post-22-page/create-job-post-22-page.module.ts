import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'

import { ComponentsModule } from '../../components/components.module'
import { CreateJobPost22Page } from './create-job-post-22-page.component'

const routes = [
  {
    path: '',
    component: CreateJobPost22Page,
  },
]

@NgModule({
  declarations: [CreateJobPost22Page],
  imports: [CommonModule, ComponentsModule, RouterModule.forChild(routes)],
  exports: [CreateJobPost22Page],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CreateJobPost22PageModule {}
