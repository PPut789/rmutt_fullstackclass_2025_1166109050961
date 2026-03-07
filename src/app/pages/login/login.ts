import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http'; // เอาไว้ใช้ยิง API

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {
  // สร้างตัวแปรมารับค่าที่ผู้ใช้พิมพ์
  email = '';
  password = '';
  errorMessage = '';

  // เรียกใช้ Router (เปลี่ยนหน้า) และ HttpClient (ยิง API)
  constructor(private router: Router, private http: HttpClient) {}

  onLogin() {
    this.errorMessage = ''; // ล้างข้อความแจ้งเตือนเก่าก่อน

    // ส่ง request ไปที่ API /login ใน Node.js
    this.http.post('http://localhost:3000/login', {
      email: this.email,
      password: this.password
    }).subscribe({
      // กรณี Login สำเร็จ (เจอใน Database)
      next: (res: any) => {
        if (res.success) {
          // แอบบันทึกข้อมูล John Doe หรือ Jane Smith ไว้ในเครื่อง เผื่อเอาไปโชว์ที่ Navbar ทีหลัง
          localStorage.setItem('currentUser', JSON.stringify(res.user));
          // เด้งไปหน้า Dashboard
          this.router.navigate(['/dashboard']);
        }
      },
      // กรณี Login ไม่สำเร็จ (รหัสผิด หรือหาอีเมลไม่เจอ จะโดนดีดมาเข้า error)
      error: (err) => {
        this.errorMessage = 'Invalid email or password. Please try again.';
      }
    });
  }
}