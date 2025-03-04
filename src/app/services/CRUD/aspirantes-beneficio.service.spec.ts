import { TestBed } from '@angular/core/testing';

import { AspirantesBeneficioService } from './aspirantes-beneficio.service';

describe('AspirantesBeneficioService', () => {
  let service: AspirantesBeneficioService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AspirantesBeneficioService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
