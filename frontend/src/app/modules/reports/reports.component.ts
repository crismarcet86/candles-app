import { Component, OnInit } from '@angular/core';
import { ReportsService } from './reports.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {
  summary: any = null;
  orders: any[] = [];
  lowStock: any[] = [];
  topClients: any[] = [];

  loadingSummary = true;
  loadingOrders = true;
  loadingLowStock = true;
  loadingTopClients = true;
  errorMsg = '';

  fromDate = '';
  toDate = '';

  token = '';

  constructor(private service: ReportsService, private auth: AuthService) {}

  ngOnInit(): void {
    this.token = this.auth.token || '';
    this.loadAll();
  }

  loadAll(): void {
    this.loadSummary();
    this.loadOrders();
    this.loadLowStock();
    this.loadTopClients();
  }

  loadSummary(): void {
    this.loadingSummary = true;
    this.service.getSummary().subscribe({
      next: res => { this.summary = res.data; this.loadingSummary = false; },
      error: () => { this.loadingSummary = false; }
    });
  }

  loadOrders(): void {
    this.loadingOrders = true;
    this.service.getOrders(this.fromDate || undefined, this.toDate || undefined).subscribe({
      next: res => { this.orders = res.data; this.loadingOrders = false; },
      error: () => { this.loadingOrders = false; }
    });
  }

  loadLowStock(): void {
    this.loadingLowStock = true;
    this.service.getLowStock().subscribe({
      next: res => { this.lowStock = res.data; this.loadingLowStock = false; },
      error: () => { this.loadingLowStock = false; }
    });
  }

  loadTopClients(): void {
    this.loadingTopClients = true;
    this.service.getTopClients().subscribe({
      next: res => { this.topClients = res.data; this.loadingTopClients = false; },
      error: () => { this.loadingTopClients = false; }
    });
  }

  applyFilter(): void {
    this.loadOrders();
  }

  clearFilter(): void {
    this.fromDate = '';
    this.toDate = '';
    this.loadOrders();
  }

  getPdfUrl(): string {
    return this.service.getPdfUrl(this.fromDate || undefined, this.toDate || undefined);
  }

  downloadPdf(): void {
    this.errorMsg = '';
    this.service.downloadPdf(this.fromDate || undefined, this.toDate || undefined).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'reporte.pdf';
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => { this.errorMsg = 'Error al generar PDF'; }
    });
  }
}
