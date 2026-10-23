/// <reference types="google.maps" />
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { LocationAutocompleteService } from './location-autocomplete.service';

function installFakeMaps(): any {
  const state = { autocompleteCalls: 0, requests: [] as any[] };
  (window as any).google = {
    maps: {
      places: {
        PlacesServiceStatus: { OK: 'OK', ZERO_RESULTS: 'ZERO_RESULTS' },
        AutocompleteSessionToken: class {},
        AutocompleteService: class {
          constructor() { state.autocompleteCalls++; }
          getPlacePredictions(req: any, cb: any) {
            state.requests.push(req);
            cb([{ description: 'Hubli, Karnataka, India', place_id: 'p1', structured_formatting: { main_text: 'Hubli' } }], 'OK');
          }
        },
        PlacesService: class {
          getDetails(_req: any, cb: any) {
            cb({
              address_components: [
                { long_name: 'Keshwapur', types: ['sublocality'] },
                { long_name: 'Hubli', types: ['locality'] },
                { long_name: 'Dharwad', types: ['administrative_area_level_2'] },
                { long_name: 'Karnataka', types: ['administrative_area_level_1'] },
              ],
              geometry: { location: { lat: () => 15.36, lng: () => 75.12 } },
            }, 'OK');
          }
        },
      },
    },
  };
  return state;
}

describe('LocationAutocompleteService', () => {
  afterEach(() => { delete (window as any).google; });

  it('loads once and returns predictions with the regions type', async () => {
    const state = installFakeMaps();
    const service = TestBed.inject(LocationAutocompleteService);
    expect(await service.ready()).toBeTrue();
    expect(await service.ready()).toBeTrue();
    const list = await firstValueFrom(service.predictions('Hub'));
    expect(list.length).toBe(1);
    expect(state.autocompleteCalls).toBe(1);
    expect(state.requests[0].types).toEqual(['(regions)']);
    expect(state.requests[0].sessionToken).toBeDefined();
  });

  it('returns an empty list for blank terms', async () => {
    installFakeMaps();
    const service = TestBed.inject(LocationAutocompleteService);
    expect(await firstValueFrom(service.predictions('  '))).toEqual([]);
  });

  it('resolves a prediction to area, city, district, state with coordinates', async () => {
    installFakeMaps();
    const service = TestBed.inject(LocationAutocompleteService);
    const entry = await firstValueFrom(service.resolve({ description: 'Hubli', place_id: 'p1' } as any));
    expect(entry).toEqual({ name: 'Keshwapur, Hubli, Dharwad, Karnataka', lat: 15.36, lng: 75.12 });
  });

  it('falls back to the prediction text without a place id', async () => {
    installFakeMaps();
    const service = TestBed.inject(LocationAutocompleteService);
    const entry = await firstValueFrom(service.resolve({ description: 'Somewhere' } as any));
    expect(entry).toEqual({ name: 'Somewhere', lat: null, lng: null });
  });

  it('never throws when Maps fails to load: ready is false and predictions are empty', async () => {
    const service = TestBed.inject(LocationAutocompleteService);
    spyOn<any>(service, 'loadGoogle').and.callFake(() => Promise.reject(new Error('blocked')));
    spyOn(console, 'error');
    expect(await service.ready()).toBeFalse();
    expect(await firstValueFrom(service.predictions('Hub'))).toEqual([]);
    const entry = await firstValueFrom(service.resolve({ description: 'Hubli', place_id: 'p1' } as any));
    expect(entry).toEqual({ name: 'Hubli', lat: null, lng: null });
  });
});
