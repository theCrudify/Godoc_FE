import { ComponentFixture, TestBed } from '@angular/core/testing';

import { handoverListApproverComponent } from './handover-list-approver.component';

describe('handoverListApproverComponent', () => {
  let component: handoverListApproverComponent;
  let fixture: ComponentFixture<handoverListApproverComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [handoverListApproverComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(handoverListApproverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
