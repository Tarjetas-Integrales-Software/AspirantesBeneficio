import { TestBed } from '@angular/core/testing';

import { ArchivosNoCargadosService } from './archivos-no-cargados.service';

describe('ArchivosNoCargadosService', () => {
  let service: ArchivosNoCargadosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ArchivosNoCargadosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
