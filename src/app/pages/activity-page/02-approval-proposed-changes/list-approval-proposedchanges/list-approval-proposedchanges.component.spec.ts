import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListApprovalProposedchangesComponent } from './list-approval-proposedchanges.component';

describe('ListApprovalProposedchangesComponent', () => {
  let component: ListApprovalProposedchangesComponent;
  let fixture: ComponentFixture<ListApprovalProposedchangesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListApprovalProposedchangesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ListApprovalProposedchangesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
