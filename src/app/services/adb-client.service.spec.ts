import { TestBed } from '@angular/core/testing';

import { AdbClientService } from './adb-client.service';

describe('AdbClientService', () => {
  let service: AdbClientService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdbClientService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
