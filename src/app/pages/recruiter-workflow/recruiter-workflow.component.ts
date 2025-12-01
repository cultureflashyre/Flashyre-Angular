import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';

// Import all necessary components
import { RecruiterWorkflowNavbarComponent } from '../../components/recruiter-workflow-navbar/recruiter-workflow-navbar.component';
import { CandidateInputFormComponent } from '../../components/candidate-input-form/candidate-input-form.component';
import { RecruiterWorkflowCandidateListsComponent } from '../../components/recruiter-workflow-candidate-lists/recruiter-workflow-candidate-lists.component';
import { RequirmentListingFormComponent } from '../../components/requirment-listing-form/requirment-listing-form.component';
import { RecruiterWorkflowRequirmentListingComponent } from '../../components/recruiter-workflow-requirment-listing/recruiter-workflow-requirment-listing.component';
import { RecruiterWorkflowClientInputFormComponent } from '../../components/recruiter-workflow-client-input-form/recruiter-workflow-client-input-form.component';
import { RecruiterWorkflowClientListComponent } from '../../components/recruiter-workflow-client-list/recruiter-workflow-client-list.component';

@Component({
  selector: 'app-recruiter-workflow',
  standalone: true,
  imports: [
    CommonModule,
    RecruiterWorkflowNavbarComponent,
    CandidateInputFormComponent,
    RecruiterWorkflowCandidateListsComponent,
    RequirmentListingFormComponent,
    RecruiterWorkflowRequirmentListingComponent,
    RecruiterWorkflowClientInputFormComponent,
    RecruiterWorkflowClientListComponent,
  ],
  templateUrl: './recruiter-workflow.component.html',
  styleUrls: ['./recruiter-workflow.component.css'],
})
export class RecruiterWorkflowComponent {
  // This state variable controls which main section is visible.
  // We default to 'candidates' to show the candidate section on load.
  activeView: 'candidates' | 'requirements' | 'clients' = 'candidates';

  // This state variable toggles between the form and the list within the candidates view.
  // We default to 'true' to show the form initially.
  showCandidateForm: boolean = true;

  constructor(private title: Title, private meta: Meta) {
    this.title.setTitle('Recruiter-Workflow - Flashyre');
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Recruiter-Workflow - Flashyre',
      },
    ]);
  }

  // This function will be used in the next step to switch from the form to the list
  // upon a successful submission.
  onCandidateCreated(): void {
    this.showCandidateForm = false;
  }
}