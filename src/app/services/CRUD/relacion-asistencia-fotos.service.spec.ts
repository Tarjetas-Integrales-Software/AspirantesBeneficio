import { TestBed } from '@angular/core/testing';

import { RelacionAsistenciaFotosService } from './relacion-asistencia-fotos.service';

describe('RelacionAsistenciaFotosService', () => {
  let service: RelacionAsistenciaFotosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RelacionAsistenciaFotosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
