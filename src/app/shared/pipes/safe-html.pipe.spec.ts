import { SafeHtmlPipe } from './safe-html.pipe';
import { DomSanitizer } from '@angular/platform-browser';

describe('SafeHtmlPipe', () => {
  it('create an instance', () => {
    const sanitizerMock = {
      bypassSecurityTrustHtml: (val: string) => val
    } as unknown as DomSanitizer;
    const pipe = new SafeHtmlPipe(sanitizerMock);
    expect(pipe).toBeTruthy();
  });
});
