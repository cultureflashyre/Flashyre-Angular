import { Component, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser'
import { AssessmentTakenService } from '../../services/assessment-taken.service';

@Component({
  selector: 'assessment-taken-page',
  templateUrl: 'assessment-taken-page.component.html',
  styleUrls: ['assessment-taken-page.component.css'],
})
export class AssessmentTakenPage implements OnInit {
    assessments: any[] = [];

  constructor(
    private title: Title,
    private meta: Meta,
    private assessmentTakenService: AssessmentTakenService
  ) {
    this.title.setTitle('Assessment-Taken-Page - Flashyre');
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Assessment-Taken-Page - Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ]);
  }

  ngOnInit() {
    this.assessmentTakenService.getAllAssessmentScores().subscribe(
      (data) => {
        this.assessments = data;
      },
      (error) => {
        console.error('Error fetching assessment scores', error);
      }
    );
  }

  getFillColor(score: number): string {
    if (score <= 40) return 'red';
    if (score <= 60) return 'orange';
    if (score <= 75) return '#4D91C6';
    if (score <= 84) return 'lightgreen';
    return 'darkgreen';
  }
}