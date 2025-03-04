import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { Navbar6 } from './navbar6/navbar6.component'
import { NavbarForRecruiterViewOption } from './navbar-for-recruiter-view-option/navbar-for-recruiter-view-option.component'
import { BufferName1 } from './buffer-name-1/buffer-name-1.component'
import { CandidateProfileScore } from './candidate-profile-score/candidate-profile-score.component'
import { LandingPageNavbar } from './landing-page-navbar/landing-page-navbar.component'
import { LandingPageReadableArticlesCardSmall } from './landing-page-readable-articles-card-small/landing-page-readable-articles-card-small.component'
import { DateSelector1 } from './date-selector1/date-selector1.component'
import { Component1 } from './component1/component1.component'
import { SignupCorporate1 } from './signup-corporate1/signup-corporate1.component'
import { MoreFiltersComponent } from './more-filters-component/more-filters-component.component'
import { FlashyreDashboard } from './flashyre-dashboard/flashyre-dashboard.component'
import { RecruiterFlowJobPostedCard } from './recruiter-flow-job-posted-card/recruiter-flow-job-posted-card.component'
import { LoginPageNavbar } from './login-page-navbar/login-page-navbar.component'
import { Hero17 } from './hero17/hero17.component'
import { NavbarForCandidateView1 } from './navbar-for-candidate-view1/navbar-for-candidate-view1.component'
import { FlashyreAssessment } from './flashyre-assessment/flashyre-assessment.component'
import { AppComponent } from './component/component.component'
import { ProgressBarStep1 } from './progress-bar-step-1/progress-bar-step-1.component'
import { CandidateViewLastPageCard } from './candidate-view-last-page-card/candidate-view-last-page-card.component'
import { FirstNameAndLastNameComponent } from './first-name-and-last-name-component/first-name-and-last-name-component.component'
import { RecruiterViewCandidateProfile } from './recruiter-view-candidate-profile/recruiter-view-candidate-profile.component'
import { RecruiterProfile } from './recruiter-profile/recruiter-profile.component'
import { SignupCandidate1 } from './signup-candidate1/signup-candidate1.component'
import { ProfileCertificationsComponent } from './profile-certifications-component/profile-certifications-component.component'
import { LandingPageFooter } from './landing-page-footer/landing-page-footer.component'
import { Features25 } from './features25/features25.component'
import { LandingPageJobSearchHero } from './landing-page-job-search-hero/landing-page-job-search-hero.component'
import { Component2 } from './component2/component2.component'
import { RecruiterFlowProfileCard } from './recruiter-flow-profile-card/recruiter-flow-profile-card.component'
import { Navbar1 } from './navbar1/navbar1.component'
import { ProfileEducationComponent } from './profile-education-component/profile-education-component.component'
import { ProfileHeaderComponent1 } from './profile-header-component1/profile-header-component1.component'
import { Footer8 } from './footer8/footer8.component'
import { Details } from './details/details.component'
import { SignupCollege1 } from './signup-college1/signup-college1.component'
import { ProfileBasicinformationComponent } from './profile-basicinformation-component/profile-basicinformation-component.component'
import { PasswordInputContainer } from './password-input-container/password-input-container.component'
import { InputDateComponent } from './input-date-component/input-date-component.component'

import { CandidateJobsForYouSearchAndFilterBar } from './candidate-jobs-for-you-search-and-filter-bar/candidate-jobs-for-you-search-and-filter-bar.component'
import { LogInPage } from './log-in-page/log-in-page.component'
import { Features24 } from './features24/features24.component'
import { ProgressBarStep5 } from './progress-bar-step-5/progress-bar-step-5.component'
import { CandidateProfileShort } from './candidate-profile-short/candidate-profile-short.component'
import { NavbarForRecruiterView } from './navbar-for-recruiter-view/navbar-for-recruiter-view.component'
import { RecruiterProfile1 } from './recruiter-profile1/recruiter-profile1.component'

