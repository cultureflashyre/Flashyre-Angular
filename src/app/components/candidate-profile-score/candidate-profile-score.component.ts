import { Component, Input, ContentChild, TemplateRef } from '@angular/core';
import { NgClass, NgTemplateOutlet } from '@angular/common';

@Component({
    selector: 'candidate-profile-score',
    templateUrl: './candidate-profile-score.component.html',
    styleUrls: ['./candidate-profile-score.component.css'],
    standalone: true,
    imports: [NgClass, NgTemplateOutlet],
})
export class CandidateProfileScore {
  @ContentChild('text')
  text: TemplateRef<any>;

  @Input()
  rootClassName: string = '';

  @Input()
  profileScore: number = 80; // Input for profile score (0-100)

  constructor() {}
}