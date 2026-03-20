import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-warehouses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './warehouses.html',
  styleUrl: './warehouses.scss'
})
export class WarehousesComponent implements OnInit {
  warehouses: any[] = [];
  isLoading = true;

  isModalOpen = false;
  modalMode: 'add' | 'edit' = 'add';
  currentWarehouse: any = { 
    name: '', location: '', address: '', manager_name: '', capacity_percentage: 0, status: 'Active' 
  };

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}
  //private http: HttpClient คือการใช้ HttpClient เพื่อทำการส่งคำขอ HTTP ไปยังเซิร์ฟเวอร์เพื่อดึงข้อมูลออร์เดอร์จาก API และจัดการกับการตอบกลับที่ได้รับมา โดย HttpClient จะช่วยให้เราสามารถทำงานกับ API ได้อย่างง่ายดายและมีประสิทธิภาพมากขึ้น
  //private cdr: ChangeDetectorRef คือการใช้ ChangeDetectorRef เพื่อบังคับให้ Angular ตรวจสอบการเปลี่ยนแปลงของข้อมูลและอัปเดต UI เมื่อมีการเปลี่ยนแปลงเกิดขึ้น โดยเฉพาะเมื่อมีการอัปเดตข้อมูลที่ไม่ได้เกิดจากการกระทำของ Angular เอง เช่น การรับข้อมูลจาก API หรือการเปลี่ยนแปลงข้อมูลในฟอร์ม

  ngOnInit() {
    this.fetchWarehouses();
  }

  fetchWarehouses() {
    this.http.get('http://localhost:3000/warehouses').subscribe({ 
      // subscribe() คือการสมัครรับข้อมูลจาก Observable ที่ส่งกลับมาจาก HttpClient.get() ซึ่งเป็นวิธีที่ Angular ใช้ในการจัดการกับการทำงานแบบอะซิงโครนัส เมื่อมีการเรียก subscribe() จะทำให้คำขอ HTTP ถูกส่งไปยังเซิร์ฟเวอร์ และเมื่อได้รับการตอบกลับจะเรียกฟังก์ชันที่กำหนดใน next: (res: any) => {...} เพื่อจัดการกับข้อมูลที่ได้รับมา และถ้าเกิดข้อผิดพลาดจะเรียกฟังก์ชันใน error: (err) => {...} เพื่อจัดการกับข้อผิดพลาดนั้น
      next: (res: any) => {
        this.warehouses = res;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => { console.error(err); this.isLoading = false; }
    });
  }

  deleteWarehouse(id: number, name: string) {
    if (confirm(`Are you sure you want to delete warehouse "${name}"?`)) {
      this.http.delete(`http://localhost:3000/warehouses/${id}`).subscribe({
        next: () => this.fetchWarehouses(),
        error: (err) => alert('Failed to delete warehouse.')
      });
    }
  }

  openAddModal() {
    this.modalMode = 'add';
    // เปลี่ยนจาก capacity_percentage เป็น max_capacity
    this.currentWarehouse = { name: '', location: '', address: '', manager_name: '', max_capacity: 1000, status: 'Active' };
    this.isModalOpen = true;
  }

  openEditModal(w: any) {
    this.modalMode = 'edit';
    this.currentWarehouse = { ...w }; // คัดลอกข้อมูลเดิมมาแก้ไข
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  saveWarehouse() {
    if (!this.currentWarehouse.name) {
      alert('Please enter a warehouse name.');
      return;
    }

    if (this.modalMode === 'add') {
      this.http.post('http://localhost:3000/warehouses', this.currentWarehouse).subscribe({
        next: () => { this.closeModal(); this.fetchWarehouses(); },
        error: (err) => alert('Error adding warehouse')
      });
    } else {
      this.http.put(`http://localhost:3000/warehouses/${this.currentWarehouse.id}`, this.currentWarehouse).subscribe({
        next: () => { this.closeModal(); this.fetchWarehouses(); },
        error: (err) => alert('Error updating warehouse')
      });
    }
  }
}