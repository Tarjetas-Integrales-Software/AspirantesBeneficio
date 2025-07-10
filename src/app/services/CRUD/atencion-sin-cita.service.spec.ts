import { TestBed } from '@angular/core/testing';

import { AtencionSinCitaService } from './atencion-sin-cita.service';

describe('AtencionSinCitaService', () => {
  let service: AtencionSinCitaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AtencionSinCitaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