import { AboutTheJob } from './about-the-job/about-the-job.component'
import { FlashyreAssessmentRules } from './flashyre-assessment-rules/flashyre-assessment-rules.component'
import { SignupPageNavbar } from './signup-page-navbar/signup-page-navbar.component'
import { RecruiterNavbar } from './recruiter-navbar/recruiter-navbar.component'
import { Navbar5 } from './navbar5/navbar5.component'
import { ProfileCreationNavigation2 } from './profile-creation-navigation2/profile-creation-navigation2.component'
import { ProgressBarStep3 } from './progress-bar-step-3/progress-bar-step-3.component'
import { FlashyreNavbar } from './flashyre-navbar/flashyre-navbar.component'
import { CandidateJobForYouCard } from './candidate-job-for-you-card/candidate-job-for-you-card.component'
import { Navbar8 } from './navbar8/navbar8.component'
import { RecruiterFlowSmallCard } from './recruiter-flow-small-card/recruiter-flow-small-card.component'
import { ProgressBarStep2 } from './progress-bar-step-2/progress-bar-step-2.component'
import { Navbar4 } from './navbar4/navbar4.component'
//import { CandidateJobForYouCard1 } from './candidate-job-for-you-card1/candidate-job-for-you-card1.component'
import { WriteAJobPostForRecruiter } from './write-a-job-post-for-recruiter/write-a-job-post-for-recruiter.component'
import { CTA26 } from './cta26/cta26.component'

import { ProfileEmploymentComponent } from './profile-employment-component/profile-employment-component.component'

import { NavbarForCandidateView860721 } from './navbar-for-candidate-view-86072-1/navbar-for-candidate-view-86072-1.component'
import { ViewMoreCandidates } from './view-more-candidates/view-more-candidates.component'
//import { RecruiterJobPosted1 } from './recruiter-job-posted1/recruiter-job-posted1.component'
import { LandingPageArticleCard } from './landing-page-article-card/landing-page-article-card.component'
import { NavbarForRecruiterView1076721 } from './navbar-for-recruiter-view-107672-1/navbar-for-recruiter-view-107672-1.component'
import { RecruiterCompanyJobCard } from './recruiter-company-job-card/recruiter-company-job-card.component'
import { DateSelector2Duplicate } from './date-selector2-duplicate/date-selector2-duplicate.component'
import { LandingPageVideoArticlesCardSmall } from './landing-page-video-articles-card-small/landing-page-video-articles-card-small.component'
import { RecruiterJobPosted } from './recruiter-job-posted/recruiter-job-posted.component'
import { ProfileCreationNavigation1 } from './profile-creation-navigation1/profile-creation-navigation1.component'
import { Gallery3 } from './gallery3/gallery3.component'
import { LandinPageTestimonialCard } from './landin-page-testimonial-card/landin-page-testimonial-card.component'

import { NavbarForCandidateView86072 } from './navbar-for-candidate-view-86072/navbar-for-candidate-view-86072.component'
import { RecruiterFlowLargeCard } from './recruiter-flow-large-card/recruiter-flow-large-card.component'
import { VerifyEmailSMSPopup } from './verify-email-sms-popup/verify-email-sms-popup.component'
import { NavbarForCandidateView107672 } from './navbar-for-candidate-view-107672/navbar-for-candidate-view-107672.component'
import { LandingPageArticalPreviewCard } from './landing-page-artical-preview-card/landing-page-artical-preview-card.component'
import { BufferScreen } from './buffer-screen/buffer-screen.component'
import { BufferName } from './buffer-name/buffer-name.component'
import { ProgressBarStep4 } from './progress-bar-step-4/progress-bar-step-4.component'
import { Contact10 } from './contact10/contact10.component'
import { NavbarForCandidateView } from './navbar-for-candidate-view/navbar-for-candidate-view.component'
import { EmailAndMobileNumberComponent } from './email-and-mobile-number-component/email-and-mobile-number-component.component'


