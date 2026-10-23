import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResumeStatusLineComponent } from './resume-status-line.component';

describe('ResumeStatusLineComponent', () => {
  let fixture: ComponentFixture<ResumeStatusLineComponent>;
  let component: ResumeStatusLineComponent;
  const q = (sel: string) => fixture.nativeElement.querySelector(sel) as HTMLElement | null;

  function show(status: any, canRetry = false, busy = false) {
    fixture.componentRef.setInput('status', status);
    fixture.componentRef.setInput('canRetry', canRetry);
    fixture.componentRef.setInput('busy', busy);
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ResumeStatusLineComponent] });
    fixture = TestBed.createComponent(ResumeStatusLineComponent);
    component = fixture.componentInstance;
  });

  it('shows nothing for none, done and a missing status', () => {
    for (const status of ['none', 'done', undefined, null]) {
      show(status, true);
      expect(q('[data-test="resume-status"]')).toBeNull();
    }
  });

  it('processing: "Reading the resume…" with Refresh, and no Retry even for editors', () => {
    show('processing', true);
    expect(q('[data-test="resume-status-text"]')!.textContent).toContain('Reading the resume…');
    expect(q('[data-test="refresh-resume"]')).not.toBeNull();
    expect(q('[data-test="retry-resume"]')).toBeNull();
    let refreshed = 0;
    component.refresh.subscribe(() => refreshed++);
    (q('[data-test="refresh-resume"]') as HTMLButtonElement).click();
    expect(refreshed).toBe(1);
  });

  it('processing shows Refresh in view mode too (it only reloads)', () => {
    show('processing', false);
    expect(q('[data-test="refresh-resume"]')).not.toBeNull();
  });

  it('failed: "Could not read the resume" with Retry for editors', () => {
    show('failed', true);
    expect(q('[data-test="resume-status-text"]')!.textContent).toContain('Could not read the resume');
    expect(q('[data-test="refresh-resume"]')).toBeNull();
    let retried = 0;
    component.retry.subscribe(() => retried++);
    (q('[data-test="retry-resume"]') as HTMLButtonElement).click();
    expect(retried).toBe(1);
  });

  it('unreadable: "The file has no readable text" with Retry for editors', () => {
    show('unreadable', true);
    expect(q('[data-test="resume-status-text"]')!.textContent).toContain('The file has no readable text');
    expect(q('[data-test="retry-resume"]')).not.toBeNull();
  });

  it('hides Retry for people who cannot edit, keeping the message', () => {
    for (const status of ['failed', 'unreadable']) {
      show(status, false);
      expect(q('[data-test="resume-status"]')).not.toBeNull();
      expect(q('[data-test="retry-resume"]')).toBeNull();
    }
  });

  it('disables the buttons while a request is in flight', () => {
    show('failed', true, true);
    expect((q('[data-test="retry-resume"]') as HTMLButtonElement).disabled).toBeTrue();
    show('processing', true, true);
    expect((q('[data-test="refresh-resume"]') as HTMLButtonElement).disabled).toBeTrue();
  });
});
