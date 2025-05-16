import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthGuard } from './guards/auth.guard';
import { ComponentsModule } from './components/components.module';
import { AppComponent } from './app.component';
import { ToastrModule } from 'ngx-toastr';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { BufferPageModule } from './buffer-page/buffer-page.module';
import { BufferInterceptor } from './interceptors/buffer.interceptor';
import { BufferService } from './services/buffer.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgxSpinnerModule } from 'ngx-spinner';
import { JwtInterceptor } from './interceptors/jwt.interceptor';

const routes = [
  {
    path: '',
    loadChildren: () =>
      import('./pages/index/index.module').then((m) => m.IndexModule),
  },
  {
    path: 'login-forgot-password',
    loadChildren: () =>
      import('./pages/login-forgot-password/login-forgot-password.module').then(
        (m) => m.LoginForgotPasswordModule
      ),
  },
  {
    path: 'login-reset-password',
    loadChildren: () =>
      import('./pages/login-reset-password/login-reset-password.module').then(
        (m) => m.LoginResetPasswordModule
      ),
  },
  {
    path: 'profile-education-page',
    loadChildren: () =>
      import('./pages/profile-education-page/profile-education-page.module').then(
        (m) => m.ProfileEducationPageModule
      ),
  },
  {
    path: 'login-college',
    loadChildren: () =>
      import('./pages/login-college/login-college.module').then(
        (m) => m.LoginCollegeModule
      ),
  },
  {
    path: 'recruiter-view-3rd-page1',
    loadChildren: () =>
      import('./pages/recruiter-view-3rd-page1/recruiter-view-3rd-page1.module').then(
        (m) => m.RecruiterView3rdPage1Module
      ),
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
  {
    path: 'candidate-job-detail-view',
    loadChildren: () =>
      import('./pages/candidate-job-detail-view/candidate-job-detail-view.module').then(
        (m) => m.CandidateJobDetailViewModule
      ),
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
      import('./pages/recruiter-view-5th-page/recruiter-view-5th-page.module').then(
        (m) => m.RecruiterView5thPageModule
      ),
  },
  {
    path: 'candidate-home',
    loadChildren: () =>
      import('./pages/candidate-home/candidate-home.module').then(
        (m) => m.CandidateHomeModule
      ),
  },
  {
    path: 'recruiter-view-4th-page',
    loadChildren: () =>
      import('./pages/recruiter-view-4th-page/recruiter-view-4th-page.module').then(
        (m) => m.RecruiterView4thPageModule
      ),
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
      import('./pages/flashyre-assessment-rules-card/flashyre-assessment-rules-card.module').then(
        (m) => m.FlashyreAssessmentRulesCardModule
      ),
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
    path: 'flashyre-assessment1',
    loadChildren: () =>
      import('./pages/flashyre-assessment1/flashyre-assessment1.module').then(
        (m) => m.FlashyreAssessment1Module
      ),
  },
  {
    path: 'profile-last-page1',
    loadChildren: () =>
      import('./pages/profile-last-page1/profile-last-page1.module').then(
        (m) => m.ProfileLastPage1Module
      ),
  },
  {
    path: 'candidate-assessment',
    loadChildren: () =>
      import('./pages/candidate-assessment/candidate-assessment.module').then(
        (m) => m.CandidateAssessmentModule
      ),
  },
  {
    path: 'candidate-dashboard-main',
    loadChildren: () =>
      import('./pages/candidate-dashboard-main/candidate-dashboard-main.module').then(
        (m) => m.CandidateDashboardMainModule
      ),
  },
  {
    path: 'buffer-page',
    loadChildren: () =>
      import('./buffer-page/buffer-page.module').then(
        (m) => m.BufferPageModule
      ),
  },
  {
    path: 'profile-overview-page',
    loadChildren: () =>
      import('./pages/profile-overview-page/profile-overview-page.module').then(
        (m) => m.ProfileOverviewPageModule
      ),
  },
   {
    path: 'create-job-post-1st-page',
    loadChildren: () =>
      import('./pages/create-job-post-1st-page/create-job-post-1st-page.module').then(
        (m) => m.CreateJobPost1stPageModule
      ),
  },
  {
    path: '**',
    loadChildren: () =>
      import('./pages/not-found/not-found.module').then(
        (m) => m.NotFoundModule
      ),
  },
];

@NgModule({
  declarations: [AppComponent],
  imports: [
    NgxSpinnerModule,
    BrowserAnimationsModule,
    BrowserModule,
    RouterModule.forRoot(routes, { scrollPositionRestoration: 'enabled' }),
    ComponentsModule,
    HttpClientModule,
    ToastrModule.forRoot({
      timeOut: 5000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      closeButton: true
    }),
    NgbModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: BufferInterceptor, multi: true },
    BufferService,
    AuthGuard,
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}