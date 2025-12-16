import { Pipe, PipeTransform } from '@angular/core';
    import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

    @Pipe({
      name: 'safeHtml'
    })
    export class SafeHtmlPipe implements PipeTransform {

      constructor(private sanitizer: DomSanitizer) {}

      transform(value: string): SafeHtml {
        // bypassSecurityTrustHtml should only be used with data
        // that you are 100% sure is safe and properly sanitized
        // on the backend.
        return this.sanitizer.bypassSecurityTrustHtml(value);
      }
    }