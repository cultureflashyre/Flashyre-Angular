import { Component, Input, ContentChild, TemplateRef, OnInit, Output, EventEmitter } from '@angular/core'
import { CandidatePreferenceService } from '../../services/candidate-preference.service';
import { MoreFiltersAndPreferenceComponent } from '../more-filters-and-preference-component/more-filters-and-preference-component.component';

@Component({
  selector: 'preference-component',
  templateUrl: 'preference-component.component.html',
  styleUrls: ['preference-component.component.css'],
})
export class PreferenceComponent {
  @Output() applyPreference = new EventEmitter<any>();
  @ContentChild('text211')
  text211: TemplateRef<any>
  @ContentChild('text2111')
  text2111: TemplateRef<any>
  @ContentChild('button2')
  button2: TemplateRef<any>
  @Input()
  rootClassName: string = ''
  @ContentChild('text1211')
  text1211: TemplateRef<any>
  @ContentChild('text114')
  text114: TemplateRef<any>
  @ContentChild('text212')
  text212: TemplateRef<any>
  @ContentChild('text22')
  text22: TemplateRef<any>
  @ContentChild('text21')
  text21: TemplateRef<any>
  @ContentChild('text13')
  text13: TemplateRef<any>
  @ContentChild('text1113')
  text1113: TemplateRef<any>
  @ContentChild('text12')
  text12: TemplateRef<any>
  @ContentChild('text1')
  text1: TemplateRef<any>
  @ContentChild('text2')
  text2: TemplateRef<any>
  @ContentChild('text121')
  text121: TemplateRef<any>
  preferences: any[] = [];
  remainingPreferences: number = 0;

  constructor(
    private preferenceService: CandidatePreferenceService,
    private parent: MoreFiltersAndPreferenceComponent
  ) {}

  ngOnInit() {
    this.loadPreferences();
  }

  loadPreferences() {
    this.preferenceService.getPreferences().subscribe(
      data => {
        this.preferences = data.map(p => ({ ...p, expanded: false }));
        this.remainingPreferences = 3 - this.preferences.length;
      },
      error => console.error('Error fetching preferences:', error)
    );
  }

  toggleExpand(preference: any) {
    preference.expanded = !preference.expanded;
  }

  deletePreference(id: number) {
    if (confirm('Are you sure you want to delete this preference?')) {
      this.preferenceService.deletePreference(id).subscribe(
        () => {
          this.loadPreferences(); // Refresh the list of preferences
        },
        error => console.error('Error deleting preference:', error)
      );
    }
  }

  addNewPreference() {
    if (this.preferences.length < 3) {
      this.parent.setTab('filters');
    }
  }

  applyPreferenceToFilters(preference: any): void {
    // We emit the whole preference object.
    this.applyPreference.emit(preference);
  }

}
