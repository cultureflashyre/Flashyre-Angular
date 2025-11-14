import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms'; // Added for reactive forms

 
import { SignupCorporate } from './signup-corporate.component';

const routes = [
  {
    path: '',
    component: SignupCorporate,
  },
];

@NgModule({
  declarations: [SignupCorporate],
  imports: [
    CommonModule,
     
    RouterModule.forChild(routes),
    ReactiveFormsModule, // Added
  ],
  exports: [SignupCorporate],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SignupCorporateModule {}