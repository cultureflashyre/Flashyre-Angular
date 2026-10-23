/// <reference types="google.maps" />
import { Injectable, NgZone } from '@angular/core';
import { Loader } from '@googlemaps/js-api-loader';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PlaceEntry {
  name: string;
  lat: number | null;
  lng: number | null;
}

/**
 * Google Places helper shared by the location inputs. Maps is loaded once (shared promise) and every failure
 * degrades to "no suggestions", so callers can always fall back to free text.
 */
@Injectable({ providedIn: 'root' })
export class LocationAutocompleteService {
  private loadPromise: Promise<boolean> | null = null;
  private google: any;
  private autocomplete: google.maps.places.AutocompleteService | undefined;
  private sessionToken: google.maps.places.AutocompleteSessionToken | undefined;

  constructor(private ngZone: NgZone) {}

  /** Resolves true once Maps (places) is usable, false when it cannot be loaded. Never rejects. */
  ready(): Promise<boolean> {
    if (!this.loadPromise) {
      this.loadPromise = this.init();
    }
    return this.loadPromise;
  }

  private async init(): Promise<boolean> {
    try {
      this.google = await this.loadGoogle();
      this.autocomplete = new this.google.maps.places.AutocompleteService();
      return true;
    } catch (error) {
      console.error('Google Maps could not be loaded; locations fall back to free text.', error);
      return false;
    }
  }

  /** Overridable for tests. Uses an already loaded Maps if the page has one. */
  protected loadGoogle(): Promise<any> {
    const existing = (window as any).google;
    if (existing?.maps?.places) {
      return Promise.resolve(existing);
    }
    const loader = new Loader({
      apiKey: environment.googleMapsApiKey,
      version: 'weekly',
      libraries: ['places']
    });
    return loader.load();
  }

  predictions(term: string): Observable<google.maps.places.AutocompletePrediction[]> {
    return new Observable<google.maps.places.AutocompletePrediction[]>(observer => {
      let cancelled = false;
      const emit = (list: google.maps.places.AutocompletePrediction[]) => {
        if (cancelled) { return; }
        this.ngZone.run(() => { observer.next(list); observer.complete(); });
      };
      if (!term || !term.trim()) {
        emit([]);
        return;
      }
      this.ready().then(ok => {
        if (!ok || !this.autocomplete) { emit([]); return; }
        try {
          if (!this.sessionToken) {
            this.sessionToken = new this.google.maps.places.AutocompleteSessionToken();
          }
          this.autocomplete.getPlacePredictions(
            { input: term, types: ['(regions)'], sessionToken: this.sessionToken },
            (predictions, status) => {
              const okStatus = this.google.maps.places.PlacesServiceStatus.OK;
              emit(status === okStatus && predictions ? predictions : []);
            }
          );
        } catch {
          emit([]);
        }
      });
      return () => { cancelled = true; };
    });
  }

  /** Place details to `{name, lat, lng}`; the name is built as area, city, district, state. */
  resolve(prediction: google.maps.places.AutocompletePrediction): Observable<PlaceEntry> {
    return new Observable<PlaceEntry>(observer => {
      let cancelled = false;
      const emit = (entry: PlaceEntry) => {
        if (cancelled) { return; }
        this.ngZone.run(() => { observer.next(entry); observer.complete(); });
      };
      const fallback = (): PlaceEntry => ({ name: prediction.description, lat: null, lng: null });
      if (!prediction.place_id) {
        emit(fallback());
        return;
      }
      this.ready().then(ok => {
        if (!ok) { emit(fallback()); return; }
        try {
          const places = new this.google.maps.places.PlacesService(document.createElement('div'));
          places.getDetails(
            { placeId: prediction.place_id, fields: ['address_components', 'name', 'geometry'] },
            (place: google.maps.places.PlaceResult | null, status: google.maps.places.PlacesServiceStatus) => {
              if (status === this.google.maps.places.PlacesServiceStatus.OK && place?.address_components) {
                emit(this.toEntry(place, prediction));
              } else {
                emit(fallback());
              }
              this.sessionToken = undefined;
            }
          );
        } catch {
          emit(fallback());
        }
      });
      return () => { cancelled = true; };
    });
  }

  private toEntry(place: google.maps.places.PlaceResult, prediction: google.maps.places.AutocompletePrediction): PlaceEntry {
    let area = '';
    let city = '';
    let district = '';
    let state = '';
    for (const component of place.address_components || []) {
      if (component.types.includes('sublocality') || component.types.includes('neighborhood')) {
        if (!area) { area = component.long_name; }
      } else if (component.types.includes('locality')) {
        city = component.long_name;
      } else if (component.types.includes('administrative_area_level_3') && !district) {
        district = component.long_name;
      } else if (component.types.includes('administrative_area_level_2') && !district) {
        district = component.long_name;
      } else if (component.types.includes('administrative_area_level_1')) {
        state = component.long_name;
      }
    }
    if (!city) { city = prediction.structured_formatting?.main_text || ''; }
    const formatted = [area, city, district, state].filter(Boolean).join(', ');
    const lat = place.geometry?.location?.lat() || null;
    const lng = place.geometry?.location?.lng() || null;
    return { name: formatted || prediction.description, lat, lng };
  }
}
