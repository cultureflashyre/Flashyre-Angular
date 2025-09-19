import { Component, Input, ContentChild, TemplateRef } from '@angular/core'
import { AuthService } from '../../services/candidate.service'; // Import AuthService

@Component({
  selector: 'navbar-for-candidate-view',
  templateUrl: 'navbar-for-candidate-view.component.html',
  styleUrls: ['navbar-for-candidate-view.component.css'],
})
export class NavbarForCandidateView {

  userProfile: any = {};
  defaultProfilePicture: string = "/assets/placeholders/profile-placeholder.jpg";
  public avatarBgColor: string = '#6c757d'; // default fallback color

  @Input()
  rootClassName: string = ''
  @ContentChild('text11')
  text11: TemplateRef<any>
  @ContentChild('text12')
  text12: TemplateRef<any>
  @Input()
  imageSrc1: string = '/assets/main-logo/logo%20-%20flashyre(1500px)-200h.png'
  @ContentChild('link1')
  link1: TemplateRef<any>
  @Input()
  imageSrc4: string =
    'https://s3-alpha-sig.figma.com/img/b74a/bea4/ebc9cfc1a53c3f5e2e37843d60bf6944?Expires=1735516800&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=UtDDP8Rm~420kFe31N8K6pTrPW-xtuqVOImSKApZE7ywdUrTITMSOZ5YVZetsjvZG3k1b1D~td9StRjiaFaGCcKEVBhGFGUHmAwrtXb18YIkOHegCnmo7cBAz3IG2ww4B9DjG9nOaniCMSDG6uKAJpelvB2woG54Yj6dLQLjmRZK8wSIUOr1OJ17LOYjMQgP~QCmOL0gu8oXwIstaAQXvKjI7IGAfGbN8cjVs9JCBD7MEXCOmKgqHXu4Jn-XavYyVpMBTJLhLwkw4OeORgEeBzdYIUtAs3ClpYTmJ7VI0aDxw6cXBL4WobVlcuzTKqr6XJSeU5fYc8efbLynD~v-7g__'
  @Input()
  link1Url: string = ''
  @ContentChild('text8')
  text8: TemplateRef<any>
  @ContentChild('text1')
  text1: TemplateRef<any>
  @ContentChild('link2')
  link2: TemplateRef<any>
  @ContentChild('text31')
  text31: TemplateRef<any>
  @ContentChild('link4')
  link4: TemplateRef<any>
  @ContentChild('text13')
  text13: TemplateRef<any>
  @Input()
  link3Url: string = ''
  @ContentChild('link3')
  link3: TemplateRef<any>
  @ContentChild('text2')
  text2: TemplateRef<any>
  @ContentChild('text5')
  text5: TemplateRef<any>
  @ContentChild('text4')
  text4: TemplateRef<any>
  @ContentChild('text9')
  text9: TemplateRef<any>
  @Input()
  imageSrc3: string =
    'https://s3-alpha-sig.figma.com/img/b74a/bea4/ebc9cfc1a53c3f5e2e37843d60bf6944?Expires=1735516800&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=UtDDP8Rm~420kFe31N8K6pTrPW-xtuqVOImSKApZE7ywdUrTITMSOZ5YVZetsjvZG3k1b1D~td9StRjiaFaGCcKEVBhGFGUHmAwrtXb18YIkOHegCnmo7cBAz3IG2ww4B9DjG9nOaniCMSDG6uKAJpelvB2woG54Yj6dLQLjmRZK8wSIUOr1OJ17LOYjMQgP~QCmOL0gu8oXwIstaAQXvKjI7IGAfGbN8cjVs9JCBD7MEXCOmKgqHXu4Jn-XavYyVpMBTJLhLwkw4OeORgEeBzdYIUtAs3ClpYTmJ7VI0aDxw6cXBL4WobVlcuzTKqr6XJSeU5fYc8efbLynD~v-7g__'
  @ContentChild('text10')
  text10: TemplateRef<any>
  @Input()
  imageAlt3: string =
    'https://s3-alpha-sig.figma.com/img/b74a/bea4/ebc9cfc1a53c3f5e2e37843d60bf6944?Expires=1735516800&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=UtDDP8Rm~420kFe31N8K6pTrPW-xtuqVOImSKApZE7ywdUrTITMSOZ5YVZetsjvZG3k1b1D~td9StRjiaFaGCcKEVBhGFGUHmAwrtXb18YIkOHegCnmo7cBAz3IG2ww4B9DjG9nOaniCMSDG6uKAJpelvB2woG54Yj6dLQLjmRZK8wSIUOr1OJ17LOYjMQgP~QCmOL0gu8oXwIstaAQXvKjI7IGAfGbN8cjVs9JCBD7MEXCOmKgqHXu4Jn-XavYyVpMBTJLhLwkw4OeORgEeBzdYIUtAs3ClpYTmJ7VI0aDxw6cXBL4WobVlcuzTKqr6XJSeU5fYc8efbLynD~v-7g__'
  @Input()
  imageAlt1: string = 'image'
  @Input()
  link4Url: string = ''
  @ContentChild('text7')
  text7: TemplateRef<any>
  @ContentChild('text3')
  text3: TemplateRef<any>
  @Input()
  imageAlt4: string = 'image'
  @ContentChild('text6')
  text6: TemplateRef<any>
  @Input()
  link2Url: string = ''
  
  constructor(
    private authService: AuthService,
  ) {}

  onLogoutClick() {
    this.authService.logout(); // Call the logout method in AuthService
    //this.router.navigate(['/login-candidate']); // Redirect to login page after logout
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  getColorFromString(str: string): string {
    const colors = [
      '#1abc9c', '#3498db', '#9b59b6', '#e67e22', '#e74c3c',
      '#2ecc71', '#34495e', '#16a085', '#27ae60', '#2980b9',
      '#8e44ad', '#d35400', '#c0392b', '#7f8c8d'
    ];

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
      hash = hash & hash; // Convert to 32bit integer
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }

  loadUserProfile(): void {
    const profileData = localStorage.getItem('userProfile');
    if (profileData) {
      this.userProfile = JSON.parse(profileData);
      if (this.userProfile.initials) {
        this.avatarBgColor = this.getColorFromString(this.userProfile.initials);
      }
    } else {
      console.log("User Profile NOT fetched");
    }
  }
  
}