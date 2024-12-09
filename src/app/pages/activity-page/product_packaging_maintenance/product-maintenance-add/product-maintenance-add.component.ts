import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-product-maintenance-add',
  templateUrl: './product-maintenance-add.component.html',
  styleUrls: ['./product-maintenance-add.component.scss'],
})
export class ProductMaintenanceAddComponent {
  productForm: FormGroup;
  selectedFile: File | null = null;

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.productForm = this.fb.group({
      Product: ['', Validators.required],
      DestinationCountry: ['', Validators.required],
      created_by: ['', Validators.required],
      site: ['', Validators.required],
    });
  }

  // Tangkap file yang dipilih
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
    }
  }

  // Proses pengiriman data produk dan unggah gambar
  onSubmit(): void {
    if (this.productForm.valid && this.selectedFile) {
      const apiCreateProduct = 'http://localhost:4999/api/createProduct';
      const apiUploadCover = 'http://localhost:4999/api/postCover';
  
      // Kirim data produk
      this.http.post(apiCreateProduct, this.productForm.value).subscribe({
        next: (response: any) => {
          console.log('Product created:', response);
  
          // Tangkap ID dari respon API
          const productId = response.id;
          if (!productId) {
            console.error('Product ID is missing from the response');
            alert('Failed to create product. Please try again.');
            return;
          }
  
          // Tanda bahwa ID berhasil ditangkap
          console.log(`Product ID captured successfully: ${productId}`);
          alert(`Product created successfully with ID: ${productId}`);
  
          // Kirim gambar menggunakan ID produk
          if (this.selectedFile) {
            const formData = new FormData();
            formData.append('file', this.selectedFile as Blob); // Pastikan file bukan null
            formData.append('product_id', productId.toString());
  
            // Panggil API kedua
            this.http.post(apiUploadCover, formData).subscribe({
              next: (coverResponse: any) => {
                console.log('Cover uploaded successfully:', coverResponse);
                alert('Product and cover uploaded successfully!');
              },
              error: (coverError) => {
                console.error('Error uploading cover:', coverError);
                alert('Error uploading cover. Please try again.');
              },
            });
          } else {
            alert('No file selected. Please select a file before submitting.');
          }
        },
        error: (err) => {
          console.error('Error creating product:', err);
          alert('Error creating product.');
        },
      });
    } else {
      alert('Please fill all required fields and select a file.');
    }
  }
  
  
  
}
