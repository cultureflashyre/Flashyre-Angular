import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'candidate-profile-short',
  templateUrl: 'candidate-profile-short.component.html',
  styleUrls: ['candidate-profile-short.component.css'],
})
export class CandidateProfileShort {
  userProfile: any = {}; // To store user profile data
  defaultProfilePicture: string = "/assets/placeholders/profile-placeholder.jpg";
  @Input()
  placeholderImageAlt: string = 'Image of John Doe'
  @Input()
  placeholderImageSrc: string ='https://images.unsplash.com/photo-1516471835429-167f83503f4b?ixid=M3w5MTMyMXwwfDF8c2VhcmNofDYzfHxjaGVja3xlbnwwfHx8fDE3MzQwODM0Mjh8MA&ixlib=rb-4.0.3&w=300';

  @ContentChild('text')
  text: TemplateRef<any>
  @ContentChild('button')
  button: TemplateRef<any>
  @ContentChild('text1')
  text1: TemplateRef<any>
  @Input()
  rootClassName: string = ''
  constructor() {}

  ngOnInit(): void {    
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    const profileData = localStorage.getItem('userProfile');
    if (profileData) {
      this.userProfile = JSON.parse(profileData);
    } else {
      console.log("User Profile NOT fetched");
    }
  }
}