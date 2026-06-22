import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Proforma } from '../../../shared/models/proforma.model';
import { ProformasService } from '../proformas.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-proformas-detail',
  templateUrl: './proformas-detail.component.html',
  styleUrls: ['./proformas-detail.component.css']
})
export class ProformasDetailComponent implements OnInit {
  proforma: Proforma | null = null;
  loading = true;
  actionLoading = false;
  errorMsg = '';
  successMsg = '';
  showConfirmDialog = false;
  showCancelDialog = false;
  apiUrl = environment.apiUrl;

  constructor(private service: ProformasService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(+id);
  }

  load(id: number): void {
    this.loading = true;
    this.service.getById(id).subscribe({
      next: res => { this.proforma = res.data; this.loading = false; },
      error: err => { this.errorMsg = err.error?.message || 'Error'; this.loading = false; }
    });
  }

  goToEdit(): void { this.router.navigate(['/dashboard/proformas', this.proforma!.id, 'edit']); }
  goBack(): void { this.router.navigate(['/dashboard/proformas']); }

  confirmProforma(): void {
    if (!this.proforma) return;
    this.actionLoading = true; this.showConfirmDialog = false;
    this.service.confirm(this.proforma.id).subscribe({
      next: () => { this.successMsg = 'Proforma confirmada. Se generó la orden.'; this.load(this.proforma!.id); this.actionLoading = false; },
      error: err => { this.errorMsg = err.error?.message || 'Error al confirmar'; this.actionLoading = false; }
    });
  }

  cancelProforma(): void {
    if (!this.proforma) return;
    this.actionLoading = true; this.showCancelDialog = false;
    this.service.cancel(this.proforma.id).subscribe({
      next: () => { this.successMsg = 'Proforma cancelada.'; this.load(this.proforma!.id); this.actionLoading = false; },
      error: err => { this.errorMsg = err.error?.message || 'Error al cancelar'; this.actionLoading = false; }
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
