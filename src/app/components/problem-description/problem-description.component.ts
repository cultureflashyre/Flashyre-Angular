import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';

@Component({
  selector: 'app-problem-description',
  templateUrl: './problem-description.component.html',
  styleUrls: ['./problem-description.component.css']
})
export class ProblemDescriptionComponent {
  @Input() problem: any = {};

  constructor(private sanitizer: DomSanitizer) {}

  get parsedDescription(): SafeHtml {
    // Ensure synchronous parsing with marked.parse
    const markdown = this.problem.description ? marked.parse(this.problem.description, { async: false }) as string : '';
    return this.sanitizer.bypassSecurityTrustHtml(markdown);
  }
}