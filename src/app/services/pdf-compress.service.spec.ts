import { TestBed } from '@angular/core/testing';

import { PdfCompressService } from './pdf-compress.service';

describe('PdfCompressService', () => {
  let service: PdfCompressService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PdfCompressService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
