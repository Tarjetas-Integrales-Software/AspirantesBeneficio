import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AprobadasSsasComponent } from './aprobadas-ssas.component';

describe('AprobadasSsasComponent', () => {
  let component: AprobadasSsasComponent;
  let fixture: ComponentFixture<AprobadasSsasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AprobadasSsasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AprobadasSsasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
