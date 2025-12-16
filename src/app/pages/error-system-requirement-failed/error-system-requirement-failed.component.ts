import { Component, OnInit } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { VideoRecorderService } from '../../services/video-recorder.service';

import { RouterModule } from '@angular/router'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

@Component({
  selector: 'error-system-requirement-failed',
  standalone: true,
  imports: [ RouterModule, FormsModule, CommonModule,
  ],
  templateUrl: 'error-system-requirement-failed.component.html',
  styleUrls: ['error-system-requirement-failed.component.css'],
})
export class ErrorSystemRequirementFailed implements OnInit {
  assessmentId: number | null = null;
 
  constructor(
    private title: Title,
    private meta: Meta,
    private router: Router,
    private route: ActivatedRoute,
    private videoRecorder: VideoRecorderService
  ) {
    this.title.setTitle('Error-System-Requirement-Failed - Flashyre');
    this.meta.addTags([
      {
        property: 'og:title',
        content: 'Error-System-Requirement-Failed - Flashyre',
      },
      {
        property: 'og:image',
        content:
          'https://aheioqhobo.cloudimg.io/v7/_playground-bucket-v2.teleporthq.io_/8203932d-6f2d-4493-a7b2-7000ee521aa2/9aea8e9c-27ce-4011-a345-94a92ae2dbf8?org_if_sml=1&force_format=original',
      },
    ]);
  }
 
  ngOnInit() {
    // Retrieve assessmentId from query parameters
    this.route.queryParams.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.assessmentId = +id;
      }
    });
  }
 
  async retry() {
    try {
      // Check camera and microphone access
      const hasCameraAndMic = await this.videoRecorder.checkCameraAndMicrophone();
     
      if (hasCameraAndMic) {
        // Redirect to flashyre-assessment-rules-card with assessmentId
        this.router.navigate(['/flashyre-assessment-rules-card'], {
          queryParams: { id: this.assessmentId }
        });
      } else {
        // Stay on the error page if camera or microphone is not accessible
        console.error('Camera or microphone access denied');
      }
    } catch (error) {
      console.error('Error checking camera and microphone:', error);
      // Stay on the error page if there's an issue
    }
  }
 
  goBack() {
    // Redirect to candidate-assessment page
    this.router.navigate(['/candidate-assessment']);
  }
}
 