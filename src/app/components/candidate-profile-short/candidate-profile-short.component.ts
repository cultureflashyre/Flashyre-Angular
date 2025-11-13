import { Component, Input, ContentChild, TemplateRef } from '@angular/core'

@Component({
  selector: 'candidate-profile-short',
  templateUrl: 'candidate-profile-short.component.html',
  styleUrls: ['candidate-profile-short.component.css'],
})
export class CandidateProfileShort {
  userProfile: any = {}; // To store user profile data
  defaultProfilePicture: string = "/assets/placeholders/profile-placeholder.jpg";
  public avatarBgColor: string = '#6c757d'; // default fallback color

  public scoreColor: string;

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

  // --- MODIFICATION: Create a new function to set the color based on the score ---
  setScoreColor(score: number): void {
    if (score >= 90) {
      this.scoreColor = '#059669'; // Dark Green
    } else if (score >= 80) {
      this.scoreColor = '#16A34A'; // Green
    } else {
      this.scoreColor = '#F97316'; // Orange
    }
  }

  getColorFromString(str: string): string {
    const colors = [
      '#1abc9c', '#3498db', '#9b59b6', '#e67e22', '#e74c3c',
      '#2ecc71', '#34495e', '#16a085', '#27ae60', '#2980b9',
      '#8e44ad', '#d35400', '#c0392b', '#7f8c8d',
      '#474748', '#30B63F', '#F6B85C'
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

      // --- MODIFICATION: Call the new function after loading the profile score ---
      if (this.userProfile.profile_completion_score !== null && this.userProfile.profile_completion_score !== undefined) {
        this.setScoreColor(this.userProfile.profile_completion_score);
      }

    } else {
      console.log("User Profile NOT fetched");
    }
  }


}