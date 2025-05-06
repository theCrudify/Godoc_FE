import { ComponentFixture, TestBed } from '@angular/core/testing';

import { handoverEditComponent } from './handover-edit.component';

describe('handoverEditComponent', () => {
  let component: handoverEditComponent;
  let fixture: ComponentFixture<handoverEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [handoverEditComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(handoverEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
