// an-assessment/src/app/coding-test-results/coding-test-results.component.ts

import { Component, Input, OnChanges, SimpleChanges, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
    selector: 'app-test-results',
    templateUrl: './coding-test-results.component.html',
    styleUrls: ['./coding-test-results.component.css'],
    standalone: true,
    imports: [NgClass]
})
export class CodingTestResultsComponent implements OnChanges {
  @Input() results: string[] = [];
  
  // --- MODIFICATION START ---
  // 1. Create an output event that the parent can listen to.
  @Output() hideResults = new EventEmitter<void>();

  // 2. REMOVE the local 'isVisible' state. The parent will now control visibility.
  // isVisible = true; 
  isMinimized = false;
  // --- MODIFICATION END ---

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['results']) {
      console.log('TestResultsComponent received new results:', this.results);
      this.isMinimized = false;
      // When new results arrive, we don't need to manage visibility here anymore.
      this.cdr.detectChanges();
    }
  }

  // --- MODIFICATION START ---
  // 3. This method no longer toggles a local property. It just emits the event to the parent.
  toggleVisibility() {
    this.hideResults.emit();
  }
  // --- MODIFICATION END ---

  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
    console.log('TestResultsComponent minimized toggled:', this.isMinimized);
    this.cdr.detectChanges();
  }
}