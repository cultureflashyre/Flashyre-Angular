import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { BrowserModule } from '@angular/platform-browser'
import { HttpClientModule } from '@angular/common/http';
import { AuthGuard } from './guards/auth.guard';

import { ComponentsModule } from './components/components.module'
import { AppComponent } from './app.component'

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
  {
    path: 'profile-education-page-duplicate',
    loadChildren: () =>
      import(
        './pages/profile-education-page-duplicate/profile-education-page-duplicate.module'
      ).then((m) => m.ProfileEducationPageDuplicateModule),
  },
  {
    path: 'login-college',
    loadChildren: () =>
      import('./pages/login-college/login-college.module').then(
        (m) => m.LoginCollegeModule
      ),
  },
  {
    path: 'profile-basic-information',
    loadChildren: () =>
      import('./pages/profile-basic-information/profile-basic-information.module').then(
        (m) => m.ProfileBasicInformationModule
      ),
    canActivate: [AuthGuard], // Protect this route
  },
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
  {
    path: 'profile-employment-page',
    loadChildren: () =>
      import(
        './pages/profile-employment-page/profile-employment-page.module'
      ).then((m) => m.ProfileEmploymentPageModule),
  },
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
  {
    path: 'profile-certification-page',
    loadChildren: () =>
      import(
        './pages/profile-certification-page/profile-certification-page.module'
      ).then((m) => m.ProfileCertificationPageModule),
  },
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
    path: '**',
    loadChildren: () =>
      import('./pages/not-found/not-found.module').then(
        (m) => m.NotFoundModule
      ),
  },
]

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, RouterModule.forRoot(routes), ComponentsModule,HttpClientModule],
  providers: [],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
