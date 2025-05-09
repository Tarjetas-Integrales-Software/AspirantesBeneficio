import { TestBed } from '@angular/core/testing';

import { DigitalizarArchivosServiceService } from './digitalizar-archivos-service.service';

describe('DigitalizarArchivosServiceService', () => {
  let service: DigitalizarArchivosServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DigitalizarArchivosServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
