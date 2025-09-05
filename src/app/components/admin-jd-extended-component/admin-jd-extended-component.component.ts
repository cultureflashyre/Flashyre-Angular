// src/app/components/admin-jd-extended-component/admin-jd-extended-component.ts

import { Component, Input, OnInit, ViewChild, ElementRef, Renderer2, OnDestroy, HostListener, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil, tap } from 'rxjs/operators';
import { JobDescription } from '../../services/admin.service'; // Ensure correct path

// Interface for managing the state of a range slider instance
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
export class AdminJdExtendedComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  // --- NEW: Inputs to control the component's mode and data ---
  @Input() jobData: JobDescription | null = null;
  @Input() isReadOnly: boolean = false;
  // --- END NEW ---

  // --- Input properties for placeholders ---
  @Input() noticePeriodInputFiledPlaceholder: string = 'Enter Notice Period';
  @Input() roleInputFieldPlaceholder: string = 'Enter Role';
  @Input() rootClassName: string = '';

  // --- Component State and Form Properties ---
  jdForm: FormGroup;
  isLocationLoading = false;
  locationSuggestions: string[] = [];
  private allLocations = ['Multiple', 'New York, NY, USA', 'Los Angeles, CA, USA', 'Chicago, IL, USA', 'Houston, TX, USA', 'Phoenix, AZ, USA', 'Philadelphia, PA, USA', 'San Antonio, TX, USA', 'San Diego, CA, USA', 'Dallas, TX, USA', 'San Jose, CA, USA', 'London, UK', 'Paris, France', 'Tokyo, Japan', 'Sydney, Australia', 'Toronto, Canada'];
  
  selectedSkills: string[] = [];
  skillSuggestions: string[] = [];
  activeSkillSuggestionIndex = -1;
  private allSkills = ['JavaScript', 'HTML', 'CSS', 'React', 'Vue', 'Angular', 'Node.js', 'TypeScript', 'Python', 'Java', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'Go', 'Rust', 'C#', 'C++', 'MongoDB', 'MySQL', 'PostgreSQL', 'Redis', 'GraphQL', 'REST API'];
  
  // --- ViewChild Decorators for DOM element access ---
  @ViewChild('skillInput') skillInput!: ElementRef<HTMLInputElement>;
  
  @ViewChild('totalExperienceContainer') totalExperienceContainer!: ElementRef;
  @ViewChild('totalMarkerLeft') totalMarkerLeft!: ElementRef;
  @ViewChild('totalMarkerRight') totalMarkerRight!: ElementRef;
  @ViewChild('totalLabelLeft') totalLabelLeft!: ElementRef;
  @ViewChild('totalLabelRight') totalLabelRight!: ElementRef;
  @ViewChild('totalFilledSegment') totalFilledSegment!: ElementRef;

  @ViewChild('relevantExperienceContainer') relevantExperienceContainer!: ElementRef;
  @ViewChild('relevantMarkerLeft') relevantMarkerLeft!: ElementRef;
  @ViewChild('relevantMarkerRight') relevantMarkerRight!: ElementRef;
  @ViewChild('relevantLabelLeft') relevantLabelLeft!: ElementRef;
  @ViewChild('relevantLabelRight') relevantLabelRight!: ElementRef;
  @ViewChild('relevantFilledSegment') relevantFilledSegment!: ElementRef;

  private totalSliderState!: RangeSliderState;
  private relevantSliderState!: RangeSliderState;
  private activeSlider: 'total' | 'relevant' | null = null;

  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder, private renderer: Renderer2) {
    // Initialize the form in the constructor
    this.jdForm = this.fb.group({
      role: [''],
      location: [''],
      noticePeriod: [''],
      skillInput: [''],
    });
  }

  ngOnInit(): void {
    this.setupLocationAutocomplete();
    this.setupSkillsAutocomplete();
  }

  ngAfterViewInit(): void {
    // Setup slider states after the view has been initialized and DOM elements are available
    this.totalSliderState = this.initSliderState('total');
    this.relevantSliderState = this.initSliderState('relevant');

    // If data was already passed in before AfterViewInit, populate sliders now
    if (this.jobData) {
      this._positionSlidersFromData(this.jobData);
    } else {
      // Set initial default positions and labels if no data
      this.updateSliderUI(this.totalSliderState, 55, 175);
      this.updateSliderUI(this.relevantSliderState, 55, 175);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // React to changes in input properties
    if (changes['jobData'] && this.jobData) {
      this._populateForm(this.jobData);
    }
    if (changes['isReadOnly']) {
      if (this.isReadOnly) {
        this.jdForm.disable();
      } else {
        this.jdForm.enable();
      }
    }
  }

  private _populateForm(data: JobDescription): void {
    this.jdForm.patchValue({
      role: data.role,
      location: data.location,
      noticePeriod: data.notice_period,
    });
    
    this.selectedSkills = [
      ...(data.must_have_skills || []),
      ...(data.good_to_have_skills || [])
    ];
    
    // Ensure sliders are positioned only after the view is ready
    if (this.totalSliderState && this.relevantSliderState) {
      this._positionSlidersFromData(data);
    }
  }
  
  private _positionSlidersFromData(data: JobDescription): void {
    const maxYears = 20; // The maximum value of our slider range

    const parseExp = (exp: string | null | undefined): number => {
      if (!exp) return 0;
      const parsed = parseInt(exp, 10);
      return isNaN(parsed) ? 0 : parsed;
    };

    const totalMin = parseExp(data.total_experience_min);
    const totalMax = parseExp(data.total_experience_max);
    const relevantMin = parseExp(data.relevant_experience_min);
    const relevantMax = parseExp(data.relevant_experience_max);

    const calculatePosition = (container: HTMLElement, value: number): number => {
      if (!container) return 0;
      const containerWidth = container.offsetWidth;
      const markerWidth = 14;
      const trackWidth = containerWidth - markerWidth;
      return (Math.min(value, maxYears) / maxYears) * trackWidth;
    };
    
    if (this.totalSliderState?.container?.nativeElement) {
      const leftPos = calculatePosition(this.totalSliderState.container.nativeElement, totalMin);
      const rightPos = calculatePosition(this.totalSliderState.container.nativeElement, totalMax);
      this.updateSliderUI(this.totalSliderState, leftPos, rightPos);
    }
    
    if (this.relevantSliderState?.container?.nativeElement) {
      const leftPos = calculatePosition(this.relevantSliderState.container.nativeElement, relevantMin);
      const rightPos = calculatePosition(this.relevantSliderState.container.nativeElement, relevantMax);
      this.updateSliderUI(this.relevantSliderState, leftPos, rightPos);
    }
  }

  private setupLocationAutocomplete(): void {
    this.jdForm.get('location')!.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => { this.isLocationLoading = true; this.locationSuggestions = []; }),
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
        if (!query) { resolve([]); return; }
        const queryLower = query.toLowerCase();
        resolve(this.allLocations.filter(loc => loc.toLowerCase().includes(queryLower)));
      }, 500);
    });
  }

  selectLocation(location: string): void {
    this.jdForm.get('location')!.setValue(location, { emitEvent: false });
    this.locationSuggestions = [];
  }

  private setupSkillsAutocomplete(): void {
    this.jdForm.get('skillInput')!.valueChanges.pipe(
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
    this.jdForm.get('skillInput')!.setValue('');
    this.skillSuggestions = [];
  }

  removeSkill(skillToRemove: string): void {
    this.selectedSkills = this.selectedSkills.filter(skill => skill !== skillToRemove);
  }

  onSkillInputKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        if (this.activeSkillSuggestionIndex > -1 && this.skillSuggestions[this.activeSkillSuggestionIndex]) {
          this.addSkill(this.skillSuggestions[this.activeSkillSuggestionIndex]);
        } else {
          this.addSkill(this.jdForm.get('skillInput')!.value.trim());
        }
        break;
      case 'Backspace':
        if (!this.jdForm.get('skillInput')!.value && this.selectedSkills.length > 0) {
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
    if (this.isReadOnly) { event.preventDefault(); return; }
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
    if (!state.isDragging || !state.currentMarker) return;

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

    this.renderer.setStyle(state.filledSegment.nativeElement, 'left', `${leftPos + (markerWidth / 2)}px`);
    this.renderer.setStyle(state.filledSegment.nativeElement, 'width', `${rightPos - leftPos}px`);

    const containerWidth = state.container.nativeElement.offsetWidth - markerWidth;
    const leftValue = Math.round((leftPos / containerWidth) * 20);
    const rightValue = Math.round((rightPos / containerWidth) * 20);

    state.labelLeft.nativeElement.innerText = `${leftValue}yrs`;
    state.labelRight.nativeElement.innerText = `${rightValue}yrs`;
    this.renderer.setStyle(state.labelLeft.nativeElement, 'left', `${leftPos}px`);
    this.renderer.setStyle(state.labelRight.nativeElement, 'left', `${rightPos}px`);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}