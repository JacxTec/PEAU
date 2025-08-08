import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ProductosPage } from './productos.page';

describe('ProductosPage', () => {
  let component: ProductosPage;
  let fixture: ComponentFixture<ProductosPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ProductosPage],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
