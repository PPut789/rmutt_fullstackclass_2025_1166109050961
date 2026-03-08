import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categories.html',
  styleUrl: './categories.scss'
})
export class CategoriesComponent implements OnInit {
  categories: any[] = [];
  isLoading = true;

  // ตัวแปรสำหรับ Modal
  isModalOpen = false;
  modalMode: 'add' | 'edit' = 'add';
  currentCategory: any = { name: '', description: '' };

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.fetchCategories();
  }

  fetchCategories() {
    this.http.get('http://localhost:3000/categories').subscribe({
      next: (res: any) => {
        this.categories = res;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => { 
        console.error('Error fetching categories:', err); 
        this.isLoading = false; 
      }
    });
  }

  deleteCategory(id: number, name: string) {
    if (confirm(`Are you sure you want to delete category "${name}"?`)) {
      this.http.delete(`http://localhost:3000/categories/${id}`).subscribe({
        next: () => {
          alert('Deleted successfully!');
          this.fetchCategories();
        },
        error: (err) => alert('Failed to delete category.')
      });
    }
  }

  // ==========================================
  // ฟังก์ชันสำหรับ Modal (เพิ่ม / แก้ไข)
  // ==========================================
  openAddModal() {
    this.modalMode = 'add';
    this.currentCategory = { name: '', description: '' };
    this.isModalOpen = true;
  }

  openEditModal(c: any) {
    this.modalMode = 'edit';
    this.currentCategory = { 
      id: c.id, 
      name: c.name, 
      description: c.description || '' 
    };
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  saveCategory() {
    if (!this.currentCategory.name) {
      alert('Please enter a category name.');
      return;
    }

    if (this.modalMode === 'add') {
      this.http.post('http://localhost:3000/categories', this.currentCategory).subscribe({
        next: () => { this.closeModal(); this.fetchCategories(); },
        error: (err) => alert('Error adding category')
      });
    } else {
      this.http.put(`http://localhost:3000/categories/${this.currentCategory.id}`, this.currentCategory).subscribe({
        next: () => { this.closeModal(); this.fetchCategories(); },
        error: (err) => alert('Error updating category')
      });
    }
  }
}