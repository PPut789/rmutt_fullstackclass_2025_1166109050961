import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms'; // 🚨 Import FormsModule สำหรับทำฟอร์ม

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule], // 🚨 อย่าลืมใส่ FormsModule ตรงนี้
  templateUrl: './products.html',
  styleUrl: './products.scss'
})
export class ProductsComponent implements OnInit {
  products: any[] = [];
  categories: any[] = []; // เก็บตัวเลือกหมวดหมู่
  suppliers: any[] = [];  // เก็บตัวเลือกซัพพลายเออร์
  isLoading = true;

  // ตัวแปรสำหรับควบคุม Modal (กล่องเด้ง)
  isModalOpen = false;
  modalMode: 'add' | 'edit' = 'add';
  currentProduct: any = {
    name: '', category_id: '', supplier_id: '', price: null, image_url: ''
  };

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.fetchProducts();
    this.fetchDropdownData(); // ดึงข้อมูล Dropdown มารอไว้เลย
  }

  fetchProducts() {
    this.http.get('http://localhost:3000/products').subscribe({
      next: (res: any) => {
        this.products = res;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => { console.error(err); this.isLoading = false; }
    });
  }

  fetchDropdownData() {
    this.http.get('http://localhost:3000/categories').subscribe((res: any) => {
      this.categories = res;
      this.cdr.detectChanges(); // 🚨 ปลุกหน้าจอให้อัปเดตหมวดหมู่
    });
    this.http.get('http://localhost:3000/suppliers').subscribe((res: any) => {
      this.suppliers = res;
      this.cdr.detectChanges(); // 🚨 ปลุกหน้าจอให้อัปเดตซัพพลายเออร์
    });
  }

  // --- ฟังก์ชันลบ (ของเดิม) ---
  deleteProduct(id: number, name: string) {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      this.http.delete(`http://localhost:3000/products/${id}`).subscribe(() => this.fetchProducts());
    }
  }

  // ==========================================
  // ฟังก์ชันสำหรับ Modal (เพิ่ม / แก้ไข)
  // ==========================================
  
  openAddModal() {
    this.modalMode = 'add';
    // ล้างค่าฟอร์มให้ว่างเปล่า
    this.currentProduct = { name: '', category_id: '', supplier_id: '', price: null, image_url: '' };
    this.isModalOpen = true;
  }

  // ผูกฟังก์ชันนี้กับปุ่มดินสอสีฟ้า
  // ตอนกดแก้ไข ต้องไปค้นหาข้อมูลจากตาราง products ว่าสินค้านี้ category_id อะไร (เพราะใน view ไม่มีให้)
  // แต่เพื่อความง่าย เราดึงมาจาก p ตรงๆ แล้วแมปข้อมูลใส่ฟอร์ม
  openEditModal(p: any) {
    this.modalMode = 'edit';
    
    // 1. ดักจับชื่อตัวแปรทุกรูปแบบ เผื่อหลังบ้านส่งมาชื่อไหนก็รับได้หมด
    const catName = p.category_name || p.category;
    const supName = p.supplier_name || p.supplier;

    // 2. ค้นหาหมวดหมู่และซัพพลายเออร์ให้ตรงกัน
    const cat = this.categories.find(c => c.name === catName);
    const sup = this.suppliers.find(s => s.name === supName);

    this.currentProduct = {
      id: p.product_id || p.id,
      name: p.product_name || p.name,
      
      // 3. 🚨 เคล็ดลับ: เติม .toString() เพื่อบังคับให้เป็นตัวหนังสือ Dropdown จะได้จับคู่เป๊ะๆ!
      category_id: cat ? cat.id.toString() : '',
      supplier_id: sup ? sup.id.toString() : '',
      
      price: p.price || p.Price,
      image_url: p.image_url || p.imageUrl || ''
    };
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  saveProduct() {
    if (this.modalMode === 'add') {
      this.http.post('http://localhost:3000/products', this.currentProduct).subscribe({
        next: () => {
          this.closeModal();
          this.fetchProducts(); // โหลดข้อมูลใหม่
        },
        error: (err) => alert('เกิดข้อผิดพลาดในการเพิ่มสินค้า')
      });
    } else {
      this.http.put(`http://localhost:3000/products/${this.currentProduct.id}`, this.currentProduct).subscribe({
        next: () => {
          this.closeModal();
          this.fetchProducts(); // โหลดข้อมูลใหม่
        },
        error: (err) => alert('เกิดข้อผิดพลาดในการแก้ไขสินค้า')
      });
    }
  }
}