import { TestBed } from '@angular/core/testing';

import { ChecadorAsistenciaService } from './checador-asistencia.service';

describe('ChecadorAsistenciaService', () => {
  let service: ChecadorAsistenciaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChecadorAsistenciaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
