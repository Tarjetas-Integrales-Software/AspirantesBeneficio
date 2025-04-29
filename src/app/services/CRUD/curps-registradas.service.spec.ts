import { TestBed } from '@angular/core/testing';

import { CurpsRegistradasService } from './curps-registradas.service';

describe('CurpsRegistradasService', () => {
  let service: CurpsRegistradasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CurpsRegistradasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
