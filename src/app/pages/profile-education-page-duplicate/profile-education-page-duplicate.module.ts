import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
 
import { ProfileEducationPageDuplicate } from './profile-education-page-duplicate.component';

const routes: Routes = [
  {
    path: '',
    component: ProfileEducationPageDuplicate,
  },
];

@NgModule({
  declarations: [ProfileEducationPageDuplicate],
  imports: [CommonModule,   RouterModule.forChild(routes)],
  exports: [ProfileEducationPageDuplicate],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ProfileEducationPageDuplicateModule {}