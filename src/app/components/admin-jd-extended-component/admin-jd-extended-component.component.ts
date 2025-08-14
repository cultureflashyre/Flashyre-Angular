import { Component, Input, TemplateRef, ContentChild, OnInit, ViewChild, ElementRef, AfterViewInit, Renderer2, OnDestroy, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil, tap } from 'rxjs/operators';

// Mock Interfaces and Services for demonstration
interface RangeSliderState {
  isDragging: boolean;
  currentMarker: HTMLElement | null;
  container: ElementRef;
  markerLeft: ElementRef;
  markerRight: ElementRef;
  labelLeft: ElementRef;
  labelRight: ElementRef;
  filledSegment: ElementRef;
}

@Component({
  selector: 'admin-jd-extended-component',
  templateUrl: 'admin-jd-extended-component.component.html',
  styleUrls: ['admin-jd-extended-component.component.css'],
})
export class AdminJdExtendedComponent implements OnInit, AfterViewInit, OnDestroy {
  // Inputs and ContentChildren remain the same
  @Input() noticePeriodInputFiledPlaceholder: string = 'Enter Notice Period';
  @Input() roleInputFieldPlaceholder: string = 'Enter Role';
  @Input() rootClassName: string = '';
  @ContentChild('skillText') skillText: TemplateRef<any>;
  @ContentChild('noticePeriodStarText') noticePeriodStarText: TemplateRef<any>;
  // ... other ContentChild decorators

  // --- Form Definition ---
  jdForm: FormGroup;

  // --- Location Autocomplete Properties ---
  isLocationLoading = false;
  locationSuggestions: string[] = [];
  private allLocations = ['Multiple', 'New York, NY, USA', 'Los Angeles, CA, USA', 'Chicago, IL, USA', 'Houston, TX, USA', 'Phoenix, AZ, USA', 'Philadelphia, PA, USA', 'San Antonio, TX, USA', 'San Diego, CA, USA', 'Dallas, TX, USA', 'San Jose, CA, USA', 'London, UK', 'Paris, France', 'Tokyo, Japan', 'Sydney, Australia', 'Toronto, Canada'];
  
  // --- Skills (Tag) Input Properties ---
  selectedSkills: string[] = [];
  skillSuggestions: string[] = [];
  activeSkillSuggestionIndex = -1;
  private allSkills = ['JavaScript', 'HTML', 'CSS', 'React', 'Vue', 'Angular', 'Node.js', 'TypeScript', 'Python', 'Java', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'Go', 'Rust', 'C#', 'C++', 'MongoDB', 'MySQL', 'PostgreSQL', 'Redis', 'GraphQL', 'REST API'];
  @ViewChild('skillInput') skillInput: ElementRef<HTMLInputElement>;
  
  // --- Range Slider Properties ---
  @ViewChild('totalExperienceContainer') totalExperienceContainer: ElementRef;
  @ViewChild('totalMarkerLeft') totalMarkerLeft: ElementRef;
  @ViewChild('totalMarkerRight') totalMarkerRight: ElementRef;
  @ViewChild('totalLabelLeft') totalLabelLeft: ElementRef;
  @ViewChild('totalLabelRight') totalLabelRight: ElementRef;
  @ViewChild('totalFilledSegment') totalFilledSegment: ElementRef;

  @ViewChild('relevantExperienceContainer') relevantExperienceContainer: ElementRef;
  @ViewChild('relevantMarkerLeft') relevantMarkerLeft: ElementRef;
  @ViewChild('relevantMarkerRight') relevantMarkerRight: ElementRef;
  @ViewChild('relevantLabelLeft') relevantLabelLeft: ElementRef;
  @ViewChild('relevantLabelRight') relevantLabelRight: ElementRef;
  @ViewChild('relevantFilledSegment') relevantFilledSegment: ElementRef;

