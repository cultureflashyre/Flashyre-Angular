import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComponentsModule } from '../../components/components.module';
import { LoginCorporate } from './login-corporate.component';
 
const routes = [
  {
    path: '',
    component: LoginCorporate,
  },
];
 
@NgModule({
  declarations: [LoginCorporate],
  imports: [CommonModule, ComponentsModule, FormsModule, RouterModule.forChild(routes)],
  exports: [LoginCorporate],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LoginCorporateModule {}