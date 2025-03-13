import { TestBed } from '@angular/core/testing';

import { CajerosService } from './cajeros.service';

describe('CajerosService', () => {
  let service: CajerosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CajerosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
