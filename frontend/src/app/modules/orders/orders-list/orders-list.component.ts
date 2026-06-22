import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Order } from '../../../shared/models/order.model';
import { OrdersService } from '../orders.service';

@Component({
  selector: 'app-orders-list',
  templateUrl: './orders-list.component.html',
  styleUrls: ['./orders-list.component.css']
})
export class OrdersListComponent implements OnInit {
  orders: Order[] = [];
  loading = true;
  errorMsg = '';

  constructor(private service: OrdersService, private router: Router) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.service.getAll().subscribe({
      next: res => { this.orders = res.data; this.loading = false; },
      error: err => { this.errorMsg = err.error?.message || 'Error al cargar'; this.loading = false; }
    });
  }

  goToDetail(id: number) { this.router.navigate(['/dashboard/orders', id]); }
}
