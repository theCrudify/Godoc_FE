import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthorizationCreateComponent } from './authorization-create.component';

describe('AuthorizationCreateComponent', () => {
  let component: AuthorizationCreateComponent;
  let fixture: ComponentFixture<AuthorizationCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthorizationCreateComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AuthorizationCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
