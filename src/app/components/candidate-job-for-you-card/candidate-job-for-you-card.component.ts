import { Component, OnInit, Input, AfterViewInit, ContentChild, TemplateRef, ElementRef, ViewChild, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'candidate-job-for-you-card',
  templateUrl: 'candidate-job-for-you-card.component.html',
  styleUrls: ['candidate-job-for-you-card.component.css'],
})
export class CandidateJobForYouCard implements OnInit, AfterViewInit, OnChanges {
  // --- Component Properties ---
  userProfile: any = {};
  defaultProfilePicture: string = "https://storage.googleapis.com/cv-storage-sample1/placeholder_images/profile-placeholder.jpg";
  
  // This is the main input that receives the score from the parent component.
  // The hardcoded default is removed.
  @Input() matchingScore: number;
  
  // This internal 'score' property is used in the template for display.
  score: number = 0;
  
  // --- View and Content Children ---
  // These allow direct access to elements in the component's template for manipulation.
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

  // --- Lifecycle Hooks ---

  ngOnInit(): void {
    // On initialization, set the internal score from the input property,
    // defaulting to 0 if it's not provided yet.
    this.score = this.matchingScore || 0;
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    const profileData = localStorage.getItem('userProfile');
    if (profileData) {
      this.userProfile = JSON.parse(profileData);
    } else {
      console.log("User Profile NOT fetched in job card");
    }
  }

  ngAfterViewInit(): void {
    // Begin the animation after the view is initialized and UI elements are available.
    // A small timeout ensures the browser has rendered the elements before we try to animate them.
    setTimeout(() => {
      this.animateProgressBar();
    }, 100);
  }

  // This hook is crucial for handling data that arrives asynchronously.
  // It fires every time an @Input() property (like matchingScore) changes.
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['matchingScore'] && !changes['matchingScore'].firstChange) {
      // If the matchingScore input has changed (i.e., the data has arrived from the API),
      // update the internal score and restart the animation with the new value.
      this.score = this.matchingScore || 0;
      this.animateProgressBar();
    }
  }

  // --- Private Helper Functions ---

  /**
   * Determines the color of the progress bar based on the score value.
   * @param value The current percentage (0-100).
   * @returns A CSS color string.
   */
  private getFillColor(value: number): string {
    if (value <= 40) return '#F44336'; // Red
    if (value <= 60) return '#FF9800'; // Orange
    if (value <= 75) return '#2196F3'; // Blue
    if (value <= 84) return '#8BC34A'; // Light Green
    return '#4CAF50'; // Dark Green
  }

  /**
   * Controls the animation of the progress bar from 0 to the final score.
   */
  private animateProgressBar(): void {
    const duration = 1500; // Animation duration in milliseconds
    const startTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1); // Value from 0 to 1

      // Calculate the current percentage value to display during the animation
      const currentPercentage = Math.round(progress * this.score);

      // Update the visual state of the progress bar
      this.updateProgressBar(currentPercentage);

      // Continue the animation until the duration is complete
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    // Start the animation loop
    requestAnimationFrame(animate);
  }

  /**
   * Updates the style properties of the desktop and mobile progress bars.
   * @param percentage The current percentage to display.
   */
  private updateProgressBar(percentage: number): void {
    // Ensure the percentage doesn't exceed the final target score during animation
    const actualPercentage = Math.min(percentage, this.score);
    
    // Update desktop progress bar (the straight line)
    if (this.desktopBar && this.desktopBar.nativeElement) {
      this.desktopBar.nativeElement.style.width = `${actualPercentage}%`;
      this.desktopBar.nativeElement.style.backgroundColor = this.getFillColor(actualPercentage);
    }

    // Update mobile SVG progress bar (the semi-circle)
    if (this.mobileLoader && this.mobileLoader.nativeElement) {
      const radius = 4; // As defined in the SVG path 'A 4 4...'
      const circumference = Math.PI * radius; // Circumference of a semi-circle
      const strokeLength = (actualPercentage / 100) * circumference;
      
      this.mobileLoader.nativeElement.style.strokeDasharray = `${strokeLength}, ${circumference}`;
      this.mobileLoader.nativeElement.style.stroke = this.getFillColor(actualPercentage);
    }
  }
}