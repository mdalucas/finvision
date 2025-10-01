import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Installments } from './installments';

describe('Installments', () => {
  let component: Installments;
  let fixture: ComponentFixture<Installments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Installments]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Installments);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
