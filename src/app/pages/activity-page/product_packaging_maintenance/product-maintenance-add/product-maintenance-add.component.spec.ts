import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductMaintenanceAddComponent } from './product-maintenance-add.component';

describe('ProductMaintenanceAddComponent', () => {
  let component: ProductMaintenanceAddComponent;
  let fixture: ComponentFixture<ProductMaintenanceAddComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductMaintenanceAddComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProductMaintenanceAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
