import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'

import { AdminPage1 } from './admin-page1.component'

const routes = [
  {
    path: '',
    component: AdminPage1,
  },
]

@NgModule({
  declarations: [AdminPage1],
  imports: [CommonModule, RouterModule.forChild(routes)],
  exports: [AdminPage1],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AdminPage1Module {}
