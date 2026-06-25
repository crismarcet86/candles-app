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
  filterClient = '';
  filterStatus = '';
  filterDelivery = '';
  filterFrom = '';
  filterTo = '';
  private ft: any;

  constructor(private service: OrdersService, private router: Router, private http: HttpClient) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true; this.errorMsg = '';
    this.service.getAll({ client: this.filterClient, status: this.filterStatus, delivery_status: this.filterDelivery, from: this.filterFrom, to: this.filterTo }).subscribe({
      next: res => { this.orders = res.data; this.loading = false; },
      error: err => { this.errorMsg = err.error?.message || 'Error al cargar'; this.loading = false; }
    });
  }
  onFilterChange(): void { clearTimeout(this.ft); this.ft = setTimeout(() => this.load(), 400); }
  onComboChange(): void { this.load(); }
  get hasFilters(): boolean { return !!(this.filterClient || this.filterStatus || this.filterDelivery || this.filterFrom || this.filterTo); }
  clearFilters(): void { this.filterClient = ''; this.filterStatus = ''; this.filterDelivery = ''; this.filterFrom = ''; this.filterTo = ''; this.load(); }

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
    let p = new URLSearchParams();
    if (this.filterClient)  p.set('client', this.filterClient);
    if (this.filterStatus)  p.set('status', this.filterStatus);
    if (this.filterDelivery) p.set('delivery_status', this.filterDelivery);
    if (this.filterFrom)    p.set('from', this.filterFrom);
    if (this.filterTo)      p.set('to', this.filterTo);
    const qs = p.toString() ? '?' + p.toString() : '';
    this.http.get(`${environment.apiUrl}/orders/pdf${qs}`, { responseType: 'blob' }).subscribe({
      next: blob => { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'ordenes.pdf'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); },
      error: () => {}
    });
  }
}
