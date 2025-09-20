import { TestBed } from '@angular/core/testing';

import { RecruiterDataService } from './recruiter-data.service';

describe('RecruiterDataService', () => {
  let service: RecruiterDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RecruiterDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
