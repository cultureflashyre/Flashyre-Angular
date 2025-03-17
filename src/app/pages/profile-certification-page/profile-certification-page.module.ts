import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms'; // Import ReactiveFormsModule
import { HttpClientModule } from '@angular/common/http'; // Import HttpClientModule

import { ComponentsModule } from '../../components/components.module';
import { ProfileCertificationPage } from './profile-certification-page.component';

const routes = [
  {
    path: '',
    component: ProfileCertificationPage,
  },
];

@NgModule({
  declarations: [ProfileCertificationPage],
  imports: [
    CommonModule,
    ComponentsModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule, // Add ReactiveFormsModule to imports
    HttpClientModule, // Add HttpClientModule to imports
  ],
  exports: [ProfileCertificationPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ProfileCertificationPageModule {}