import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailProposedChangesComponent } from './detail-proposed-changes.component';

describe('DetailProposedChangesComponent', () => {
  let component: DetailProposedChangesComponent;
  let fixture: ComponentFixture<DetailProposedChangesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DetailProposedChangesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailProposedChangesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
