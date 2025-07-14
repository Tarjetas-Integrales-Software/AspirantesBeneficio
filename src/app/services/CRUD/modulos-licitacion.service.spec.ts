import { TestBed } from '@angular/core/testing';

import { ModulosLicitacionService } from './modulos-licitacion.service';

describe('ModulosLicitacionService', () => {
  let service: ModulosLicitacionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ModulosLicitacionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
