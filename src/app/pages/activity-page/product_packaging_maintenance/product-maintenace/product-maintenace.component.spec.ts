import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductMaintenaceComponent } from './product-maintenace.component';

describe('ProductMaintenaceComponent', () => {
  let component: ProductMaintenaceComponent;
  let fixture: ComponentFixture<ProductMaintenaceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductMaintenaceComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProductMaintenaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
