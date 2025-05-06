import { ComponentFixture, TestBed } from '@angular/core/testing';

import { handoverApproverComponent } from './handover-approver.component';

describe('handoverApproverComponent', () => {
  let component: handoverApproverComponent;
  let fixture: ComponentFixture<handoverApproverComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [handoverApproverComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(handoverApproverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
