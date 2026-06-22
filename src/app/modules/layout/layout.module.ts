import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LayoutComponent } from './layout.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { TopbarComponent } from './topbar/topbar.component';

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('../dashboard/dashboard.module').then(m => m.DashboardModule)
      }
      // Aquí irás agregando más módulos:
      // { path: 'categories', loadChildren: ... }
      // { path: 'products',   loadChildren: ... }
      // { path: 'clients',    loadChildren: ... }
      // { path: 'proformas',  loadChildren: ... }
      // { path: 'orders',     loadChildren: ... }
    ]
  }
];

@NgModule({
  declarations: [LayoutComponent, SidebarComponent, TopbarComponent],
  imports: [CommonModule, FormsModule, RouterModule.forChild(routes)]
})
export class LayoutModule {}
