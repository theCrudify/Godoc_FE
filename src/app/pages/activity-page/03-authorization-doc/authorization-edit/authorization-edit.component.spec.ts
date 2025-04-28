import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthorizationEditComponent } from './authorization-edit.component';

describe('AuthorizationEditComponent', () => {
  let component: AuthorizationEditComponent;
  let fixture: ComponentFixture<AuthorizationEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthorizationEditComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AuthorizationEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
