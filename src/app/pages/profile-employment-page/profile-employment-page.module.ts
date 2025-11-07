import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { ComponentsModule } from '../../components/components.module';
import { ProfileEmploymentPage } from './profile-employment-page.component';
//import { ProfileEmploymentComponent } from './profile-employment-component/profile-employment-component.component';

const routes = [
  {
    path: '',
    component: ProfileEmploymentPage,
  },
];

@NgModule({ declarations: [ProfileEmploymentPage],
    exports: [ProfileEmploymentPage],
    schemas: [CUSTOM_ELEMENTS_SCHEMA], imports: [CommonModule,
        ComponentsModule,
        RouterModule.forChild(routes), // For HTTP requests
        FormsModule], providers: [provideHttpClient(withInterceptorsFromDi())] })
export class ProfileEmploymentPageModule {}