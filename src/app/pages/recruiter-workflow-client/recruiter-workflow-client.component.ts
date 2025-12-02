import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';

import { RecruiterWorkflowNavbarComponent } from '../../components/recruiter-workflow-navbar/recruiter-workflow-navbar.component';

@Component({
  standalone: true,
  selector: 'recruiter-workflow-client',
  templateUrl: 'recruiter-workflow-client.component.html',
  styleUrls: ['recruiter-workflow-client.component.css'],
  imports: [
    CommonModule, 
    RouterModule, 
    RecruiterWorkflowNavbarComponent
  ]
})
export class RecruiterWorkflowClient {
  constructor(private title: Title, private meta: Meta) {
    this.title.setTitle('Recruiter-Workflow-Client - Flashyre');
    // ... rest of your constructor logic
  }
}