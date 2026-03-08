import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-stock-levels',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stock.html',
  styleUrl: './stock.scss'
})
export class StockComponent implements OnInit {
  stockLevels: any[] = [];
  products: any[] = [];
  warehouses: any[] = [];
  isLoading = true;

  isModalOpen = false;
  modalMode: 'add' | 'edit' = 'add';
  currentStock: any = { product_id: '', warehouse_id: '', quantity: 0 };

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.fetchStockLevels();
    this.fetchDropdownData();
  }

  fetchStockLevels() {
    this.http.get('http://localhost:3000/stock-levels').subscribe({
      next: (res: any) => {
        this.stockLevels = res;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => { console.error(err); this.isLoading = false; }
    });
  }

  // ดึงข้อมูลสินค้าและโกดังมาเตรียมไว้ทำ Dropdown ให้เลือก
  fetchDropdownData() {
    this.http.get('http://localhost:3000/products').subscribe((res: any) => this.products = res);
    this.http.get('http://localhost:3000/warehouses').subscribe((res: any) => this.warehouses = res);
  }

  deleteStock(id: number) {
    if (confirm(`Are you sure you want to remove this stock record?`)) {
      this.http.delete(`http://localhost:3000/stock-levels/${id}`).subscribe({
        next: () => this.fetchStockLevels(),
        error: (err) => alert('Failed to delete stock record.')
      });
    }
  }

  openAddModal() {
    this.modalMode = 'add';
    this.currentStock = { product_id: '', warehouse_id: '', quantity: 0 };
    this.isModalOpen = true;
  }

  openEditModal(s: any) {
    this.modalMode = 'edit';
    this.currentStock = { 
      product_id: s.product_id, 
      warehouse_id: s.warehouse_id, 
      quantity: s.current_stock 
    };
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  saveStock() {
    if (!this.currentStock.product_id || !this.currentStock.warehouse_id) {
      alert('Please select both a product and a warehouse.');
      return;
    }

    this.http.post('http://localhost:3000/stock-levels', this.currentStock).subscribe({
      next: () => { 
        this.closeModal(); 
        this.fetchStockLevels(); 
        alert('Stock updated successfully!');
      },
      error: (err) => alert('Error updating stock')
    });
  }
}