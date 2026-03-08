import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.html',
  styleUrl: './orders.scss'
})
export class OrdersComponent implements OnInit {
  orders: any[] = [];
  isLoading = true;

  isModalOpen = false;
  selectedOrder: any = null; // เก็บข้อมูลออร์เดอร์ที่ถูกกดดูรายละเอียด
  newStatus: string = '';

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.fetchOrders();
  }

  fetchOrders() {
    this.http.get('http://localhost:3000/orders').subscribe({
      next: (res: any) => {
        this.orders = res;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => { console.error(err); this.isLoading = false; }
    });
  }

  deleteOrder(id: number) {
    if (confirm(`Are you sure you want to delete this order?`)) {
      this.http.delete(`http://localhost:3000/orders/${id}`).subscribe({
        next: () => this.fetchOrders(),
        error: (err) => alert('Failed to delete order.')
      });
    }
  }

  // เปิดกล่อง Modal ดูรายละเอียด JSON
  openViewModal(order: any) {
    this.selectedOrder = order;
    this.newStatus = order.status; // ตั้งค่าเริ่มต้นให้ตรงกับสถานะปัจจุบัน
    
    // เช็คและแปลง JSON (ถ้าข้อมูลใน DB เป็น string ให้แปลงเป็น object ก่อน)
    if (typeof this.selectedOrder.items_detail === 'string') {
      try {
        this.selectedOrder.items_detail = JSON.parse(this.selectedOrder.items_detail);
      } catch (e) {
        this.selectedOrder.items_detail = [];
      }
    }
    
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedOrder = null;
  }

  // อัปเดตสถานะการจัดส่ง
  updateStatus() {
    if (!this.selectedOrder) return;

    this.http.put(`http://localhost:3000/orders/${this.selectedOrder.id}/status`, { status: this.newStatus })
      .subscribe({
        next: () => {
          alert('Order status updated!');
          this.closeModal();
          this.fetchOrders();
        },
        error: (err) => alert('Error updating status.')
      });
  }
}