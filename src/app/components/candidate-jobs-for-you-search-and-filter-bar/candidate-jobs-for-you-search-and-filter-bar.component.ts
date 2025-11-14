import { Component } from '@angular/core'
import { DangerousHtmlComponent } from '../dangerous-html/dangerous-html.component'

@Component({
    selector: 'candidate-jobs-for-you-search-and-filter-bar',
    templateUrl: 'candidate-jobs-for-you-search-and-filter-bar.component.html',
    styleUrls: ['candidate-jobs-for-you-search-and-filter-bar.component.css'],
    standalone: true,
    imports: [DangerousHtmlComponent,],
})
export class CandidateJobsForYouSearchAndFilterBar {
  constructor() {}
}
