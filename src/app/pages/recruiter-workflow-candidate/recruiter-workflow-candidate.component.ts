import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';

// Import the Navbar directly
import { RecruiterWorkflowNavbarComponent } from '../../components/recruiter-workflow-navbar/recruiter-workflow-navbar.component';

@Component({
  standalone: true, // <--- Mark as standalone
  selector: 'recruiter-workflow-candidate',
  templateUrl: 'recruiter-workflow-candidate.component.html',
  styleUrls: ['recruiter-workflow-candidate.component.css'],
  imports: [
    CommonModule, 
    RouterModule, 
    RecruiterWorkflowNavbarComponent // <--- Included directly! No module needed.
  ]
})
export class RecruiterWorkflowCandidate {
  constructor(private title: Title, private meta: Meta) {
    this.title.setTitle('Recruiter-Workflow-Candidate - Flashyre');
    // ... rest of your constructor logic
  }
}