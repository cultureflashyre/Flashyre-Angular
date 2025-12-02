import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';

import { RecruiterWorkflowNavbarComponent } from '../../components/recruiter-workflow-navbar/recruiter-workflow-navbar.component';

@Component({
  standalone: true,
  selector: 'recruiter-workflow-requirement',
  templateUrl: 'recruiter-workflow-requirement.component.html',
  styleUrls: ['recruiter-workflow-requirement.component.css'],
  imports: [
    CommonModule, 
    RouterModule, 
    RecruiterWorkflowNavbarComponent
  ]
})
export class RecruiterWorkflowRequirement {
  constructor(private title: Title, private meta: Meta) {
    this.title.setTitle('Recruiter-Workflow-Requirement - Flashyre');
    // ... rest of your constructor logic
  }
}