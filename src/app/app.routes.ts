import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout';
import { authGuard } from './auth.guard'; // 1. Import พี่ยามเข้ามา

export const routes: Routes = [
  // ถ้าพิมพ์แค่ localhost:4200 ให้ไปหน้า login
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // หน้า Login (ให้เข้าได้อิสระ ไม่ต้องมียาม)
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent)
  },

  // โครงสร้างหลัก (Dashboard, Products ฯลฯ)
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard], // 2. 🛡️ เอาพี่ยามมายืนเฝ้าตรงนี้! (มันจะคลุมลูกๆ ทุกหน้าเลย)
    children: [
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardComponent) },
      { path: 'products', loadComponent: () => import('./pages/products/products').then(m => m.ProductsComponent) },
      { path: 'categories', loadComponent: () => import('./pages/categories/categories').then(m => m.CategoriesComponent) },
      { path: 'suppliers', loadComponent: () => import('./pages/suppliers/suppliers').then(m => m.SuppliersComponent) },
      { path: 'warehouses', loadComponent: () => import('./pages/warehouses/warehouses').then(m => m.WarehousesComponent) },
      { path: 'stock', loadComponent: () => import('./pages/stock/stock').then(m => m.StockComponent) },
      { path: 'orders', loadComponent: () => import('./pages/orders/orders').then(m => m.OrdersComponent) },
      { path: 'shipments', loadComponent: () => import('./pages/shipments/shipments').then(m => m.ShipmentsComponent) },
      { path: 'search', loadComponent: () => import('./pages/search/search').then(m => m.SearchComponent) }
    ]
  },

  // ถ้าพิมพ์ URL มั่วๆ ให้เด้งไปหน้า login
  { path: '**', redirectTo: 'login' }
];