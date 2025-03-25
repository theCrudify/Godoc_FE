import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PackagingMaintenanceComponent } from './packaging-maintenance.component';

describe('PackagingMaintenanceComponent', () => {
  let component: PackagingMaintenanceComponent;
  let fixture: ComponentFixture<PackagingMaintenanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PackagingMaintenanceComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PackagingMaintenanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
