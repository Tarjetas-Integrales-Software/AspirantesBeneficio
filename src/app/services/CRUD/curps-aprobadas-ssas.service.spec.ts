import { TestBed } from '@angular/core/testing';

import { CurpsAprobadasSsasService } from './curps-aprobadas-ssas.service';

describe('CurpsAprobadasSsasService', () => {
  let service: CurpsAprobadasSsasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CurpsAprobadasSsasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
