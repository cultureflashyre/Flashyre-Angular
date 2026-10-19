import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PersonBadgesComponent, missingFieldLabel } from './person-badges.component';

describe('PersonBadgesComponent', () => {
  let fixture: ComponentFixture<PersonBadgesComponent>;
  let component: PersonBadgesComponent;
  const text = () => (fixture.nativeElement as HTMLElement).textContent!.replace(/\s+/g, ' ').trim();

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [PersonBadgesComponent] });
    fixture = TestBed.createComponent(PersonBadgesComponent);
    component = fixture.componentInstance;
  });

  it('shows nothing for a complete, verified person', () => {
    fixture.componentRef.setInput('missingFields', []);
    fixture.componentRef.setInput('verificationStatus', 'verified');
    fixture.detectChanges();
    expect(text()).toBe('');
  });

  it('shows one chip per missing field with readable names', () => {
    fixture.componentRef.setInput('missingFields', ['skills', 'preferred_location', 'education']);
    fixture.detectChanges();
    expect(text()).toContain('Skills');
    expect(text()).toContain('Preferred location');
    expect(text()).toContain('Education');
    expect(fixture.nativeElement.querySelectorAll('.missing').length).toBe(3);
  });

  it('shows a single "Missing n" chip when compact, listing the fields in its tooltip', () => {
    fixture.componentRef.setInput('missingFields', ['skills', 'phone']);
    fixture.componentRef.setInput('compact', true);
    fixture.detectChanges();
    const chips = fixture.nativeElement.querySelectorAll('.missing');
    expect(chips.length).toBe(1);
    expect(text()).toContain('Missing 2');
    expect((chips[0] as HTMLElement).title).toBe('Missing: Skills, Phone');
  });

  it('shows Verify for AI-parsed people, as a button only when the user may verify', () => {
    fixture.componentRef.setInput('verificationStatus', 'ai_unverified');
    fixture.componentRef.setInput('aiFilledFields', ['skills']);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button.verify')).toBeNull();
    expect(text()).toContain('Verify');

    fixture.componentRef.setInput('canVerify', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button.verify')).not.toBeNull();
  });

  it('emits verify when the button is clicked and does not bubble the click', () => {
    fixture.componentRef.setInput('verificationStatus', 'ai_unverified');
    fixture.componentRef.setInput('canVerify', true);
    fixture.detectChanges();
    const emitted: number[] = [];
    component.verify.subscribe(() => emitted.push(1));
    const parentClicks: number[] = [];
    (fixture.nativeElement as HTMLElement).addEventListener('click', () => parentClicks.push(1));
    (fixture.nativeElement.querySelector('button.verify') as HTMLButtonElement).click();
    expect(emitted.length).toBe(1);
    expect(parentClicks.length).toBe(0);   // the click is stopped so a row click handler does not also fire
  });

  it('marks legacy people only while they are still incomplete', () => {
    fixture.componentRef.setInput('legacy', true);
    fixture.componentRef.setInput('missingFields', []);
    fixture.detectChanges();
    expect(text()).not.toContain('Legacy');

    fixture.componentRef.setInput('missingFields', ['skills']);
    fixture.detectChanges();
    expect(text()).toContain('Legacy');
  });

  it('describes AI-filled fields in the Verify tooltip', () => {
    fixture.componentRef.setInput('verificationStatus', 'ai_unverified');
    fixture.componentRef.setInput('aiFilledFields', ['latest_education_level', 'skills']);
    fixture.detectChanges();
    expect(component.verifyTitle).toContain('latest education level, skills');
  });

  it('falls back to the raw key for unknown fields', () => {
    expect(missingFieldLabel('skills')).toBe('Skills');
    expect(missingFieldLabel('some_new_field')).toBe('some new field');
  });
});
