import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { LoginResetPasswordComponent } from './login-reset-password.component';

const routes: Routes = [
  {
    path: '',
    component: LoginResetPasswordComponent
  }
];

@NgModule({
  declarations: [
    LoginResetPasswordComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes)
  ]
})
export class LoginResetPasswordModule { }