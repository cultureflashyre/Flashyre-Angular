import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ComponentsModule } from '../../components/components.module';
import { ProfileBasicInformation } from './profile-basic-information.component';

const routes = [
  {
    path: '',
    component: ProfileBasicInformation,
  },
];

@NgModule({
  declarations: [ProfileBasicInformation],
  imports: [
    CommonModule,
    ComponentsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule.forChild(routes),
  ],
  exports: [ProfileBasicInformation],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ProfileBasicInformationModule {}