import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Added FormsModule

import { ComponentsModule } from '../../components/components.module';
import { ProfileEducationPageDuplicate } from './profile-education-page-duplicate.component';

const routes = [
  {
    path: '',
    component: ProfileEducationPageDuplicate,
  },
];

@NgModule({
  declarations: [ProfileEducationPageDuplicate],
  imports: [
    CommonModule,
    ComponentsModule,
    FormsModule, // Added FormsModule
    RouterModule.forChild(routes)
  ],
  exports: [ProfileEducationPageDuplicate],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ProfileEducationPageDuplicateModule {}