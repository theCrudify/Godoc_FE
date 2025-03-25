import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MasterDocCategoriesComponent } from './master-doc-categories.component';

describe('MasterDocCategoriesComponent', () => {
  let component: MasterDocCategoriesComponent;
  let fixture: ComponentFixture<MasterDocCategoriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MasterDocCategoriesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MasterDocCategoriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
