import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Proforma } from '../../../shared/models/proforma.model';
import { ProformasService } from '../proformas.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-proformas-list',
  templateUrl: './proformas-list.component.html',
  styleUrls: ['./proformas-list.component.css']
})
export class ProformasListComponent implements OnInit {
  proformas: Proforma[] = [];
  loading = true;
  errorMsg = '';
  successMsg = '';
  confirmCancelId: number | null = null;
  filterClient = '';
  filterStatus = '';
  filterFrom = '';
  filterTo = '';
  private ft: any;

  constructor(private service: ProformasService, private router: Router, private http: HttpClient) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true; this.errorMsg = '';
    this.service.getAll({ client: this.filterClient, status: this.filterStatus, from: this.filterFrom, to: this.filterTo }).subscribe({
      next: res => { this.proformas = res.data; this.loading = false; },
      error: err => { this.errorMsg = err.error?.message || 'Error al cargar'; this.loading = false; }
    });
  }
  onFilterChange(): void { clearTimeout(this.ft); this.ft = setTimeout(() => this.load(), 400); }
  onComboChange(): void { this.load(); }
  get hasFilters(): boolean { return !!(this.filterClient || this.filterStatus || this.filterFrom || this.filterTo); }
  clearFilters(): void { this.filterClient = ''; this.filterStatus = ''; this.filterFrom = ''; this.filterTo = ''; this.load(); }

  goToNew() { this.router.navigate(['/dashboard/proformas/new']); }
  goToDetail(id: number) { this.router.navigate(['/dashboard/proformas', id]); }
  goToEdit(id: number) { this.router.navigate(['/dashboard/proformas', id, 'edit']); }

  askCancel(id: number) { this.confirmCancelId = id; }
  cancelAction() { this.confirmCancelId = null; }

  confirmCancel() {
    if (!this.confirmCancelId) return;
    const id = this.confirmCancelId; this.confirmCancelId = null;
    this.service.cancel(id).subscribe({
      next: () => { this.successMsg = 'Proforma cancelada'; this.load(); setTimeout(() => this.successMsg = '', 3000); },
      error: err => { this.errorMsg = err.error?.message || 'Error al cancelar'; }
    });
  }

  statusLabel(status: string): string {
    const map: any = { borrador: 'Borrador', confirmada: 'Confirmada', cancelada: 'Cancelada' };
    return map[status] || status;
  }

  statusClass(status: string): string {
    const map: any = { borrador: 'badge-borrador', confirmada: 'badge-confirmada', cancelada: 'badge-cancelada' };
    return map[status] || '';
  }

  downloadPdf(): void {
    let p = new URLSearchParams();
    if (this.filterClient) p.set('client', this.filterClient);
    if (this.filterStatus) p.set('status', this.filterStatus);
    if (this.filterFrom) p.set('from', this.filterFrom);
    if (this.filterTo)   p.set('to', this.filterTo);
    const qs = p.toString() ? '?' + p.toString() : '';
    this.http.get(`${environment.apiUrl}/proformas/pdf${qs}`, { responseType: 'blob' }).subscribe({
      next: blob => { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'proformas.pdf'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); },
      error: () => {}
    });
  }
}
