import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { BrowserModule } from '@angular/platform-browser'
import { HttpClientModule } from '@angular/common/http';
import { AuthGuard } from './guards/auth.guard';
import { ComponentsModule } from './components/components.module'
import { AppComponent } from './app.component'
import { BufferPageModule } from './buffer-page/buffer-page.module';
import { BufferInterceptor } from './interceptors/buffer.interceptor';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { BufferService } from './services/buffer.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgxSpinnerModule } from 'ngx-spinner';
import { JwtInterceptor } from './interceptors/jwt.interceptor';
import { LoginForgotPasswordModule } from './pages/login-forgot-password/login-forgot-password.module';
import { LoginResetPasswordModule } from './pages/login-reset-password/login-reset-password.module';

const routes = [
  {
    path: '',
    loadChildren: () =>
      import('./pages/index/index.module').then((m) => m.IndexModule),
  },
  {
    path: 'profile-education-page',
    loadChildren: () =>
      import(
        './pages/profile-education-page/profile-education-page.module'
      ).then((m) => m.ProfileEducationPageModule),
  },
  // {
  //   path: 'profile-education-page-duplicate',
  //   loadChildren: () =>
  //     import(
  //       './pages/profile-education-page-duplicate/profile-education-page-duplicate.module'
  //     ).then((m) => m.ProfileEducationPageDuplicateModule),
  // },
  {
    path: 'login-college',
    loadChildren: () =>
      import('./pages/login-college/login-college.module').then(
        (m) => m.LoginCollegeModule
      ),
  },
  // {
  //   path: 'profile-basic-information',
  //   loadChildren: () =>
  //     import('./pages/profile-basic-information/profile-basic-information.module').then(
  //       (m) => m.ProfileBasicInformationModule),
  //    // Protect this route
  // },
  {
    path: 'recruiter-view-3rd-page',
    loadChildren: () =>
      import(
        './pages/recruiter-view-3rd-page/recruiter-view-3rd-page.module'
      ).then((m) => m.RecruiterView3rdPageModule),
  },
  {
    path: 'signup-candidate',
    loadChildren: () =>
      import('./pages/signup-candidate/signup-candidate.module').then(
        (m) => m.SignupCandidateModule
      ),
  },
  {
    path: 'signup-corporate',
    loadChildren: () =>
      import('./pages/signup-corporate/signup-corporate.module').then(
        (m) => m.SignupCorporateModule
      ),
  },
  // {
  //   path: 'profile-employment-page',
  //   loadChildren: () =>
  //     import(
  //       './pages/profile-employment-page/profile-employment-page.module'
  //     ).then((m) => m.ProfileEmploymentPageModule),
  // },
  {
    path: 'candidate-job-detail-view',
    loadChildren: () =>
      import(
        './pages/candidate-job-detail-view/candidate-job-detail-view.module'
      ).then((m) => m.CandidateJobDetailViewModule),
  },
  {
    path: 'login-candidate',
    loadChildren: () =>
      import('./pages/login-candidate/login-candidate.module').then(
        (m) => m.LoginCandidateModule
      ),
  },
  {
    path: 'recruiter-view-5th-page',
    loadChildren: () =>
      import(
        './pages/recruiter-view-5th-page/recruiter-view-5th-page.module'
      ).then((m) => m.RecruiterView5thPageModule),
  },
  {
    path: 'candidate-home',
    loadChildren: () =>
      import('./pages/candidate-home/candidate-home.module').then(
        (m) => m.CandidateHomeModule
      ),
  },
  // {
  //   path: 'profile-certification-page',
  //   loadChildren: () =>
  //     import(
  //       './pages/profile-certification-page/profile-certification-page.module'
  //     ).then((m) => m.ProfileCertificationPageModule),
  // },
  {
    path: 'recruiter-view-4th-page',
    loadChildren: () =>
      import(
        './pages/recruiter-view-4th-page/recruiter-view-4th-page.module'
      ).then((m) => m.RecruiterView4thPageModule),
  },
  {
    path: 'login-corporate',
    loadChildren: () =>
      import('./pages/login-corporate/login-corporate.module').then(
        (m) => m.LoginCorporateModule
      ),
  },
  {
    path: 'signup-college',
    loadChildren: () =>
      import('./pages/signup-college/signup-college.module').then(
        (m) => m.SignupCollegeModule
      ),
  },
  {
    path: 'flashyre-assessment-rules-card',
    loadChildren: () =>
      import(
        './pages/flashyre-assessment-rules-card/flashyre-assessment-rules-card.module'
      ).then((m) => m.FlashyreAssessmentRulesCardModule),
  },
  {
    path: 'flashyre-assessments',
    loadChildren: () =>
      import('./pages/flashyre-assessments/flashyre-assessments.module').then(
        (m) => m.FlashyreAssessmentsModule
      ),
  },
  {
    path: 'candidate-dashboard',
    loadChildren: () =>
      import('./pages/candidate-dashboard/candidate-dashboard.module').then(
        (m) => m.CandidateDashboardModule
      ),
  },
  {
    path: 'error-system-requirement-failed',
    loadChildren: () =>
      import('./pages/error-system-requirement-failed/error-system-requirement-failed.module').then(
        (m) => m.ErrorSystemRequirementFailedModule
      ),
  },
  {
    path: 'flashyre-assessment1', // New route
    loadChildren: () =>
      import('./pages/flashyre-assessment1/flashyre-assessment1.module').then(
        (m) => m.FlashyreAssessment1Module
      ),
  },
  {
    path: 'profile-last-page1', // New route
    loadChildren: () =>
    import('./pages/profile-last-page1/profile-last-page1.module').then(
      (m) => m.ProfileLastPage1Module
    ),
  },   
  {
    path: 'candidate-assessment', // New route
    loadChildren: () =>
      import('./pages/candidate-assessment/candidate-assessment.module').then(
        (m) => m.CandidateAssessmentModule
      ),
  },
  {
    path: 'candidate-dashboard-main', // New route
    loadChildren: () =>
      import('./pages/candidate-dashboard-main/candidate-dashboard-main.module').then(
        (m) => m.CandidateDashboardMainModule
      ),
  },
  {
    path: 'buffer-page', // New route
    loadChildren: () =>
      import('./buffer-page/buffer-page.module').then(
        (m) => m.BufferPageModule
      ),
  },
  {
    path: 'profile-overview-page',
    loadChildren: () =>
      import( './pages/profile-overview-page/profile-overview-page.module'
      ).then((m) => m.ProfileOverviewPageModule),
  },
  {
    path: 'login-forgot-password',
loadChildren: () =>
      import( './pages/login-forgot-password/login-forgot-password.module'
      ).then((m) => m.LoginForgotPasswordModule), 
 },
  {
    path: 'login-reset-password',
loadChildren: () =>
      import( './pages/login-reset-password/login-reset-password.module'
      ).then((m) => m.LoginResetPasswordModule),  
  },
  {
    path: '**',
    loadChildren: () =>
      import('./pages/not-found/not-found.module').then(
        (m) => m.NotFoundModule
      ),
  },
]

@NgModule({
  declarations: [AppComponent],
  imports: [ NgxSpinnerModule, BrowserAnimationsModule, BrowserModule, LoginForgotPasswordModule,LoginResetPasswordModule, RouterModule.forRoot(routes), ComponentsModule,HttpClientModule],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true }, // Register interceptor
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
