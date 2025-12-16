import { Component, Input, ContentChild, TemplateRef, OnInit, Output, EventEmitter, SimpleChanges } from '@angular/core'
import { CandidatePreferenceService } from '../../services/candidate-preference.service';
import { MoreFiltersAndPreferenceComponent } from '../more-filters-and-preference-component/more-filters-and-preference-component.component';
import { RecruiterPreferenceService } from 'src/app/services/recruiter-preference.service';
import { NgTemplateOutlet, CommonModule } from '@angular/common';
import { AlertMessageComponent } from '../alert-message/alert-message.component';
@Component({
    selector: 'preference-component',
    templateUrl: 'preference-component.component.html',
    styleUrls: ['preference-component.component.css'],
    standalone: true,
    imports: [NgTemplateOutlet, CommonModule, AlertMessageComponent],
})
export class PreferenceComponent implements OnInit {

  showAlert = false;
  alertMessage = '';
  alertButtons: string[] = [];
  private preferenceToDeleteId: number | null = null;
  private actionToConfirm: string = '';


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
    private candidatePreferenceService: CandidatePreferenceService,
    private recruiterPreferenceService: RecruiterPreferenceService,
    private parent: MoreFiltersAndPreferenceComponent
  ) {}

  @Input() callerType: 'candidate' | 'recruiter' = 'candidate';

  ngOnChanges(changes: SimpleChanges) {
    if (changes['callerType']) {
      if (this.callerType === 'recruiter') {
        this.loadRecruiterPreferences();
      } else {
        this.loadPreferences();
      }
    }
  }

  ngOnInit() {
    //this.loadPreferences();
  }

  loadPreferences() {
    console.log(`[PreferenceComponent] Loading CAND preferences for tab: ${(this.candidatePreferenceService as any).activeTab}`);
    this.candidatePreferenceService.getPreferences().subscribe(
      data => {
        this.preferences = data.map(p => ({ ...p, expanded: false }));
        this.remainingPreferences = 3 - this.preferences.length;
      },
      error => console.error('Error fetching preferences:', error)
    );
  }

  loadRecruiterPreferences() {
    console.log(`[PreferenceComponent] Loading REC preferences for tab: ${this.recruiterPreferenceService.getActiveTab()}`);
    this.recruiterPreferenceService.getPreferences().subscribe(
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

  private openAlert(message: string, buttons: string[], action: string) {
    this.alertMessage = message;
    this.alertButtons = buttons;
    this.actionToConfirm = action;
    this.showAlert = true;
  }

  onAlertButtonClicked(buttonClicked: string) {
    this.showAlert = false;
    const action = buttonClicked.toLowerCase();

    if (action === 'cancel') {
      this.preferenceToDeleteId = null;
      return;
    }

    if (this.actionToConfirm === 'delete' && action === 'delete') {
      this.confirmDelete();
    } else if (this.actionToConfirm === 'add' && action === 'continue') {
      this.parent.setTab('filters');
    }
  }
  
  private confirmDelete() {
    if (this.preferenceToDeleteId === null) return;

    const service = this.callerType === 'recruiter'
      ? this.recruiterPreferenceService
      : this.candidatePreferenceService;
    
    const refreshMethod = this.callerType === 'recruiter'
      ? () => this.loadRecruiterPreferences()
      : () => this.loadPreferences();

    service.deletePreference(this.preferenceToDeleteId).subscribe({
      next: () => {
        refreshMethod();
        this.preferenceToDeleteId = null;
      },
      error: (error) => {
        console.error('Error deleting preference:', error);
        this.preferenceToDeleteId = null;
      }
    });
  }

  deletePreference(id: number) {
    this.preferenceToDeleteId = id;
    this.openAlert('Are you sure you want to delete this preference?', ['Cancel', 'Delete'], 'delete');
  }

  deleteRecruiterPreference(id: number) {
    this.preferenceToDeleteId = id;
    this.openAlert('Are you sure you want to delete this preference?', ['Cancel', 'Delete'], 'delete');
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
