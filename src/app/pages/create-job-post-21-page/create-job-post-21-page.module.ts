import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'

import { ComponentsModule } from '../../components/components.module'
import { CreateJobPost21Page } from './create-job-post-21-page.component'

const routes = [
  {
    path: '',
    component: CreateJobPost21Page,
  },
]

@NgModule({
  declarations: [CreateJobPost21Page],
  imports: [CommonModule, ComponentsModule, RouterModule.forChild(routes)],
  exports: [CreateJobPost21Page],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CreateJobPost21PageModule {}
