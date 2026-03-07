import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class NavbarComponent implements OnInit {
  isProfileMenuOpen = false;
  currentUser: any = null;
  userInitials: string = 'U';

  // โครงสร้างข้อมูลแบบใหม่แยกหมวด
  searchResults: any = { products: [], suppliers: [], orders: [], shipments: [] };
  isSearchOpen = false;
  hasAnyResults = false;

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit() {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      this.currentUser = JSON.parse(userData);
      this.userInitials = this.getInitials(this.currentUser.name);
    }
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }

  toggleProfileMenu() {
    this.isSearchOpen = false;
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  logout() {
    localStorage.removeItem('currentUser');
    this.isProfileMenuOpen = false;
    this.router.navigate(['/login']);
  }

  // --- เวลาพิมพ์ข้อความ (โชว์พรีวิว Dropdown) ---
  onTyping(event: any) {
    const query = event.target.value;
    if (!query.trim()) {
      this.isSearchOpen = false;
      return;
    }
    this.http.get(`http://localhost:3000/search?q=${query}`).subscribe((res: any) => {
      this.searchResults = res;
      // เช็คว่ามีข้อมูลหมวดไหนโผล่มาบ้างไหม
      this.hasAnyResults = res.products.length > 0 || res.suppliers.length > 0 || 
                           res.orders.length > 0 || res.shipments.length > 0;
      this.isSearchOpen = this.hasAnyResults;
    });
  }

  // --- เวลากดปุ่ม Enter (วาร์ปไปหน้า Search เต็มๆ) ---
  onEnter(event: any) {
    const query = event.target.value;
    if (query.trim()) {
      this.isSearchOpen = false; // ปิดกล่อง
      event.target.value = '';   // เคลียร์ช่องค้นหา
      // วาร์ปไปหน้า /search พร้อมแนบคำค้นหาไปที่ URL
      this.router.navigate(['/search'], { queryParams: { q: query } });
    }
  }

  closeSearch() {
    setTimeout(() => { this.isSearchOpen = false; }, 200);
  }
}