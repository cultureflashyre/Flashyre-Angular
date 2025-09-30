import { TestBed } from '@angular/core/testing';

import { RecruiterPreferenceService } from './recruiter-preference.service';

describe('RecruiterPreferenceService', () => {
  let service: RecruiterPreferenceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RecruiterPreferenceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
