import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
 
import { LoginAdmin } from './login-admin.component';

const routes = [
  {
    path: '',
    component: LoginAdmin,
  },
];

@NgModule({
  declarations: [LoginAdmin],
  imports: [CommonModule,   RouterModule.forChild(routes)],
  exports: [LoginAdmin],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LoginAdminModule {}