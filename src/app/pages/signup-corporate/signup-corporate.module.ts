import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { ComponentsModule } from '../../components/components.module'
import { SignupCorporate } from './signup-corporate.component'

const routes = [
  {
    path: '',
    component: SignupCorporate,
  },
]

@NgModule({
  declarations: [SignupCorporate],
  imports: [CommonModule, ComponentsModule, RouterModule.forChild(routes),HttpClientModule,FormsModule],
  exports: [SignupCorporate],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SignupCorporateModule {}