@NgModule({
  declarations: [
    Navbar6,
    NavbarForRecruiterViewOption,
    BufferName1,
    CandidateProfileScore,
    LandingPageNavbar,
    LandingPageReadableArticlesCardSmall,
    DateSelector1,
    Component1,
    SignupCorporate1,
    MoreFiltersComponent,
    FlashyreDashboard,
    RecruiterFlowJobPostedCard,
    LoginPageNavbar,
    Hero17,
    NavbarForCandidateView1,
    FlashyreAssessment,
    AppComponent,
    ProgressBarStep1,
    CandidateViewLastPageCard,
    FirstNameAndLastNameComponent,
    RecruiterViewCandidateProfile,
    RecruiterProfile,
    SignupCandidate1,
    ProfileCertificationsComponent,
    LandingPageFooter,
    Features25,
    LandingPageJobSearchHero,
    Component2,
    RecruiterFlowProfileCard,
    Navbar1,
    ProfileEducationComponent,
    ProfileHeaderComponent1,
    Footer8,
    Details,
    SignupCollege1,
    ProfileBasicinformationComponent,
    PasswordInputContainer,
    InputDateComponent,
    CandidateJobsForYouSearchAndFilterBar,
    LogInPage,
    Features24,
    ProgressBarStep5,
    CandidateProfileShort,
    NavbarForRecruiterView,
    RecruiterProfile1,
    AboutTheJob,
    FlashyreAssessmentRules,
    SignupPageNavbar,
    RecruiterNavbar,
    Navbar5,
    ProfileCreationNavigation2,
    ProgressBarStep3,
    FlashyreNavbar,
    CandidateJobForYouCard,
    Navbar8,
    RecruiterFlowSmallCard,
    ProgressBarStep2,
    Navbar4,
   WriteAJobPostForRecruiter,
    CTA26,
    ProfileEmploymentComponent,
    NavbarForCandidateView860721,
    ViewMoreCandidates,
    LandingPageArticleCard,
    NavbarForRecruiterView1076721,
    RecruiterCompanyJobCard,
    DateSelector2Duplicate,
    LandingPageVideoArticlesCardSmall,
    RecruiterJobPosted,
    ProfileCreationNavigation1,
    Gallery3,
    LandinPageTestimonialCard,
    NavbarForCandidateView86072,
    RecruiterFlowLargeCard,
    VerifyEmailSMSPopup,
    NavbarForCandidateView107672,
    LandingPageArticalPreviewCard,
    BufferScreen,
    BufferName,
    ProgressBarStep4,
    Contact10,
    NavbarForCandidateView,
    EmailAndMobileNumberComponent
  ],
  imports: [CommonModule, RouterModule,FormsModule,ReactiveFormsModule],
  exports: [
    Navbar6,
    NavbarForRecruiterViewOption,
    BufferName1,
    CandidateProfileScore,
    LandingPageNavbar,
    LandingPageReadableArticlesCardSmall,
    DateSelector1,
    Component1,
    SignupCorporate1,
    MoreFiltersComponent,
    FlashyreDashboard,
    RecruiterFlowJobPostedCard,
    LoginPageNavbar,
    Hero17,
    NavbarForCandidateView1,
    FlashyreAssessment,
    AppComponent,
    ProgressBarStep1,
    CandidateViewLastPageCard,
    FirstNameAndLastNameComponent,
    RecruiterViewCandidateProfile,
    RecruiterProfile,
    SignupCandidate1,
    ProfileCertificationsComponent,
    LandingPageFooter,
    Features25,
    LandingPageJobSearchHero,
    Component2,
    RecruiterFlowProfileCard,
    Navbar1,
    ProfileEducationComponent,
    ProfileHeaderComponent1,
    Footer8,
    Details,
    SignupCollege1,
    ProfileBasicinformationComponent,
    PasswordInputContainer,
    InputDateComponent,
    CandidateJobsForYouSearchAndFilterBar,
    LogInPage,
    Features24,
    ProgressBarStep5,
    CandidateProfileShort,
    NavbarForRecruiterView,
    RecruiterProfile1,
    AboutTheJob,
    FlashyreAssessmentRules,
    SignupPageNavbar,
    RecruiterNavbar,
    Navbar5,
    ProfileCreationNavigation2,
    ProgressBarStep3,
    FlashyreNavbar,
    CandidateJobForYouCard,
    Navbar8,
    RecruiterFlowSmallCard,
    ProgressBarStep2,
    Navbar4,
    WriteAJobPostForRecruiter,
    CTA26,
    ProfileEmploymentComponent,
    NavbarForCandidateView860721,
    ViewMoreCandidates,
    LandingPageArticleCard,
    NavbarForRecruiterView1076721,
    RecruiterCompanyJobCard,
    DateSelector2Duplicate,
    LandingPageVideoArticlesCardSmall,
    RecruiterJobPosted,
    ProfileCreationNavigation1,
    Gallery3,
    LandinPageTestimonialCard,
    NavbarForCandidateView86072,
    RecruiterFlowLargeCard,
    VerifyEmailSMSPopup,
    NavbarForCandidateView107672,
    LandingPageArticalPreviewCard,
    BufferScreen,
    BufferName,
    ProgressBarStep4,
    Contact10,
    NavbarForCandidateView,
    EmailAndMobileNumberComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ComponentsModule {}
