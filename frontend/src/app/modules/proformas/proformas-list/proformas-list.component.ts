import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Proforma } from '../../../shared/models/proforma.model';
import { ProformasService } from '../proformas.service';

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

  constructor(private service: ProformasService, private router: Router) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true; this.errorMsg = '';
    this.service.getAll().subscribe({
      next: res => { this.proformas = res.data; this.loading = false; },
      error: err => { this.errorMsg = err.error?.message || 'Error al cargar'; this.loading = false; }
    });
  }

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
}
