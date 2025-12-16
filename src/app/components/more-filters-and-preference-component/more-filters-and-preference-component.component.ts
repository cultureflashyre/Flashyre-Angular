import { Component, Input, ContentChild, TemplateRef, Output, EventEmitter, OnInit, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { PreferenceComponent } from '../preference-component/preference-component.component';
import { NgClass, NgTemplateOutlet, NgIf } from '@angular/common';
import { Morefilterscomponent1 } from '../morefilterscomponent1/morefilterscomponent1.component';

@Component({
    selector: 'more-filters-and-preference-component',
    templateUrl: 'more-filters-and-preference-component.component.html',
    styleUrls: ['more-filters-and-preference-component.component.css'],
    standalone: true,
    imports: [
        NgClass,
        NgTemplateOutlet,
        NgIf,
        Morefilterscomponent1,
        PreferenceComponent,
    ],
})
export class MoreFiltersAndPreferenceComponent implements OnInit, OnChanges {

  @Input() callerType: 'candidate' | 'recruiter' = 'candidate';
  ngOnChanges(changes: SimpleChanges) {
    if (changes['callerType']) {
      console.log('callerType changed:', this.callerType);
      // Now you can react to the change
    }
  }

  @ContentChild('preferenceText')
  preferenceText: TemplateRef<any>
  @ContentChild('jobRecommendedText')
  jobRecommendedText: TemplateRef<any>

  @Output() closeEvent: EventEmitter<void> = new EventEmitter<void>();
  @Output() applyFiltersEvent: EventEmitter<any> = new EventEmitter<any>(); // Keep this for upward emission

  @Input() initialTab: 'filters' | 'preferences' = 'filters';
  activeTab: string = 'filters'; // Default to filters
  public selectedPreferenceData: any = null;
  @ViewChild(PreferenceComponent) private preferenceComponent!: PreferenceComponent;

  constructor() {}

  onClose(): void {
    this.closeEvent.emit();
  }

  setTab(tab: string): void {
    this.activeTab = tab;
    console.log('callerType:', this.callerType);
    if (tab === 'preferences' && this.preferenceComponent) {
      if (this.callerType === 'recruiter') {
        this.preferenceComponent.loadRecruiterPreferences();
      } else {
        this.preferenceComponent.loadPreferences();
      }
    }
  }

  // Handler for subcomponent emit
  onApplyFilters(filters: any): void {
    this.applyFiltersEvent.emit(filters);
    // Optionally close or other logic
  }

  // Optional: If you added savePreferenceEvent in sub
  onSavePreference(filters: any): void {
    console.log("in more-filters-preferences, onSavePreference");
    this.setTab('preferences');
  }

  onApplyPreference(preferenceData: any): void {
    this.selectedPreferenceData = preferenceData;
    this.setTab('filters');
  }

  ngOnInit(): void {
    // When the component loads, set the active tab based on the input
    this.activeTab = this.initialTab;
  }

}