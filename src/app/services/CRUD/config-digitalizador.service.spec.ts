import { TestBed } from '@angular/core/testing';

import { ConfigDigitalizadorService } from './config-digitalizador.service';

describe('ConfigDigitalizadorService', () => {
  let service: ConfigDigitalizadorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfigDigitalizadorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
