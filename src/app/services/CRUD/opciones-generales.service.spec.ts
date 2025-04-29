import { TestBed } from '@angular/core/testing';

import { OpcionesGeneralesService } from './opciones-generales.service';

describe('OpcionesGeneralesService', () => {
  let service: OpcionesGeneralesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OpcionesGeneralesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
