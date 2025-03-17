import { Component } from '@angular/core'
import { Title, Meta } from '@angular/platform-browser'
import { Router } from '@angular/router';
import { VideoRecorderService } from '../../services/video-recorder.service';
import { ProctoringService } from '../../services/proctoring.service';

@Component({
  selector: 'flashyre-assessment-rules-card',
  templateUrl: 'flashyre-assessment-rules-card.component.html',
  styleUrls: ['flashyre-assessment-rules-card.component.css'],
})
export class FlashyreAssessmentRulesCard {
  constructor(private title: Title, private meta: Meta, private router: Router,
    private videoRecorder: VideoRecorderService,
    private proctoringService: ProctoringService) {
    this.title.setTitle('Flashyre-Assessment-Rules-Card - Flashyre')
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Flashyre-Assessment-Rules-Card - Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ])
  }

  async startAssessment() {
    this.router.navigate(['/flashyre-assessment1']);
  }
}
