import { Component, Input } from '@angular/core';

@Component({
  selector: 'admin-page2-component',
  templateUrl: 'admin-page2-component.component.html',
  styleUrls: ['admin-page2-component.component.css'],
})
export class AdminPage2Component {
  @Input()
  rootClassName: string = '';

  // State to control which view is active
  public activeView: 'jd' | 'candidates' = 'jd';

  constructor() {}

  // Methods to switch the view
  showJdView(): void {
    this.activeView = 'jd';
  }

  showCandidatesView(): void {
    this.activeView = 'candidates';
  }
}