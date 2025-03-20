import { Component, Input, ContentChild, TemplateRef } from '@angular/core';

@Component({
  selector: 'navbar-for-candidate-view',
  templateUrl: 'navbar-for-candidate-view.component.html',
  styleUrls: ['navbar-for-candidate-view.component.css'],
})
export class NavbarForCandidateView {
  // Dynamic class name for the root element
  @Input()
  rootClassName: string = '';

  // ContentChild properties for custom templates
  @ContentChild('text11') text11: TemplateRef<any>; // Mobile "Preference" button text
  @ContentChild('text12') text12: TemplateRef<any>; // Desktop "Dashboard" link text
  @ContentChild('text8') text8: TemplateRef<any>;   // Mobile "Upskill" button text
  @ContentChild('text1') text1: TemplateRef<any>;   // Desktop dropdown "Profile" text
  @ContentChild('text31') text31: TemplateRef<any>; // Desktop dropdown "Logout" text
  @ContentChild('text13') text13: TemplateRef<any>; // Mobile "Logout" button text
  @ContentChild('text2') text2: TemplateRef<any>;   // Desktop dropdown "Preference" text
  @ContentChild('text5') text5: TemplateRef<any>;   // Mobile "Profile Completion" text
  @ContentChild('text4') text4: TemplateRef<any>;   // Mobile "Candidate Name" text
  @ContentChild('text9') text9: TemplateRef<any>;   // Mobile "Assessment" button text
  @ContentChild('text10') text10: TemplateRef<any>; // Mobile "Jobs for you" button text
  @ContentChild('text7') text7: TemplateRef<any>;   // Mobile "Dashboard" button text
  @ContentChild('text3') text3: TemplateRef<any>;   // Desktop dropdown "Settings" text
  @ContentChild('text6') text6: TemplateRef<any>;   // Mobile "View & edit profile" button text

  // ContentChild properties for custom link templates
  @ContentChild('link1') link1: TemplateRef<any>; // Custom template for "Dashboard" link (desktop)
  @ContentChild('link2') link2: TemplateRef<any>; // Custom template for "Upskill" link (desktop)
  @ContentChild('link3') link3: TemplateRef<any>; // Custom template for "Assessment" link (desktop)
  @ContentChild('link4') link4: TemplateRef<any>; // Custom template for "Jobs for you" link (desktop)

  // Image-related inputs
  @Input()
  imageSrc1: string = '/assets/main-logo/logo%20-%20flashyre(1500px)-200h.png'; // Logo image source
  @Input()
  imageAlt1: string = 'Flashyre logo'; // Logo alt text

  @Input()
  imageSrc3: string =
    'https://s3-alpha-sig.figma.com/img/b74a/bea4/ebc9cfc1a53c3f5e2e37843d60bf6944?Expires=1735516800&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=UtDDP8Rm~420kFe31N8K6pTrPW-xtuqVOImSKApZE7ywdUrTITMSOZ5YVZetsjvZG3k1b1D~td9StRjiaFaGCcKEVBhGFGUHmAwrtXb18YIkOHegCnmo7cBAz3IG2ww4B9DjG9nOaniCMSDG6uKAJpelvB2woG54Yj6dLQLjmRZK8wSIUOr1OJ17LOYjMQgP~QCmOL0gu8oXwIstaAQXvKjI7IGAfGbN8cjVs9JCBD7MEXCOmKgqHXu4Jn-XavYyVpMBTJLhLwkw4OeORgEeBzdYIUtAs3ClpYTmJ7VI0aDxw6cXBL4WobVlcuzTKqr6XJSeU5fYc8efbLynD~v-7g__'; // User image source (desktop dropdown)
  @Input()
  imageAlt3: string = 'User profile image'; // User image alt text (desktop dropdown)

  @Input()
  imageSrc4: string =
    'https://s3-alpha-sig.figma.com/img/b74a/bea4/ebc9cfc1a53c3f5e2e37843d60bf6944?Expires=1735516800&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=UtDDP8Rm~420kFe31N8K6pTrPW-xtuqVOImSKApZE7ywdUrTITMSOZ5YVZetsjvZG3k1b1D~td9StRjiaFaGCcKEVBhGFGUHmAwrtXb18YIkOHegCnmo7cBAz3IG2ww4B9DjG9nOaniCMSDG6uKAJpelvB2woG54Yj6dLQLjmRZK8wSIUOr1OJ17LOYjMQgP~QCmOL0gu8oXwIstaAQXvKjI7IGAfGbN8cjVs9JCBD7MEXCOmKgqHXu4Jn-XavYyVpMBTJLhLwkw4OeORgEeBzdYIUtAs3ClpYTmJ7VI0aDxw6cXBL4WobVlcuzTKqr6XJSeU5fYc8efbLynD~v-7g__'; // Candidate profile image source (mobile menu)
  @Input()
  imageAlt4: string = 'Candidate profile image'; // Candidate profile image alt text (mobile menu)

  // URLs for main navigation links
  @Input()
  link1Url: string = 'https://sublime-sunspot-447108-h1.uc.r.appspot.com/candidate-dashboard'; // "Dashboard" link URL (desktop and mobile if HTML updated)
  @Input()
  link2Url: string = 'https://sublime-sunspot-447108-h1.uc.r.appspot.com/'; // "Upskill" link URL (desktop only by default; mobile needs HTML update)
  @Input()
  link3Url: string = 'https://sublime-sunspot-447108-h1.uc.r.appspot.com/candidate-assessment'; // "Assessment" link URL (desktop only by default; mobile needs HTML update)
  @Input()
  link4Url: string = 'https://sublime-sunspot-447108-h1.uc.r.appspot.com/'; // "Jobs for you" link URL (desktop only by default; mobile needs HTML update)

  // URLs for dropdown items (new additions)
  @Input()
  profileUrl: string = 'https://sublime-sunspot-447108-h1.uc.r.appspot.com/profile-basic-information'; // URL for "Profile" in dropdown (desktop and mobile if HTML updated)
  // Example: profileUrl: string = 'https://sublime-sunspot-447108-h1.uc.r.appspot.com/profile';

  @Input()
  preferenceUrl: string = 'https://sublime-sunspot-447108-h1.uc.r.appspot.com'; // URL for "Preference" in dropdown (desktop and mobile if HTML updated)
  // Example: preferenceUrl: string = 'https://sublime-sunspot-447108-h1.uc.r.appspot.com/preference';

  @Input()
  settingsUrl: string = 'https://sublime-sunspot-447108-h1.uc.r.appspot.com'; // URL for "Settings" in dropdown (desktop and mobile if HTML updated)
  // Example: settingsUrl: string = 'https://sublime-sunspot-447108-h1.uc.r.appspot.com/settings';

  @Input()
  logoutUrl: string = 'https://sublime-sunspot-447108-h1.uc.r.appspot.com'; // URL for "Logout" in dropdown (desktop and mobile if HTML updated)
  // Example: logoutUrl: string = 'https://sublime-sunspot-447108-h1.uc.r.appspot.com/logout';

  constructor() {}
}