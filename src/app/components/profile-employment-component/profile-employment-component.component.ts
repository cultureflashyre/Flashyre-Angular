import { Component, EventEmitter, Output, Input, ContentChild, TemplateRef, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router'; // Import Router
import { EmploymentService } from '../../services/employment.service';


@Component({
  selector: 'profile-employment-component',
  templateUrl: 'profile-employment-component.component.html',
  styleUrls: ['profile-employment-component.component.css'],
})
export class ProfileEmploymentComponent {
  saveAndNext() {
    throw new Error('Method not implemented.');
  }
  @ContentChild('text') text: TemplateRef<any>;
  @ContentChild('text311') text311: TemplateRef<any>;
  @ContentChild('text7') text7: TemplateRef<any>;
  @Input() rootClassName: string = '';
  @ContentChild('text12') text12: TemplateRef<any>;
  @ContentChild('text3') text3: TemplateRef<any>;
  @ContentChild('text111') text111: TemplateRef<any>;

  @ViewChild('scrollContainer', { static: false }) scrollContainer!: ElementRef;

  positions: any[] = [
    {
      jobTitle: '',
      companyName: '',
      startDate: '',
      endDate: '',
      jobDetails: '',
    },
  ];

  constructor(
    private cdr: ChangeDetectorRef,
    private router: Router,
    private employmentService: EmploymentService,
  ) {}

  ngOnInit(): void {
    this.loadPositionsFromUserProfile();
  }

private loadPositionsFromUserProfile(): void {
  const userProfileString = localStorage.getItem('userProfile');
  if (userProfileString) {
    try {
      const userProfile = JSON.parse(userProfileString);
      if (userProfile.employments && Array.isArray(userProfile.employments) && userProfile.employments.length > 0) {
        this.positions = userProfile.employments.map((emp: any) => ({
          jobTitle: emp.job_title || '',
          companyName: emp.company_name || '',
          startDate: emp.start_date || '',
          endDate: emp.end_date || '',
          jobDetails: emp.job_details || '',
        }));
      }
    } catch (error) {
      console.warn('Error parsing userProfile from localStorage in employment component', error);
      // fallback to initial state with one empty position
    }
  }
}

  // Add a new empty position and scroll to the bottom
  addPosition() {
    this.positions.push({
      jobTitle: '',
      companyName: '',
      startDate: '',
      endDate: '',
      jobDetails: '',
    });
    // Force change detection and scroll to bottom after DOM update
    this.cdr.detectChanges();
    setTimeout(() => {
      this.scrollToBottom();
    }, 0);
  }

  // Remove a position
  removePosition(index: number) {
    if (this.positions.length > 1) {
      this.positions.splice(index, 1);
    }
  }

  // Scroll to the bottom of the component
  scrollToBottom() {
    if (!this.scrollContainer) {
      console.warn('Scroll container not initialized');
      return;
    }
    const container = this.scrollContainer.nativeElement;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;

    console.log('Scroll Height:', scrollHeight, 'Client Height:', clientHeight);

    if (scrollHeight > clientHeight) {
      container.scrollTo({
        top: scrollHeight,
        behavior: 'smooth'
      });
      console.log('Scrolled to bottom:', scrollHeight);
    } else {
      console.log('No scroll needed, content fits within container');
    }
  }

  // Method to get positions data (called by parent)
  getPositions() {
    return this.positions;
  }

  // Reset form after submission
  resetForm() {
    this.positions = [
      {
        jobTitle: '',
        companyName: '',
        startDate: '',
        endDate: '',
        jobDetails: '',
      },
    ];
  }

  // Method to get today's date in YYYY-MM-DD format
  getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  saveEmployment(): Promise<boolean> {
    return new Promise((resolve) => {
      const positions = this.getPositions();
      this.employmentService.saveEmployment(positions).subscribe(
        (response) => {
          console.log('Employment saved successfully:', response);
          this.resetForm(); // Reset form after saving
          // Do NOT navigate here; let parent handle navigation
          resolve(true);
        },
        (error) => {
          console.error('Error saving employment:', error);
          alert('Error saving employment: ' + (error.error?.detail || 'Unknown error'));
          resolve(false);
        }
      );
    });
  }
  

  goToPrevious() {
    this.router.navigate(['/profile-basic-information']);
  }

  skipToEducation() {
    this.router.navigate(['/profile-certification-page']);
  }

}