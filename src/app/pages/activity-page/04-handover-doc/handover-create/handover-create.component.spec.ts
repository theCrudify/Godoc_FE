import { ComponentFixture, TestBed } from '@angular/core/testing';

import { handoverCreateComponent } from './handover-create.component';

describe('handoverCreateComponent', () => {
  let component: handoverCreateComponent;
  let fixture: ComponentFixture<handoverCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [handoverCreateComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(handoverCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
