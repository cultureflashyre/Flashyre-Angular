import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';

// Update the import path below if the component exists elsewhere, or create the file if missing.
import { RecruiterWorkflowNavbarComponent } from '../../components/recruiter-workflow-navbar/recruiter-workflow-navbar.component';

@Component({
  selector: 'app-recruiter-super-admin-analytical-module',
  standalone: true,
  imports: [
    CommonModule,
    RecruiterWorkflowNavbarComponent,
  ],
  templateUrl: './recruiter-super-admin-analytical-module.component.html',
  styleUrls: ['./recruiter-super-admin-analytical-module.component.css'],
})
export class RecruiterSuperAdminAnalyticalModuleComponent {
  constructor(private title: Title, private meta: Meta) {
    this.title.setTitle('Recruiter-Super-Admin-Analytical-module - Flashyre');
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Recruiter-Super-Admin-Analytical-module - Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ]);
  }
}
