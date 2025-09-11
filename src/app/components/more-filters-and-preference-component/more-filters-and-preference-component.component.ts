import { Component, Input, ContentChild, TemplateRef, Output, EventEmitter } from '@angular/core';
import { CandidatePreferenceService } from '../../services/candidate-preference.service'; 

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

  activeTab: string = 'filters';
  savedPreferences: any = null;
  preferenceId: number | null = null;

  constructor(private preferenceService: CandidatePreferenceService) {}

  onClose(): void {
    this.closeEvent.emit();
  }

  ngOnInit(): void {
    this.loadPreferences();
  }

  loadPreferences(): void {
    this.preferenceService.getPreferences().subscribe(
      (data) => {
        if (data && data.length > 0) {
          this.savedPreferences = data[0];
          this.preferenceId = data[0].id;
        }
      },
      (error) => {
        console.error('Error fetching preferences:', error);
      }
    );
  }

  setTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'preferences') {
      this.loadPreferences();
    }
  }

  // Handler for subcomponent emit
  onApplyFilters(filters: any): void {
    this.applyFiltersEvent.emit(filters);
    // Optionally close or other logic
  }

  onSavePreference(filters: any): void {
    if (this.preferenceId) {
      this.preferenceService.updatePreference(this.preferenceId, filters).subscribe(
        (response) => {
          this.savedPreferences = response;
          alert('Preferences updated successfully!');
          this.setTab('preferences');
        },
        (error) => {
          console.error('Error updating preferences:', error);
          alert('Failed to update preferences.');
        }
      );
    } else {
      this.preferenceService.savePreference(filters).subscribe(
        (response) => {
          this.savedPreferences = response;
          this.preferenceId = response.id;
          alert('Preferences saved successfully!');
          this.setTab('preferences');
        },
        (error) => {
          console.error('Error saving preferences:', error);
          alert('Failed to save preferences.');
        }
      );
    }
  }
}