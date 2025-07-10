import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { BufferService } from '../services/buffer.service';

import { finalize, catchError } from 'rxjs/operators';  // Import catchError here
import { throwError } from 'rxjs';  // Import throwError here

@Injectable()
export class BufferInterceptor implements HttpInterceptor {
  constructor(private bufferService: BufferService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.bufferService.show();
    return next.handle(req).pipe(
      finalize(() => this.bufferService.hide()),
      catchError((error) => {
        this.bufferService.hide();
        return throwError(error);
      })
    );
  }
}
