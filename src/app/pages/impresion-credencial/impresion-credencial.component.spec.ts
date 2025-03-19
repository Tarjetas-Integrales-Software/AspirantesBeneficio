import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImpresionCredencialComponent } from './impresion-credencial.component';

describe('ImpresionCredencialComponent', () => {
  let component: ImpresionCredencialComponent;
  let fixture: ComponentFixture<ImpresionCredencialComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImpresionCredencialComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImpresionCredencialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
