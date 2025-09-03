import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentosRecibidosComponent } from './documentos-recibidos.component';

describe('DocumentosRecibidosComponent', () => {
  let component: DocumentosRecibidosComponent;
  let fixture: ComponentFixture<DocumentosRecibidosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentosRecibidosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentosRecibidosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
