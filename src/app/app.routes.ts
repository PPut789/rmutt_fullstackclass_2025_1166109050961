import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout';


export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard').then(m => m.DashboardComponent)
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./pages/products/products').then(m => m.ProductsComponent)
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./pages/categories/categories').then(m => m.CategoriesComponent)
      },
      {
        path: 'suppliers',
        loadComponent: () =>
          import('./pages/suppliers/suppliers').then(m => m.SuppliersComponent)
      },
      {
        path: 'warehouses',
        loadComponent: () =>
          import('./pages/warehouses/warehouses').then(m => m.WarehousesComponent)
      },
      {
        path: 'stock',
        loadComponent: () =>
          import('./pages/stock/stock').then(m => m.StockComponent)
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./pages/orders/orders').then(m => m.OrdersComponent)
      },
      {
        path: 'shipments',
        loadComponent: () =>
          import('./pages/shipments/shipments').then(m => m.ShipmentsComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];