import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // 1. 🚨 Import ChangeDetectorRef เข้ามา
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {
  stats: any = {
    totalProducts: 0,
    totalOrders: 0,
    lowStock: 0,
    totalSuppliers: 0,
    recentOrders: [],
    stockByCategory: []
  };

  // 2. 🚨 Inject ตัวปลุกหน้าจอ (cdr) เข้ามาใน constructor
  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.http.get('http://localhost:3000/dashboard-stats').subscribe({
      next: (res: any) => {
        // พอได้ข้อมูลมา ก็ยัดใส่ตัวแปร
        this.stats = res;
        
        // 3. 🚨 สั่งฟันธง! "Angular รีเฟรชหน้าจอเดี๋ยวนี้!"
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error('Error fetching dashboard stats:', err);
      }
    });
  }
}