import { TestBed } from '@angular/core/testing';

import { AspirantesBeneficioFotosService } from './aspirantes-beneficio-fotos.service';

describe('AspirantesBeneficioFotosService', () => {
  let service: AspirantesBeneficioFotosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AspirantesBeneficioFotosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
