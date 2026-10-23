import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImportWizardStepperComponent, ImportWizardStep, WizardStepInfo } from './import-wizard-stepper.component';

const STEPS: WizardStepInfo[] = [
  { key: 'upload', label: 'Upload', sub: 'sheet.xlsx' },
  { key: 'map', label: 'Map columns' },
  { key: 'review', label: 'Review rows' },
  { key: 'import', label: 'Import' },
  { key: 'results', label: 'Results' },
];

describe('ImportWizardStepperComponent', () => {
  let fixture: ComponentFixture<ImportWizardStepperComponent>;
  let el: HTMLElement;

  function setup(current: ImportWizardStep, locked = false) {
    fixture = TestBed.createComponent(ImportWizardStepperComponent);
    fixture.componentInstance.steps = STEPS;
    fixture.componentInstance.current = current;
    fixture.componentInstance.locked = locked;
    fixture.detectChanges();
    el = fixture.nativeElement;
  }
  const buttons = () => Array.from(el.querySelectorAll('li button')) as HTMLButtonElement[];

  beforeEach(() => TestBed.configureTestingModule({ imports: [ImportWizardStepperComponent] }));

  it('renders five steps with the current one marked', () => {
    setup('review');
    expect(buttons().length).toBe(5);
    expect(el.querySelector('li.on')?.getAttribute('data-step')).toBe('review');
    expect(el.querySelectorAll('li.done').length).toBe(2);
  });

  it('only done steps are clickable and emit their key', () => {
    setup('review');
    const emitted: ImportWizardStep[] = [];
    fixture.componentInstance.stepSelect.subscribe(k => emitted.push(k));
    expect(buttons().map(b => b.disabled)).toEqual([false, false, true, true, true]);
    buttons()[1].click();
    buttons()[3].click();
    expect(emitted).toEqual(['map']);
  });

  it('nothing is clickable while locked', () => {
    setup('import', true);
    expect(buttons().every(b => b.disabled)).toBeTrue();
  });
});
