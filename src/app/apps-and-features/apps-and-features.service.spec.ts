import { inject, TestBed } from '@angular/core/testing';

import { AppsAndFeaturesService } from './apps-and-features.service';

describe('AppsAndFeaturesService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AppsAndFeaturesService]
    });
  });

  it('should be created', inject([AppsAndFeaturesService], (service: AppsAndFeaturesService) => {
    expect(service).toBeTruthy();
  }));
});
