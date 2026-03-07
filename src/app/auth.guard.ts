import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  // เรียกใช้ Router สำหรับเปลี่ยนหน้า
  const router = inject(Router);
  
  // เช็คว่ามีข้อมูล currentUser ในเครื่องไหม (ตอนที่เราล็อกอินสำเร็จจะบันทึกไว้)
  const currentUser = localStorage.getItem('currentUser');

  if (currentUser) {
    // ถ้ามีข้อมูล แปลว่าล็อกอินแล้ว -> อนุญาตให้ผ่านได้! ✅
    return true;
  } else {
    // ถ้าไม่มีข้อมูล แปลว่าแอบเข้า -> เตะกลับไปหน้า Login ทันที! ❌
    router.navigate(['/login']);
    return false;
  }
};