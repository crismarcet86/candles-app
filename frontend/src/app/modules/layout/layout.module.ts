import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LayoutComponent } from './layout.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { TopbarComponent } from './topbar/topbar.component';
import { AdminGuard } from '../../core/guards/admin.guard';

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('../dashboard/dashboard.module').then(m => m.DashboardModule)
      },
      {
        path: 'users',
        canActivate: [AdminGuard],
        loadChildren: () =>
          import('../users/users.module').then(m => m.UsersModule)
      },
      {
        path: 'categories',
        loadChildren: () =>
          import('../categories/categories.module').then(m => m.CategoriesModule)
      },
      {
        path: 'units',
        loadChildren: () =>
          import('../units/units.module').then(m => m.UnitsModule)
      },
      {
        path: 'products',
        loadChildren: () =>
          import('../products/products.module').then(m => m.ProductsModule)
      },
      {
        path: 'clients',
        loadChildren: () =>
          import('../clients/clients.module').then(m => m.ClientsModule)
      },
      {
        path: 'proformas',
        loadChildren: () =>
          import('../proformas/proformas.module').then(m => m.ProformasModule)
      },
      {
        path: 'orders',
        loadChildren: () =>
          import('../orders/orders.module').then(m => m.OrdersModule)
      },
      {
        path: 'molds',
        loadChildren: () =>
          import('../molds/molds.module').then(m => m.MoldsModule)
      },
      {
        path: 'calculator',
        loadChildren: () =>
          import('../calculator/calculator.module').then(m => m.CalculatorModule)
      }
    ]
  }
];

@NgModule({
  declarations: [LayoutComponent, SidebarComponent, TopbarComponent],
  imports: [CommonModule, FormsModule, RouterModule.forChild(routes)]
})
export class LayoutModule {}
