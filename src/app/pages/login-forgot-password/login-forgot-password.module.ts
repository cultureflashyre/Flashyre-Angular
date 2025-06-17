import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ForgotPasswordComponent } from './login-forgot-password.component';

@NgModule({
  declarations: [ForgotPasswordComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild([
      { path: '', component: ForgotPasswordComponent }
    ]),
  ],
  exports: [ForgotPasswordComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LoginForgotPasswordModule {}