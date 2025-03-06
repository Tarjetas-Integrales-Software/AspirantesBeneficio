import { TestBed } from '@angular/core/testing';

import { TiposCarrerasService } from './tipos-carreras.service';

describe('TiposCarrerasService', () => {
  let service: TiposCarrerasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TiposCarrerasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
