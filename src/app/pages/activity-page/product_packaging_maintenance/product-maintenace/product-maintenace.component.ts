import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-product-maintenace',
  templateUrl: './product-maintenace.component.html',
  styleUrls: ['./product-maintenace.component.scss'],
})
export class ProductMaintenaceComponent implements OnInit {
  products: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.http.get<any[]>('http://localhost:4999/api/getProductsWithLatestCover').subscribe(
      (response) => {
        this.products = response;
      },
      (error) => {
        console.error('Failed to load products', error);
      }
    );
  }
}
