import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './create-job-progress-bar.component.html',
  styleUrls: ['./create-job-progress-bar.component.css']
})
export class ProgressBarComponent {
  @Input() currentStep: number = 1;
  @Input() steps: string[] = ['Create Job Post', 'Assessment for Job', 'Interview Process'];
}