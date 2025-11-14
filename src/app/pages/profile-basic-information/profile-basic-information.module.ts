import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { ComponentsModule } from '../../components/components.module'
import { ProfileBasicInformation } from './profile-basic-information.component'

const routes = [
  {
    path: '',
    component: ProfileBasicInformation,
  },
]

@NgModule({ declarations: [ProfileBasicInformation],
    exports: [ProfileBasicInformation],
    schemas: [CUSTOM_ELEMENTS_SCHEMA], imports: [CommonModule,
         
        RouterModule.forChild(routes)], providers: [provideHttpClient(withInterceptorsFromDi())] })
export class ProfileBasicInformationModule {}
