import { Component, OnInit, Input, AfterViewInit, ContentChild, TemplateRef, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'candidate-job-for-you-card',
  templateUrl: 'candidate-job-for-you-card.component.html',
  styleUrls: ['candidate-job-for-you-card.component.css'],
})
export class CandidateJobForYouCard implements OnInit, AfterViewInit {
  userProfile: any = {}; // To store user profile data
  defaultProfilePicture: string = "/assets/placeholders/profile-placeholder.jpg";
  @Input() matchingScore: number = 80; // Default value
  score: number = 0;
  
  // Use ViewChild to get direct references to the elements
  @ViewChild('desktopBar') desktopBar: ElementRef;
  @ViewChild('mobileLoader') mobileLoader: ElementRef;

  @ContentChild('text2') text2: TemplateRef<any>;
  @ContentChild('button') button: TemplateRef<any>;
  @ContentChild('text4') text4: TemplateRef<any>;
  @ContentChild('text1') text1: TemplateRef<any>;
  @Input() rootClassName: string = '';
  @ContentChild('text') text: TemplateRef<any>;
  @Input() imageSrc: string =
    'https://s3-alpha-sig.figma.com/img/cb33/d035/72e938963245d419674c3c2e71065794?Expires=1737936000&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=q4HKhJijWG7gIkWWgF~7yllDZKHyqxALVLh-VKU~aa6mkzu0y4 Ascending';
  @ContentChild('button1') button1: TemplateRef<any>;
  @Input() imageAlt: string = 'image';
  @ContentChild('text3') text3: TemplateRef<any>;

  constructor() {}

  ngOnInit(): void {
    // Initialize the score from the input property
    this.score = this.matchingScore;
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

  ngAfterViewInit(): void {
    // Begin the animation after the view is initialized and references are available
    setTimeout(() => {
      this.animateProgressBar();
    }, 0);
  }

  // Function to determine the fill color based on the percentage
  private getFillColor(value: number): string {
    if (value <= 40) return 'red';
    if (value <= 60) return 'orange';
    if (value <= 75) return '#4D91C6'; // Ampere color
    if (value <= 84) return 'lightgreen';
    return 'darkgreen';
  }

  // Function to animate the progress bar
  private animateProgressBar(): void {
    const duration = 2000; // Animation duration in milliseconds
    const startTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1); // Progress between 0 and 1

      // Calculate the current percentage based on animation progress
      // Now correctly animates up to the actual score value instead of always filling to 100%
      const currentPercentage = progress * this.score;

      // Update the progress bar
      this.updateProgressBar(currentPercentage);

      // Continue animation until duration is complete
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    // Start the animation
    animate();
  }

  // Function to update the progress bar width and color
  private updateProgressBar(percentage: number): void {
    // Calculate the actual percentage to display (capped by matchingScore)
    const actualPercentage = Math.min(percentage, this.score);
    
    // Update desktop progress bar using ViewChild reference
    if (this.desktopBar && this.desktopBar.nativeElement) {
      this.desktopBar.nativeElement.style.width = `${actualPercentage}%`;
      this.desktopBar.nativeElement.style.backgroundColor = this.getFillColor(actualPercentage);
    }

    // Update mobile SVG progress bar using ViewChild reference
    if (this.mobileLoader && this.mobileLoader.nativeElement) {
      const radius = 4; // Radius of the SVG circle
      const circumference = 2 * Math.PI * radius;
      const strokeLength = (actualPercentage / 134) * circumference;
      
      this.mobileLoader.nativeElement.style.strokeDasharray = `${strokeLength} ${circumference - strokeLength}`;
      this.mobileLoader.nativeElement.style.stroke = this.getFillColor(actualPercentage);
    }
  }
}