import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { OrdersListComponent } from './orders-list/orders-list.component';
import { OrdersDetailComponent } from './orders-detail/orders-detail.component';

const routes: Routes = [
  { path: '',    component: OrdersListComponent },
  { path: ':id', component: OrdersDetailComponent }
];

@NgModule({
  declarations: [OrdersListComponent, OrdersDetailComponent],
  imports: [CommonModule, RouterModule.forChild(routes)]
})
export class OrdersModule {}
