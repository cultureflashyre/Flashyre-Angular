// src/app/components/dangerous-html/dangerous-html.component.ts

import { Component, Input, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  standalone: true, // Make it a modern, standalone component
  selector: 'dangerous-html', // This matches the tag in your template
  template: `<div [innerHTML]="safeHtmlContent"></div>`
})
export class DangerousHtmlComponent {
  
  safeHtmlContent: SafeHtml;

  constructor(private sanitizer: DomSanitizer) {}

  // This 'setter' will run every time the [html] input changes
  @Input()
  set html(untrustedHtml: string) {
    // Sanitize the HTML to protect against XSS attacks, then trust it
    this.safeHtmlContent = this.sanitizer.bypassSecurityTrustHtml(untrustedHtml);
  }
}