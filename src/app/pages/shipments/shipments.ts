import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-shipments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shipments.html',
  styleUrl: './shipments.scss'
})
export class ShipmentsComponent implements OnInit {
  shipments: any[] = [];
  orders: any[] = []; // ไว้ทำ Dropdown ให้เลือก Order
  isLoading = true;

  isModalOpen = false;
  modalMode: 'add' | 'edit' = 'add';
  currentShipment: any = { 
    order_id: '', tracking_number: '', carrier_name: '', 
    shipping_date: '', estimated_delivery_date: '', status: 'In Transit' 
  };

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.fetchShipments();
    this.fetchOrders();
  }

  fetchShipments() {
    this.http.get('http://localhost:3000/shipments').subscribe({
      next: (res: any) => {
        this.shipments = res;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => { console.error(err); this.isLoading = false; }
    });
  }

  // ดึงรายการ Order มาเตรียมไว้
  fetchOrders() {
    this.http.get('http://localhost:3000/orders').subscribe((res: any) => this.orders = res);
  }

  deleteShipment(id: number) {
    if (confirm('Are you sure you want to delete this shipment record?')) {
      this.http.delete(`http://localhost:3000/shipments/${id}`).subscribe({
        next: () => this.fetchShipments(),
        error: (err) => alert('Failed to delete shipment.')
      });
    }
  }

  // ... (โค้ดด้านบน fetchShipments, fetchOrders ปล่อยไว้เหมือนเดิม) ...

  // 🌟 ฟังก์ชันใหม่: สุ่มเลข Tracking (เช่น TH202603091234)
  generateTrackingNumber(): string {
    const prefix = 'TH';
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // ดึงวันที่มาต่อกัน
    const randomPart = Math.floor(1000 + Math.random() * 9000); // สุ่มเลข 4 หลัก
    return `${prefix}${datePart}${randomPart}`;
  }

  openAddModal() {
    this.modalMode = 'add';
    const today = new Date().toISOString().split('T')[0];
    
    this.currentShipment = { 
      order_id: '', 
      tracking_number: this.generateTrackingNumber(), // 🌟 ให้มันสร้างเลข Tracking อัตโนมัติเลย
      carrier_name: 'Flash Express', // 🌟 ตั้งค่าเริ่มต้นเป็นขนส่งที่ใช้บ่อย
      shipping_date: today, 
      estimated_delivery_date: '', 
      status: 'Preparing' // เปลี่ยน Default เป็นเตรียมจัดส่ง
    };
    this.isModalOpen = true;
  }

  openEditModal(s: any) {
    this.modalMode = 'edit';
    this.currentShipment = { 
      ...s,
      shipping_date: s.shipping_date ? new Date(s.shipping_date).toISOString().split('T')[0] : '',
      estimated_delivery_date: s.estimated_delivery_date ? new Date(s.estimated_delivery_date).toISOString().split('T')[0] : ''
    };
    this.isModalOpen = true;
  }

  // ... (โค้ด closeModal, saveShipment ด้านล่างปล่อยไว้เหมือนเดิม) ...

  

  closeModal() {
    this.isModalOpen = false;
  }

  saveShipment() {
    if (!this.currentShipment.order_id || !this.currentShipment.tracking_number) {
      alert('Order ID and Tracking Number are required!');
      return;
    }

    if (this.modalMode === 'add') {
      this.http.post('http://localhost:3000/shipments', this.currentShipment).subscribe({
        next: () => { this.closeModal(); this.fetchShipments(); },
        error: (err) => alert('Error adding shipment')
      });
    } else {
      this.http.put(`http://localhost:3000/shipments/${this.currentShipment.id}`, this.currentShipment).subscribe({
        next: () => { this.closeModal(); this.fetchShipments(); },
        error: (err) => alert('Error updating shipment')
      });
    }
  }

  
}