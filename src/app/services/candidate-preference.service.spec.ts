import { TestBed } from '@angular/core/testing';

import { CandidatePreferenceService } from './candidate-preference.service';

describe('CandidatePreferenceService', () => {
  let service: CandidatePreferenceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CandidatePreferenceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
