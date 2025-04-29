import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpcionMenuComponent } from './opcion-menu.component';

describe('OpcionMenuComponent', () => {
  let component: OpcionMenuComponent;
  let fixture: ComponentFixture<OpcionMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpcionMenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OpcionMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
