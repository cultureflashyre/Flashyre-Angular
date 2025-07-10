import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'

import { ComponentsModule } from '../../components/components.module'
import { RecruiterView3rdPage } from './recruiter-view-3rd-page.component'

const routes = [
  {
    path: '',
    component: RecruiterView3rdPage,
  },
]

@NgModule({
  declarations: [RecruiterView3rdPage],
  imports: [CommonModule, ComponentsModule, RouterModule.forChild(routes)],
  exports: [RecruiterView3rdPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RecruiterView3rdPageModule {}