  private totalSliderState: RangeSliderState;
  private relevantSliderState: RangeSliderState;
  private activeSlider: 'total' | 'relevant' | null = null;

  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder, private renderer: Renderer2) {}

  ngOnInit(): void {
    // Initialize the main form group
    this.jdForm = this.fb.group({
      role: [''],
      location: [''],
      noticePeriod: [''],
      skillInput: [''],
      // You can add more controls for the slider values here if needed
    });

    this.setupLocationAutocomplete();
    this.setupSkillsAutocomplete();
  }

  ngAfterViewInit(): void {
    // Setup slider states after the view has been initialized
    this.totalSliderState = this.initSliderState('total');
    this.relevantSliderState = this.initSliderState('relevant');

    // Set initial positions and labels
    this.updateSliderUI(this.totalSliderState, 55, 175);
    this.updateSliderUI(this.relevantSliderState, 55, 175);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- Location Autocomplete Logic ---
  private setupLocationAutocomplete(): void {
    this.jdForm.get('location').valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => {
        this.isLocationLoading = true;
        this.locationSuggestions = [];
      }),
      switchMap(query => this.fetchLocationSuggestions(query)),
      takeUntil(this.destroy$)
    ).subscribe(suggestions => {
      this.isLocationLoading = false;
      this.locationSuggestions = suggestions;
    });
  }

  private fetchLocationSuggestions(query: string): Promise<string[]> {
    return new Promise(resolve => {
      setTimeout(() => {
        if (!query) {
          resolve([]);
          return;
        }
        const queryLower = query.toLowerCase();
        resolve(this.allLocations.filter(loc => loc.toLowerCase().includes(queryLower)));
      }, 500); // Simulate API delay
    });
  }

  selectLocation(location: string): void {
    this.jdForm.get('location').setValue(location, { emitEvent: false });
    this.locationSuggestions = [];
  }

  // --- Skills (Tag) Input Logic ---
  private setupSkillsAutocomplete(): void {
    this.jdForm.get('skillInput').valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(value => {
      if (value) {
        const queryLower = value.toLowerCase();
        this.skillSuggestions = this.allSkills.filter(skill => 
          skill.toLowerCase().includes(queryLower) && !this.selectedSkills.includes(skill)
        );
      } else {
        this.skillSuggestions = [];
      }
      this.activeSkillSuggestionIndex = -1;
    });
  }

  addSkill(skill: string): void {
    if (skill && !this.selectedSkills.includes(skill)) {
      this.selectedSkills.push(skill);
    }
    this.jdForm.get('skillInput').setValue('');
    this.skillSuggestions = [];
  }

  removeSkill(skillToRemove: string): void {
    this.selectedSkills = this.selectedSkills.filter(skill => skill !== skillToRemove);
  }

  onSkillInputKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        if (this.activeSkillSuggestionIndex > -1) {
          this.addSkill(this.skillSuggestions[this.activeSkillSuggestionIndex]);
        } else {
          this.addSkill(this.jdForm.get('skillInput').value.trim());
        }
        break;
      case 'Backspace':
        if (!this.jdForm.get('skillInput').value && this.selectedSkills.length > 0) {
          this.removeSkill(this.selectedSkills[this.selectedSkills.length - 1]);
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.activeSkillSuggestionIndex = (this.activeSkillSuggestionIndex + 1) % this.skillSuggestions.length;
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.activeSkillSuggestionIndex = (this.activeSkillSuggestionIndex - 1 + this.skillSuggestions.length) % this.skillSuggestions.length;
        break;
      case 'Escape':
        this.skillSuggestions = [];
        break;
    }
  }

  // --- Reusable Range Slider Logic ---
  private initSliderState(type: 'total' | 'relevant'): RangeSliderState {
    return {
      isDragging: false,
      currentMarker: null,
      container: this[`${type}ExperienceContainer`],
      markerLeft: this[`${type}MarkerLeft`],
      markerRight: this[`${type}MarkerRight`],
      labelLeft: this[`${type}LabelLeft`],
      labelRight: this[`${type}LabelRight`],
      filledSegment: this[`${type}FilledSegment`],
    };
  }
  
  onMouseDown(event: MouseEvent, sliderType: 'total' | 'relevant'): void {
    event.preventDefault();
    this.activeSlider = sliderType;
    const state = this.activeSlider === 'total' ? this.totalSliderState : this.relevantSliderState;
    state.isDragging = true;
    state.currentMarker = event.target as HTMLElement;
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.activeSlider) return;
    const state = this.activeSlider === 'total' ? this.totalSliderState : this.relevantSliderState;
    if (!state.isDragging) return;

    const rect = state.container.nativeElement.getBoundingClientRect();
    let newLeft = event.clientX - rect.left;

    const minLeft = 0;
    const maxLeft = rect.width - state.currentMarker.offsetWidth;
    newLeft = Math.max(minLeft, Math.min(newLeft, maxLeft));

    const leftPos = parseInt(state.markerLeft.nativeElement.style.left || '0', 10);
    const rightPos = parseInt(state.markerRight.nativeElement.style.left || '0', 10);

    if (state.currentMarker === state.markerLeft.nativeElement) {
      newLeft = Math.min(newLeft, rightPos - state.currentMarker.offsetWidth);
    } else {
      newLeft = Math.max(newLeft, leftPos + state.currentMarker.offsetWidth);
    }

    this.renderer.setStyle(state.currentMarker, 'left', `${newLeft}px`);
    this.updateSliderUI(state);
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    if (this.activeSlider) {
        const state = this.activeSlider === 'total' ? this.totalSliderState : this.relevantSliderState;
        state.isDragging = false;
        state.currentMarker = null;
        this.activeSlider = null;
    }
  }

  private updateSliderUI(state: RangeSliderState, left?: number, right?: number): void {
    const leftPos = left ?? parseInt(state.markerLeft.nativeElement.style.left || '0', 10);
    const rightPos = right ?? parseInt(state.markerRight.nativeElement.style.left || '0', 10);
    const markerWidth = state.markerLeft.nativeElement.offsetWidth;

    if (left !== undefined) this.renderer.setStyle(state.markerLeft.nativeElement, 'left', `${leftPos}px`);
    if (right !== undefined) this.renderer.setStyle(state.markerRight.nativeElement, 'left', `${rightPos}px`);

    // Update filled segment
    this.renderer.setStyle(state.filledSegment.nativeElement, 'left', `${leftPos + (markerWidth / 2)}px`);
    this.renderer.setStyle(state.filledSegment.nativeElement, 'width', `${rightPos - leftPos}px`);

    // Update labels (example conversion, adjust as needed)
    const containerWidth = state.container.nativeElement.offsetWidth;
    const leftValue = Math.round((leftPos / containerWidth) * 20); // Max 20 years
    const rightValue = Math.round((rightPos / containerWidth) * 20);

    state.labelLeft.nativeElement.innerText = `${leftValue}yrs`;
    state.labelRight.nativeElement.innerText = `${rightValue}yrs`;
    this.renderer.setStyle(state.labelLeft.nativeElement, 'left', `${leftPos + (markerWidth / 2)}px`);
    this.renderer.setStyle(state.labelRight.nativeElement, 'left', `${rightPos + (markerWidth / 2)}px`);
  }
}