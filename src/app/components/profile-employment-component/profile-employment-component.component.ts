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
        id: null,
        jobTitle: '',
      companyName: '',
      startDate: '',
      endDate: '',
      jobDetails: '',
       errors: {},
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
          id: emp.id || null, // Map the ID from the profile
          jobTitle: emp.job_title || '',
          companyName: emp.company_name || '',
          startDate: emp.start_date || '',
          endDate: emp.end_date || '',
          jobDetails: emp.job_details || '',
          errors: {},
        }));
      }
    } catch (error) {
      console.warn('Error parsing userProfile from localStorage in employment component', error);
    }
  }
}

  // Add a new empty position and scroll to the bottom
  addPosition() {
    this.positions.push({
      id: null,
      jobTitle: '',
      companyName: '',
      startDate: '',
      endDate: '',
      jobDetails: '',
      errors: {}, 
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
      if (window.confirm('Are you sure to remove')) {
        this.positions.splice(index, 1);
      }
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
        id: null,
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

  public isFormEmpty(): boolean {
    // The form is considered empty if there's only one position block
    // and all its fields are still empty strings.
    if (this.positions.length === 1) {
      const firstPosition = this.positions[0];
      return !firstPosition.jobTitle && !firstPosition.companyName &&
             !firstPosition.startDate && !firstPosition.endDate && !firstPosition.jobDetails;
    }
    // If there is more than one position block, the form is not empty.
    return false;
  }

  public validatePositions(): boolean {
  // If the entire form section is empty, it's valid for skipping.
  if (this.isFormEmpty()) {
    return true;
  }

  let isOverallValid = true;

  for (const position of this.positions) {
    // Reset previous errors for this position
    position.errors = {};

    // If the position is partially filled, all mandatory fields are required
    const isPartiallyFilled = position.jobTitle || position.companyName || position.startDate || position.endDate || position.jobDetails;

    if (isPartiallyFilled) {
      if (!position.jobTitle) {
        position.errors.jobTitle = 'Job Title is mandatory';
        isOverallValid = false;
      }
      if (!position.companyName) {
        position.errors.companyName = 'Company Name is mandatory';
        isOverallValid = false;
      }
      if (!position.startDate) {
        position.errors.startDate = 'Start Date is mandatory';
        isOverallValid = false;
      }
      if (!position.jobDetails) {
        position.errors.jobDetails = 'Job Details are mandatory';
        isOverallValid = false;
      }
    }
  }

  return isOverallValid;
}

saveEmployment(): Promise<boolean> {
  return new Promise((resolve) => {
    // First, run validation.
    if (!this.validatePositions()) {
      // If validation fails, resolve as false and stop.
      // The error messages will now be displayed in the UI.
      console.log('Validation failed. User must fill all required fields.');
      resolve(false);
      return;
    }

    // If the form is valid but completely empty, treat as a successful skip.
    if (this.isFormEmpty()) {
      resolve(true);
      return;
    }

    const positions = this.getPositions();
    this.employmentService.saveEmployment(positions).subscribe(
      (response) => {
        console.log('Employment saved successfully:', response);
        this.resetForm();
        resolve(true);
      },
      (error) => {
        console.error('Error saving employment:', error);
        alert('Error saving employment: ' + (error.error?.detail || 'Fill all required fields'));
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