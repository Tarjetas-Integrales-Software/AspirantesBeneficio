import { TestBed } from '@angular/core/testing';

import { CajerosFotosService } from './cajeros-fotos.service';

describe('CajerosFotosService', () => {
  let service: CajerosFotosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CajerosFotosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
