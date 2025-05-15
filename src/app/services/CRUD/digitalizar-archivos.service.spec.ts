import { TestBed } from '@angular/core/testing';

import { DigitalizarArchivosService } from './digitalizar-archivos.service';

describe('DigitalizarArchivosService', () => {
  let service: DigitalizarArchivosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DigitalizarArchivosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
