import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModuloOperacionesComponent } from './modulo-operaciones.component';

describe('ModuloOperacionesComponent', () => {
  let component: ModuloOperacionesComponent;
  let fixture: ComponentFixture<ModuloOperacionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModuloOperacionesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModuloOperacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
