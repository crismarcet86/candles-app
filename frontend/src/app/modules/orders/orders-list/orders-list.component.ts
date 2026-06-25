import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Order } from '../../../shared/models/order.model';
import { OrdersService } from '../orders.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-orders-list',
  templateUrl: './orders-list.component.html',
  styleUrls: ['./orders-list.component.css']
})
export class OrdersListComponent implements OnInit {
  orders: Order[] = [];
  loading = true;
  errorMsg = '';

  constructor(private service: OrdersService, private router: Router, private http: HttpClient) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.service.getAll().subscribe({
      next: res => { this.orders = res.data; this.loading = false; },
      error: err => { this.errorMsg = err.error?.message || 'Error al cargar'; this.loading = false; }
    });
  }

  goToDetail(id: number) { this.router.navigate(['/dashboard/orders', id]); }

  toggleDelivery(order: Order): void {
    const next = order.delivery_status === 'entregado' ? 'pendiente' : 'entregado';
    this.service.updateDeliveryStatus(order.id, next).subscribe({
      next: res => {
        order.delivery_status = res.data.delivery_status;
      },
      error: () => {}
    });
  }

  downloadPdf(): void {
    this.http.get(`${environment.apiUrl}/orders/pdf`, { responseType: 'blob' }).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pedidos.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      },
      error: () => {}
    });
  }
}
