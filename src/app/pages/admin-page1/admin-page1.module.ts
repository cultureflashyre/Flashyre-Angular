import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'
import { HttpClientModule } from '@angular/common/http'; // <-- IMPORT THIS
import { FormsModule } from '@angular/forms'; // <-- AND IMPORT THIS

import { ComponentsModule } from '../../components/components.module'
import { AdminPage1 } from './admin-page1.component'

const routes = [
  {
    path: '',
    component: AdminPage1,
  },
]

@NgModule({
  declarations: [AdminPage1],
  imports: [CommonModule, ComponentsModule, RouterModule.forChild(routes),HttpClientModule, FormsModule],
  exports: [AdminPage1],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AdminPage1Module {}
