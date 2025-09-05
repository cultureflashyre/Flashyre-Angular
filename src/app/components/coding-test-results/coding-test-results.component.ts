import { Component, Input } from '@angular/core';
import { TestResult } from '../../pages/coding-assessment/models';

@Component({
  selector: 'app-test-results',
  templateUrl: './coding-test-results.component.html',
  styleUrls: ['./coding-test-results.component.css']
})
export class TestResultsComponent {
  @Input() testResults: TestResult[] = [];

  getPassedCount(): number {
    return this.testResults.filter(result => result.passed).length;
  }
}