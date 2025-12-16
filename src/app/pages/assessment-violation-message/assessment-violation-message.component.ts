import { Component } from '@angular/core'
import { Title, Meta } from '@angular/platform-browser'
import { Router } from '@angular/router'

import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { NavbarForCandidateView } from 'src/app/components/navbar-for-candidate-view/navbar-for-candidate-view.component'

@Component({
  selector: 'assessment-violation-message',
    standalone: true,
    imports: [
      // 4. List all its dependencies here
      CommonModule, // For *ngIf, *ngFor, etc.
      FormsModule,  // For [(ngModel)]
      RouterModule,
      NavbarForCandidateView,
    ],
  templateUrl: 'assessment-violation-message.component.html',
  styleUrls: ['assessment-violation-message.component.css'],
})
export class AssessmentViolationMessage {
  constructor(
    private title: Title, 
    private meta: Meta,
    private router: Router
  ) {
    this.title.setTitle('Assessment-violation-message - Flashyre')
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Assessment-violation-message - Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ])
  }

  /**
   * Handles the close button click event.
   * Redirects the user to the assessment-taken-page.
   */
  onCloseClick(): void {
    console.log('Close button clicked. Redirecting to assessment-taken-page.');
    this.router.navigate(['/assessment-taken-page']);
  }
}