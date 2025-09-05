import { Component, Input } from '@angular/core';
import { Problem, TestCase } from '../../pages/coding-assessment/models';

@Component({
  selector: 'app-problem-description',
  templateUrl: './problem-description.component.html',
  styleUrls: ['./problem-description.component.css']
})
export class ProblemDescriptionComponent {
  @Input() problem: Problem | null = null;

  getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'EASY': return 'primary';
      case 'MEDIUM': return 'accent';
      case 'HARD': return 'warn';
      default: return 'primary';
    }
  }
}