import { ComponentFixture, TestBed } from '@angular/core/testing';

import { handoverDetailComponent } from './handover-detail.component';

describe('handoverDetailComponent', () => {
  let component: handoverDetailComponent;
  let fixture: ComponentFixture<handoverDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [handoverDetailComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(handoverDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
