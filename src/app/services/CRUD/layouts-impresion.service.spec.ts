import { TestBed } from '@angular/core/testing';

import { LayoutsImpresionService } from './layouts-impresion.service';

describe('LayoutsImpresionService', () => {
  let service: LayoutsImpresionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LayoutsImpresionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
