// src/app/buffer.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BufferService {

  //private _showBuffer = new BehaviorSubject(false);

  private _showBuffer = new BehaviorSubject<boolean>(false);
  private requestCount = 0;
  
  get showBuffer() {
    return this._showBuffer.asObservable();
  }

  show() {
    console.log('Showing buffer');
    this.requestCount++;
    this._showBuffer.next(true);
  }

  hide() {
    console.log('Showing HIDE');
    this.requestCount--;
    this._showBuffer.next(false);
  }

  //show() {
    //this._showBuffer.next(true);
  //}

  //hide() {
    //this._showBuffer.next(false);
  //}
}
