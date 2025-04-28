import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditProposedChangesComponent } from './edit-proposed-changes.component';

describe('EditProposedChangesComponent', () => {
  let component: EditProposedChangesComponent;
  let fixture: ComponentFixture<EditProposedChangesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditProposedChangesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditProposedChangesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
