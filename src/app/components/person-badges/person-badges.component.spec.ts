import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PersonBadgesComponent, aiFieldLabel, missingFieldLabel } from './person-badges.component';

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

  it('shows a Needs info badge, and in full mode one chip per missing field with readable names', () => {
    fixture.componentRef.setInput('missingFields', ['skills', 'preferred_location', 'education']);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.needs').length).toBe(1);
    expect(text()).toContain('Needs info');
    expect(text()).toContain('Skills');
    expect(text()).toContain('Preferred location');
    expect(text()).toContain('Education');
    expect(fixture.nativeElement.querySelectorAll('.chip').length).toBe(3);
  });

  it('shows only the Needs info badge when compact, listing the fields in its tooltip', () => {
    fixture.componentRef.setInput('missingFields', ['skills', 'phone']);
    fixture.componentRef.setInput('compact', true);
    fixture.detectChanges();
    const badges = fixture.nativeElement.querySelectorAll('.needs');
    expect(badges.length).toBe(1);
    expect(fixture.nativeElement.querySelectorAll('.chip').length).toBe(0);
    expect((badges[0] as HTMLElement).title).toBe('Still needed: Skills, Phone');
  });

  it('shows Verify for AI-parsed people, as a button only when the user may verify', () => {
    fixture.componentRef.setInput('verificationStatus', 'ai_unverified');
    fixture.componentRef.setInput('aiFilledFields', ['skills']);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button.review')).toBeNull();
    expect(text()).toContain('Verify');

    fixture.componentRef.setInput('canVerify', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button.review')).not.toBeNull();
  });

  it('emits verifyClick when the button is clicked (it never verifies itself) and does not bubble the click', () => {
    fixture.componentRef.setInput('verificationStatus', 'ai_unverified');
    fixture.componentRef.setInput('canVerify', true);
    fixture.detectChanges();
    expect((component as any).verify).toBeUndefined();   // the old inline-verify output is gone
    const emitted: number[] = [];
    component.verifyClick.subscribe(() => emitted.push(1));
    const parentClicks: number[] = [];
    (fixture.nativeElement as HTMLElement).addEventListener('click', () => parentClicks.push(1));
    (fixture.nativeElement.querySelector('button.review') as HTMLButtonElement).click();
    expect(emitted.length).toBe(1);
    expect(parentClicks.length).toBe(0);   // the click is stopped so a row click handler does not also fire
  });

  describe('Needs info click', () => {
    it('is a keyboard-reachable button that emits needsInfoClick and does not bubble the click', () => {
      const emitted: number[] = [];
      component.needsInfoClick.subscribe(() => emitted.push(1));
      fixture.componentRef.setInput('missingFields', ['skills']);
      fixture.componentRef.setInput('compact', true);
      fixture.detectChanges();
      const pill = fixture.nativeElement.querySelector('.needs') as HTMLElement;
      expect(pill.tagName).toBe('BUTTON');            // focusable, Enter and Space activate it
      expect(pill.classList).toContain('clickable');  // pointer cursor
      expect(pill.getAttribute('type')).toBe('button');
      const parentClicks: number[] = [];
      (fixture.nativeElement as HTMLElement).addEventListener('click', () => parentClicks.push(1));
      pill.click();
      expect(emitted.length).toBe(1);
      expect(parentClicks.length).toBe(0);            // a row or name click handler does not also fire
    });

    it('stays a plain, non-clickable pill when nobody listens', () => {
      fixture.componentRef.setInput('missingFields', ['skills']);
      fixture.detectChanges();
      const pill = fixture.nativeElement.querySelector('.needs') as HTMLElement;
      expect(pill.tagName).toBe('SPAN');
      expect(pill.classList).not.toContain('clickable');
    });
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

  it('names AI-filled columns the way the forms do, and prettifies unknown ones', () => {
    expect(aiFieldLabel('latest_education_level')).toBe('Highest qualification');
    expect(aiFieldLabel('phone_number')).toBe('Phone');
    expect(aiFieldLabel('work_experience')).toBe('Current role');
    expect(aiFieldLabel('some_new_field')).toBe('Some new field');
  });

  it('falls back to the raw key for unknown fields', () => {
    expect(missingFieldLabel('skills')).toBe('Skills');
    expect(missingFieldLabel('some_new_field')).toBe('some new field');
  });
});
