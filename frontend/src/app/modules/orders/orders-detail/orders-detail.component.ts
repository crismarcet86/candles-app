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
  successMsg = '';

  returns: any[] = [];
  showReturnModal = false;
  returnItems: any[] = [];
  returnNotes = '';
  returnLoading = false;
  returnError = '';

  constructor(private service: OrdersService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) { this.load(+id); this.loadReturns(+id); }
  }

  load(id: number) {
    this.service.getById(id).subscribe({
      next: res => { this.order = res.data; this.loading = false; },
      error: err => { this.errorMsg = err.error?.message || 'Error'; this.loading = false; }
    });
  }

  loadReturns(id: number) {
    this.service.getReturns(id).subscribe({
      next: res => { this.returns = res.data; },
      error: () => {}
    });
  }

  get displaySubtotal(): number {
    if (!this.order) return 0;
    return Number(this.order.total) + Number(this.order.discount);
  }

  goBack() { this.router.navigate(['/dashboard/orders']); }

  statusLabel(status: string): string {
    const map: any = {
      pendiente: 'Pendiente', entregado: 'Entregado',
      'anulado parcial': 'Anulado parcial', 'anulado total': 'Anulado total'
    };
    return map[status] || status;
  }

  statusClass(status: string): string {
    const map: any = {
      pendiente: 'badge-borrador', entregado: 'badge-confirmada',
      'anulado parcial': 'badge-warning', 'anulado total': 'badge-cancelada'
    };
    return map[status] || '';
  }

  // ── Devoluciones ──────────────────────────────────────────────

  get hasReturnableItems(): boolean {
    if (this.order?.status === 'anulado total') return false;
    return (this.order?.items || []).some(
      item => !item.is_service &&
        Number(item.quantity) - Number(item.returned_quantity || 0) > 0
    );
  }

  openReturnModal(): void {
    this.returnError = '';
    this.returnNotes = '';
    this.returnItems = (this.order!.items || [])
      .filter(item => !item.is_service)
      .map(item => ({
        ...item,
        available: Math.max(0, Number(item.quantity) - Number(item.returned_quantity || 0)),
        return_quantity: 0,
        restores_stock: !!(item.product_id || item.preset_id),
      }))
      .filter(item => item.available > 0);
    this.showReturnModal = true;
  }

  itemLabel(item: any): string {
    return item.description || item.product_name || '—';
  }

  itemStockLabel(item: any): string {
    if (item.product_id) return 'Restaurar stock';
    if (item.preset_id)  return 'Restaurar ingredientes';
    return '';
  }

  submitReturn(): void {
    const selected = this.returnItems.filter(i => Number(i.return_quantity) > 0);
    if (selected.length === 0) {
      this.returnError = 'Ingresá una cantidad mayor a 0 en al menos un ítem.';
      return;
    }
    for (const item of selected) {
      if (Number(item.return_quantity) > item.available + 0.0001) {
        this.returnError = `La cantidad supera lo disponible para "${this.itemLabel(item)}".`;
        return;
      }
    }
    this.returnLoading = true;
    this.returnError = '';
    const payload = {
      notes: this.returnNotes || null,
      items: selected.map(i => ({
        order_item_id: i.id,
        quantity:      Number(i.return_quantity),
        restores_stock: i.restores_stock,
      })),
    };
    this.service.createReturn(this.order!.id, payload).subscribe({
      next: () => {
        this.showReturnModal = false;
        this.returnLoading = false;
        this.successMsg = 'Devolución registrada correctamente.';
        setTimeout(() => this.successMsg = '', 4000);
        this.load(this.order!.id);
        this.loadReturns(this.order!.id);
      },
      error: err => {
        this.returnError = err.error?.message || 'Error al registrar la devolución.';
        this.returnLoading = false;
      }
    });
  }
}
