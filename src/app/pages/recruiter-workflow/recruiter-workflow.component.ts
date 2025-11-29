import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';

// Import the child components that this page template uses.
// Adjust the paths below according to your actual folder structure.
import { RecruiterWorkflowNavbarComponent } from '../../components/recruiter-workflow-navbar/recruiter-workflow-navbar.component';
import { CandidateInputFormComponent } from '../../components/candidate-input-form/candidate-input-form.component';
import { RecruiterWorkflowClientInputFormComponent } from '../../components/recruiter-workflow-client-input-form/recruiter-workflow-client-input-form.component';
import { RecruiterWorkflowClientListComponent } from '../../components/recruiter-workflow-client-list/recruiter-workflow-client-list.component';
import { RecruiterWorkflowCandidateListsComponent } from '../../components/recruiter-workflow-candidate-lists/recruiter-workflow-candidate-lists.component';
import { RecruiterWorkflowRequirmentListingComponent } from '../../components/recruiter-workflow-requirment-listing/recruiter-workflow-requirment-listing.component';
import { RequirmentListingFormComponent } from '../../components/requirment-listing-form/requirment-listing-form.component';

@Component({
  selector: 'app-recruiter-workflow', // you can keep 'recruiter-workflow' if you prefer
  standalone: true,
  imports: [
    CommonModule,
    RecruiterWorkflowNavbarComponent,
    CandidateInputFormComponent,
    RecruiterWorkflowClientInputFormComponent,
    RecruiterWorkflowClientListComponent,
    RecruiterWorkflowCandidateListsComponent,
    RecruiterWorkflowRequirmentListingComponent,
    RequirmentListingFormComponent,
  ],
  templateUrl: './recruiter-workflow.component.html',
  styleUrls: ['./recruiter-workflow.component.css'],
})
export class RecruiterWorkflowComponent {
  constructor(private title: Title, private meta: Meta) {
    this.title.setTitle('Recruiter-Workflow - Flashyre');
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Recruiter-Workflow - Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ]);
  }
}
