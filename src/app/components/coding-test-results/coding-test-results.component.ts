import { Component, Input, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-test-results',
  templateUrl: './coding-test-results.component.html',
  styleUrls: ['./coding-test-results.component.css']
})
export class CodingTestResultsComponent implements OnChanges {
  @Input() results: string[] = [];
  isVisible = true;
  isMinimized = false;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['results']) {
      console.log('TestResultsComponent received results:', this.results);
      this.isMinimized = false;
      this.isVisible = true;
      this.cdr.detectChanges();
    }
  }

  toggleVisibility() {
    this.isVisible = !this.isVisible;
    console.log('TestResultsComponent visibility toggled:', this.isVisible);
    this.cdr.detectChanges();
  }

  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
    console.log('TestResultsComponent minimized toggled:', this.isMinimized);
    this.cdr.detectChanges();
  }
}