import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'


import { ComponentsModule } from '../../components/components.module'
import { SignupAdmin } from './signup-admin.component'

const routes = [
  {
    path: '',
    component: SignupAdmin,
  },
]

@NgModule({
  declarations: [SignupAdmin],
  imports: [CommonModule,   RouterModule.forChild(routes)],
  exports: [SignupAdmin],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SignupAdminModule {}
