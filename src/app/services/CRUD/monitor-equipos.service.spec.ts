import { TestBed } from '@angular/core/testing';

import { MonitorEquiposService } from './monitor-equipos.service';

describe('MonitorEquiposService', () => {
  let service: MonitorEquiposService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MonitorEquiposService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
