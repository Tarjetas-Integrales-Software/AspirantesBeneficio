import { TestBed } from '@angular/core/testing';

import { CodigosPostalesService } from './codigos-postales.service';

describe('CodigosPostalesService', () => {
  let service: CodigosPostalesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CodigosPostalesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
