import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Order } from '../../../shared/models/order.model';
import { OrdersService } from '../orders.service';

@Component({
  selector: 'app-orders-detail',
  templateUrl: './orders-detail.component.html',
  styleUrls: ['./orders-detail.component.css']
})
export class OrdersDetailComponent implements OnInit {
  order: Order | null = null;
  loading = true;
  errorMsg = '';

  constructor(private service: OrdersService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(+id);
  }

  load(id: number) {
    this.service.getById(id).subscribe({
      next: res => { this.order = res.data; this.loading = false; },
      error: err => { this.errorMsg = err.error?.message || 'Error'; this.loading = false; }
    });
  }

  get displaySubtotal(): number {
    if (!this.order) return 0;
    return Number(this.order.total) + Number(this.order.discount);
  }

  goBack() { this.router.navigate(['/dashboard/orders']); }
}
