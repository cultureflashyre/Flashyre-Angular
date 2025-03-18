// buffer-overlay.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BufferOverlayService {

  private _showBuffer = new BehaviorSubject(false);

  get showBuffer() {
    return this._showBuffer.asObservable();
  }

  show() {
    this._showBuffer.next(true);
  }

  hide() {
    this._showBuffer.next(false);
  }
}
