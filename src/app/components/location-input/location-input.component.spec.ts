import { ComponentFixture, TestBed, discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { LocationInputComponent } from './location-input.component';
import { LocationAutocompleteService, PlaceEntry } from '../../services/location-autocomplete.service';

const HUBLI = { description: 'Hubli, Karnataka, India', place_id: 'p1', structured_formatting: { main_text: 'Hubli' } };
const PUNE = { description: 'Pune, Maharashtra, India', place_id: 'p2', structured_formatting: { main_text: 'Pune' } };

function installFakeMaps(predictions: any[]): void {
  (window as any).google = {
    maps: {
      places: {
        PlacesServiceStatus: { OK: 'OK', ZERO_RESULTS: 'ZERO_RESULTS' },
        AutocompleteSessionToken: class {},
        AutocompleteService: class {
          getPlacePredictions(_req: any, cb: any) {
            cb(predictions.length ? predictions : null, predictions.length ? 'OK' : 'ZERO_RESULTS');
          }
        },
        PlacesService: class {
          getDetails(req: any, cb: any) {
            const hubli = req.placeId === 'p1';
            cb({
              address_components: [
                { long_name: hubli ? 'Hubli' : 'Pune', types: ['locality'] },
                { long_name: hubli ? 'Karnataka' : 'Maharashtra', types: ['administrative_area_level_1'] },
              ],
              geometry: { location: { lat: () => (hubli ? 15.36 : 18.52), lng: () => (hubli ? 75.12 : 73.85) } },
            }, 'OK');
          }
        },
      },
    },
  };
}

describe('LocationInputComponent', () => {
  let fixture: ComponentFixture<LocationInputComponent>;
  let component: LocationInputComponent;
  let emitted: PlaceEntry[][];

  function setup(): void {
    TestBed.configureTestingModule({ imports: [LocationInputComponent] });
    fixture = TestBed.createComponent(LocationInputComponent);
    component = fixture.componentInstance;
    emitted = [];
    component.valueChange.subscribe(v => emitted.push(v));
    fixture.detectChanges();
  }

  function box(): HTMLInputElement { return fixture.nativeElement.querySelector('input'); }

  function type(text: string): void {
    const el = box();
    el.value = text;
    el.dispatchEvent(new Event('input'));
    tick(300);
    fixture.detectChanges();
  }

  function key(k: string): void {
    box().dispatchEvent(new KeyboardEvent('keydown', { key: k, cancelable: true }));
    tick();
    fixture.detectChanges();
  }

  function chips(): string[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.chip')).map((c: any) => c.firstChild.textContent.trim());
  }

  afterEach(() => { delete (window as any).google; });

  // debounceTime keeps an interval alive inside fakeAsync zones
  const run = (fn: () => void) => fakeAsync(() => { fn(); discardPeriodicTasks(); });

  it('shows suggestions after a 300 ms pause and adds the picked place with lat/lng', run(() => {
    installFakeMaps([HUBLI, PUNE]);
    setup();
    const el = box();
    el.value = 'Hub';
    el.dispatchEvent(new Event('input'));
    tick(299);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.suggestions li').length).toBe(0);
    tick(1);
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('.suggestions li');
    expect(items.length).toBe(2);
    items[0].dispatchEvent(new MouseEvent('mousedown', { cancelable: true }));
    tick();
    fixture.detectChanges();
    expect(emitted.length).toBe(1);
    expect(emitted[0]).toEqual([{ name: 'Hubli, Karnataka', lat: 15.36, lng: 75.12 }]);
    expect(chips()).toEqual(['Hubli, Karnataka']);
    expect(box().value).toBe('');
  }));

  it('ignores a duplicate, case-insensitively', run(() => {
    installFakeMaps([HUBLI]);
    setup();
    fixture.componentRef.setInput('value', [{ name: 'HUBLI, KARNATAKA', lat: null, lng: null }]);
    fixture.detectChanges();
    type('Hub');
    fixture.nativeElement.querySelector('.suggestions li').dispatchEvent(new MouseEvent('mousedown', { cancelable: true }));
    tick();
    expect(emitted.length).toBe(0);
    expect(component.value.length).toBe(1);
  }));

  it('supports arrow keys, Enter on the highlighted suggestion and Escape', run(() => {
    installFakeMaps([HUBLI, PUNE]);
    setup();
    type('P');
    key('ArrowDown');
    key('ArrowDown');
    expect(fixture.nativeElement.querySelector('li.active').textContent).toContain('Pune');
    key('ArrowUp');
    expect(fixture.nativeElement.querySelector('li.active').textContent).toContain('Hubli');
    key('Escape');
    expect(fixture.nativeElement.querySelector('.suggestions')).toBeNull();
    key('ArrowDown');
    key('ArrowDown');
    key('Enter');
    expect(emitted[0]).toEqual([{ name: 'Pune, Maharashtra', lat: 18.52, lng: 73.85 }]);
  }));

  it('Enter with no highlighted suggestion resolves the best match', run(() => {
    installFakeMaps([HUBLI]);
    setup();
    type('Hubli');
    key('Enter');
    expect(emitted[0]).toEqual([{ name: 'Hubli, Karnataka', lat: 15.36, lng: 75.12 }]);
  }));

  it('adds typed text as a manual entry when Maps has no match', run(() => {
    installFakeMaps([]);
    setup();
    type('Nowhereville');
    key('Enter');
    expect(emitted[0]).toEqual([{ name: 'Nowhereville', lat: null, lng: null }]);
  }));

  it('adds typed text on comma and when Maps is unavailable (ready is false)', run(() => {
    setup();
    const service = TestBed.inject(LocationAutocompleteService);
    spyOn<any>(service, 'loadGoogle').and.callFake(() => Promise.reject(new Error('blocked')));
    spyOn(console, 'error');
    type('Hubli');
    key(',');
    expect(emitted[0]).toEqual([{ name: 'Hubli', lat: null, lng: null }]);
  }));

  it('filters characters other than letters, comma, space and hyphen', run(() => {
    installFakeMaps([]);
    setup();
    type('Hu8b#li-1');
    expect(box().value).toBe('Hubli-');
  }));

  it('single mode replaces the value', run(() => {
    installFakeMaps([]);
    setup();
    fixture.componentRef.setInput('multiple', false);
    fixture.componentRef.setInput('value', [{ name: 'Old', lat: null, lng: null }]);
    fixture.detectChanges();
    type('Delhi');
    key('Enter');
    expect(emitted[0]).toEqual([{ name: 'Delhi', lat: null, lng: null }]);
    expect(chips()).toEqual(['Delhi']);
  }));

  it('remove button drops a chip', run(() => {
    installFakeMaps([]);
    setup();
    fixture.componentRef.setInput('value', [{ name: 'A', lat: null, lng: null }, { name: 'B', lat: null, lng: null }]);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.chip button').click();
    expect(emitted[0]).toEqual([{ name: 'B', lat: null, lng: null }]);
  }));

  it('disabled hides the input and the remove buttons', () => {
    installFakeMaps([]);
    setup();
    fixture.componentRef.setInput('value', [{ name: 'A', lat: null, lng: null }]);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('input')).toBeNull();
    expect(fixture.nativeElement.querySelector('.chip button')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.chip').length).toBe(1);
  });

  it('flush() adds pending text and resolves only after the lookup finished', run(() => {
    installFakeMaps([HUBLI]);
    setup();
    type('Hubli');
    box().dispatchEvent(new Event('blur'));      // leaving the box starts an asynchronous add
    let done = false;
    component.flush().then(() => done = true);
    expect(component.pending).toBeTrue();
    expect(done).toBeFalse();
    tick();
    expect(done).toBeTrue();
    expect(component.pending).toBeFalse();
    expect(emitted[0]).toEqual([{ name: 'Hubli, Karnataka', lat: 15.36, lng: 75.12 }]);
  }));

  it('flush() resolves at once when nothing is pending', run(() => {
    installFakeMaps([]);
    setup();
    let done = false;
    component.flush().then(() => done = true);
    tick();
    expect(done).toBeTrue();
  }));
});
