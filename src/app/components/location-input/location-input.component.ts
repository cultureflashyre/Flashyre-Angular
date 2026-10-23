/// <reference types="google.maps" />
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { LocationAutocompleteService, PlaceEntry } from '../../services/location-autocomplete.service';

/**
 * Chips plus a Google Places suggestion dropdown. Works as free text when Maps is unavailable: Enter or comma
 * adds what was typed. `[(value)]` is a list of `{name, lat, lng}`; with `multiple=false` it holds at most one.
 */
@Component({
  selector: 'app-location-input',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chips">
      <span class="chip" *ngFor="let l of value; let i = index">{{ l.name }}
        <button type="button" *ngIf="!disabled" (click)="remove(i)" aria-label="Remove">×</button></span>
      <div class="field" *ngIf="!disabled">
        <input #box type="text" autocomplete="off" [placeholder]="placeholder" [value]="term"
               role="combobox" aria-autocomplete="list" [attr.aria-expanded]="open && suggestions.length > 0"
               (input)="onInput(box)" (keydown)="onKeydown($event)" (blur)="onBlur()" />
        <ul class="suggestions" role="listbox" *ngIf="open && suggestions.length">
          <li *ngFor="let s of suggestions; let i = index" role="option" [class.active]="i === highlighted"
              [attr.aria-selected]="i === highlighted" (mousedown)="$event.preventDefault(); pick(s)"
              (mouseenter)="highlighted = i">{{ s.description }}</li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .chips { display: flex; flex-wrap: wrap; gap: 6px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px; }
    .field { position: relative; flex: 1; min-width: 140px; display: flex; }
    input { border: 0; flex: 1; min-width: 0; padding: 2px 4px; font: inherit; font-weight: 400; outline: none; }
    .chip { background: #f1f5f9; border-radius: 999px; padding: 2px 4px 2px 10px; display: inline-flex; gap: 4px; align-items: center; }
    .chip button { border: 0; background: none; cursor: pointer; color: #64748b; font-size: 15px; line-height: 1; }
    .suggestions { position: absolute; top: 100%; left: 0; right: 0; z-index: 20; margin: 4px 0 0; padding: 4px 0; list-style: none;
      background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 8px 24px rgba(15, 23, 42, .15);
      max-height: 220px; overflow: auto; }
    .suggestions li { padding: 6px 10px; cursor: pointer; font-weight: 400; color: #0f172a; }
    .suggestions li.active { background: #f1f5f9; }
  `]
})
export class LocationInputComponent implements OnInit, OnDestroy {
  @Input() multiple = true;
  @Input() disabled = false;
  @Input() placeholder = 'Type a place and press Enter';
  @Input() value: PlaceEntry[] = [];
  @Output() valueChange = new EventEmitter<PlaceEntry[]>();

  term = '';
  suggestions: google.maps.places.AutocompletePrediction[] = [];
  highlighted = -1;
  open = false;

  private input$ = new Subject<string>();
  private sub = new Subscription();
  private inflight = 0;
  private idleWaiters: Array<() => void> = [];

  constructor(private places: LocationAutocompleteService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.sub.add(
      this.input$.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(term => this.places.predictions(term))
      ).subscribe(list => {
        this.suggestions = list;
        this.highlighted = -1;
        this.open = list.length > 0 && !!this.term.trim();
        this.cdr.markForCheck();
      })
    );
  }

  ngOnDestroy(): void { this.sub.unsubscribe(); }

  onInput(box: HTMLInputElement): void {
    box.value = box.value.replace(/[^a-zA-Z, \-]/g, '');
    this.term = box.value;
    if (!this.term.trim()) {
      this.close();
      this.input$.next('');
      return;
    }
    this.input$.next(this.term);
  }

  onKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        if (this.suggestions.length) {
          event.preventDefault();
          this.open = true;
          this.highlighted = (this.highlighted + 1) % this.suggestions.length;
        }
        break;
      case 'ArrowUp':
        if (this.suggestions.length) {
          event.preventDefault();
          this.open = true;
          this.highlighted = this.highlighted <= 0 ? this.suggestions.length - 1 : this.highlighted - 1;
        }
        break;
      case 'Escape':
        if (this.open) { event.preventDefault(); this.close(); }
        break;
      case 'Enter':
        event.preventDefault();
        if (this.open && this.highlighted >= 0 && this.suggestions[this.highlighted]) {
          this.pick(this.suggestions[this.highlighted]);
        } else {
          this.addTyped();
        }
        break;
      case ',':
        event.preventDefault();
        this.addTyped();
        break;
    }
    this.cdr.markForCheck();
  }

  onBlur(): void {
    this.close();
    if (this.term.trim()) { this.addTyped(); }
  }

  /** Picks a suggestion: resolves its details, then adds it. */
  pick(prediction: google.maps.places.AutocompletePrediction): void {
    this.close();
    this.clearTerm();
    this.begin();
    this.places.resolve(prediction).subscribe({
      next: entry => this.add(entry),
      error: () => this.end(),
      complete: () => this.end()
    });
  }

  /** Adds the typed text: the best Places match when there is one, otherwise the text as typed. */
  addTyped(): void {
    const text = this.term.replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
    this.close();
    this.clearTerm();
    if (!text) { return; }
    this.begin();
    this.places.ready().then(ok => {
      if (!ok) { this.add({ name: text, lat: null, lng: null }); this.end(); return; }
      this.places.predictions(text).subscribe({
        next: list => {
          if (list.length) {
            this.begin();
            this.places.resolve(list[0]).subscribe({
              next: entry => this.add(entry),
              error: () => this.end(),
              complete: () => this.end()
            });
          } else {
            this.add({ name: text, lat: null, lng: null });
          }
        },
        error: () => this.end(),
        complete: () => this.end()
      });
    }, () => { this.add({ name: text, lat: null, lng: null }); this.end(); });
  }

  /**
   * Adds any text still being typed and resolves once every pending lookup has finished. A parent calls this
   * before reading `value` (for example on Save), because leaving the box adds the text asynchronously.
   */
  flush(): Promise<void> {
    if (this.term.trim()) { this.addTyped(); }
    if (this.inflight === 0) { return Promise.resolve(); }
    return new Promise<void>(resolve => this.idleWaiters.push(resolve));
  }

  /** True while a typed or picked place is still being resolved. */
  get pending(): boolean { return this.inflight > 0; }

  remove(index: number): void {
    const next = this.value.filter((_, i) => i !== index);
    this.value = next;
    this.valueChange.emit(next);
    this.cdr.markForCheck();
  }

  private add(entry: PlaceEntry): void {
    const name = (entry.name || '').trim();
    if (!name) { return; }
    const clean: PlaceEntry = { name, lat: entry.lat ?? null, lng: entry.lng ?? null };
    let next: PlaceEntry[];
    if (!this.multiple) {
      next = [clean];
    } else if (this.value.some(v => v.name.toLowerCase() === name.toLowerCase())) {
      return;
    } else {
      next = [...this.value, clean];
    }
    this.value = next;
    this.valueChange.emit(next);
    this.cdr.markForCheck();
  }

  private begin(): void { this.inflight++; }

  private end(): void {
    this.inflight = Math.max(0, this.inflight - 1);
    if (this.inflight === 0) { this.idleWaiters.splice(0).forEach(resolve => resolve()); }
  }

  private clearTerm(): void {
    this.term = '';
    this.suggestions = [];
    this.highlighted = -1;
    this.input$.next('');
    this.cdr.markForCheck();
  }

  private close(): void {
    this.open = false;
    this.highlighted = -1;
    this.cdr.markForCheck();
  }
}
