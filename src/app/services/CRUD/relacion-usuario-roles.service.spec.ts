import { TestBed } from '@angular/core/testing';

import { RelacionUsuarioRolesService } from './relacion-usuario-roles.service';

describe('RelacionUsuarioRolesService', () => {
  let service: RelacionUsuarioRolesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RelacionUsuarioRolesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
