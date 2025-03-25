import { TestBed } from '@angular/core/testing';

import { AspirantesAprobadosService } from './aspirantes-aprobados.service';

describe('AspirantesAprobadosService', () => {
  let service: AspirantesAprobadosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AspirantesAprobadosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
