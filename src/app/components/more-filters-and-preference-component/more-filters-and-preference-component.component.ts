import { Component, Input, ContentChild, TemplateRef, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'more-filters-and-preference-component',
  templateUrl: 'more-filters-and-preference-component.component.html',
  styleUrls: ['more-filters-and-preference-component.component.css'],
})
export class MoreFiltersAndPreferenceComponent {
  @ContentChild('preferenceText')
  preferenceText: TemplateRef<any>
  @ContentChild('jobRecommendedText')
  jobRecommendedText: TemplateRef<any>

  @Output() closeEvent: EventEmitter<void> = new EventEmitter<void>();
  @Output() applyFiltersEvent: EventEmitter<any> = new EventEmitter<any>(); // Keep this for upward emission

  activeTab: string = 'filters'; // Default to filters

  constructor() {}

  onClose(): void {
    this.closeEvent.emit();
  }

  setTab(tab: string): void {
    this.activeTab = tab;
  }

  // Handler for subcomponent emit
  onApplyFilters(filters: any): void {
    this.applyFiltersEvent.emit(filters);
    // Optionally close or other logic
  }

  // Optional: If you added savePreferenceEvent in sub
  onSavePreference(filters: any): void {
    // Implement as needed, e.g., save to preferences
  }
}