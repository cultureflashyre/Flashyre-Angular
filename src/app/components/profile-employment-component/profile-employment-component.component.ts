import { Component, EventEmitter, Output, Input, ContentChild, TemplateRef, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router'; // Import Router
import { EmploymentService } from '../../services/employment.service';


@Component({
  selector: 'profile-employment-component',
  templateUrl: 'profile-employment-component.component.html',
  styleUrls: ['profile-employment-component.component.css'],
})
export class ProfileEmploymentComponent {
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

  saveAndNext() {
    const positions = this.getPositions();
    this.employmentService.saveEmployment(positions).subscribe(
      (response) => {
        console.log('Employment saved successfully:', response);
        this.resetForm(); // Reset form after saving
        this.router.navigate(['/profile-certification-page']); // Redirect to profile-education-page-duplicate
      },
      (error) => {
        console.error('Error saving employment:', error);
      }
    );
  }

  goToPrevious() {
    this.router.navigate(['/profile-basic-information']);
  }

  skipToEducation() {
    this.router.navigate(['/profile-certification-page']);
  }

}