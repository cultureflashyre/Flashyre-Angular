import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-test-results',
  templateUrl: './coding-test-results.component.html',
  styleUrls: ['./coding-test-results.component.css']
})
export class CodingTestResultsComponent {
  @Input() results: string[] = [];
  isVisible = true; // Set to true for initial visibility
  isMinimized = false;

  toggleVisibility() {
    this.isVisible = !this.isVisible;
  }

  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
  }
}