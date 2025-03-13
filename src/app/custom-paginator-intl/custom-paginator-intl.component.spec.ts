import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomPaginatorIntlComponent } from './custom-paginator-intl.component';

describe('CustomPaginatorIntlComponent', () => {
  let component: CustomPaginatorIntlComponent;
  let fixture: ComponentFixture<CustomPaginatorIntlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomPaginatorIntlComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomPaginatorIntlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
