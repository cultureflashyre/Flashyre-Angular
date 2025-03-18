import { Component } from '@angular/core'
import { Title, Meta } from '@angular/platform-browser'
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NgxSpinnerService } from 'ngx-spinner'; // Import NgxSpinnerService

@Component({
  selector: 'candidate-assessment',
  templateUrl: 'candidate-assessment.component.html',
  styleUrls: ['candidate-assessment.component.css'],
})
export class CandidateAssessment {

  candidateName: string = ''; // Initialize to empty string
  candidateProfilePictureUrl: string = 'https://s3-alpha-sig.figma.com/img/b74a/bea4/ebc9cfc1a53c3f5e2e37843d60bf6944?Expires=1735516800&amp;Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&amp;Signature=UtDDP8Rm~420kFe31N8K6pTrPW-xtuqVOImSKApZE7ywdUrTITMSOZ5YVZetsjvZG3k1b1D~td9StRjiaFaGCcKEVBhGFGUHmAwrtXb18YIkOHegCnmo7cBAz3IG2ww4B9DjG9nOaniCMSDG6uKAJpelvB2woG54Yj6dLQLjmRZK8wSIUOr1OJ17LOYjMQgP~QCmOL0gu8oXwIstaAQXvKjI7IGAfGbN8cjVs9JCBD7MEXCOmKgqHXu4Jn-XavYyVpMBTJLhLwkw4OeORgEeBzdYIUtAs3ClpYTmJ7VI0aDxw6cXBL4WobVlcuzTKqr6XJSeU5fYc8efbLynD~v-7g__'; // Default profile picture URL

  raw6b6z: string = ' '
  constructor(
    private title: Title, 
    private meta: Meta, 
    private router: Router, 
    private http: HttpClient,
    private spinner: NgxSpinnerService
  ) {
    this.title.setTitle('Candidate-Assessment - Flashyre')
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Candidate-Assessment - Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ])
  }

  ngOnInit(): void {
    // Show spinner before making the HTTP request
    this.spinner.show();

    this.http.get('http://localhost:8000/profile/get-user-profile-info/', { withCredentials: true })
      .subscribe({
        next: (response: any) => {
          this.candidateName = response.full_name;
          this.candidateProfilePictureUrl = response.profile_picture_url ? response.profile_picture_url : 'https://s3-alpha-sig.figma.com/img/b74a/bea4/ebc9cfc1a53c3f5e2e37843d60bf6944?Expires=1735516800&amp;Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&amp;Signature=UtDDP8Rm~420kFe31N8K6pTrPW-xtuqVOImSKApZE7ywdUrTITMSOZ5YVZetsjvZG3k1b1D~td9StRjiaFaGCcKEVBhGFGUHmAwrtXb18YIkOHegCnmo7cBAz3IG2ww4B9DjG9nOaniCMSDG6uKAJpelvB2woG54Yj6dLQLjmRZK8wSIUOr1OJ17LOYjMQgP~QCmOL0gu8oXwIstaAQXvKjI7IGAfGbN8cjVs9JCBD7MEXCOmKgqHXu4Jn-XavYyVpMBTJLhLwkw4OeORgEeBzdYIUtAs3ClpYTmJ7VI0aDxw6cXBL4WobVlcuzTKqr6XJSeU5fYc8efbLynD~v-7g__';
        },
        error: (error) => {
          console.error('Error fetching profile:', error);
          // Handle the error appropriately (e.g., display a message to the user)
        },
        complete: () => {
          // Hide spinner after request completes
          this.spinner.hide();
        }
      });
  }


  async sapSurvey() {
    this.router.navigate(['/flashyre-assessment1']);
  }
}