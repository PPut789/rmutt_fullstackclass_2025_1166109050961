import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './suppliers.html',
  styleUrl: './suppliers.scss'
})
export class SuppliersComponent implements OnInit {
  suppliers: any[] = [];
  isLoading = true;

  isModalOpen = false;
  modalMode: 'add' | 'edit' = 'add';
  currentSupplier: any = { name: '', contact_person: '', email: '', phone: '', location: '', status: 'Active' };

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.fetchSuppliers();
  }

  fetchSuppliers() {
    this.http.get('http://localhost:3000/suppliers').subscribe({
      next: (res: any) => {
        this.suppliers = res;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => { console.error(err); this.isLoading = false; }
    });
  }

  deleteSupplier(id: number, name: string) {
    if (confirm(`Are you sure you want to delete supplier "${name}"?`)) {
      this.http.delete(`http://localhost:3000/suppliers/${id}`).subscribe({
        next: () => this.fetchSuppliers(),
        error: (err) => alert('Failed to delete supplier.')
      });
    }
  }

  openAddModal() {
    this.modalMode = 'add';
    this.currentSupplier = { name: '', contact_person: '', email: '', phone: '', location: '', status: 'Active' };
    this.isModalOpen = true;
  }

  openEditModal(s: any) {
    this.modalMode = 'edit';
    this.currentSupplier = { ...s }; // ก๊อปปี้ข้อมูลเดิมมาใส่ฟอร์ม
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  saveSupplier() {
    if (!this.currentSupplier.name) {
      alert('Please enter a supplier name.');
      return;
    }

    if (this.modalMode === 'add') {
      this.http.post('http://localhost:3000/suppliers', this.currentSupplier).subscribe({
        next: () => { this.closeModal(); this.fetchSuppliers(); },
        error: (err) => alert('Error adding supplier')
      });
    } else {
      this.http.put(`http://localhost:3000/suppliers/${this.currentSupplier.id}`, this.currentSupplier).subscribe({
        next: () => { this.closeModal(); this.fetchSuppliers(); },
        error: (err) => alert('Error updating supplier')
      });
    }
  }
}