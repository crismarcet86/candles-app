import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Mold } from '../../../shared/models/mold.model';
import { MoldsService } from '../molds.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-molds-list',
  templateUrl: './molds-list.component.html',
  styleUrls: ['./molds-list.component.css']
})
export class MoldsListComponent implements OnInit {
  molds: Mold[] = [];
  loading = true;
  errorMsg = '';
  successMsg = '';
  confirmDeactivateId: number | null = null;
  previewImage: { url: string; name: string } | null = null;
  filterName = '';
  filterMoldTypeId: number | null = null;
  moldTypes: any[] = [];
  private ft: any;

  constructor(private service: MoldsService, private router: Router, private http: HttpClient) {}
  ngOnInit() { this.loadMoldTypes(); this.load(); }

  loadMoldTypes(): void {
    this.http.get<any>(`${environment.apiUrl}/mold-types`).subscribe({
      next: res => { this.moldTypes = res.data || []; },
      error: () => {}
    });
  }

  load() {
    this.loading = true; this.errorMsg = '';
    this.service.getAll({ name: this.filterName, mold_type_id: this.filterMoldTypeId }).subscribe({
      next: res => { this.molds = res.data; this.loading = false; },
      error: err => { this.errorMsg = err.error?.message || 'Error al cargar moldes'; this.loading = false; }
    });
  }
  onFilterChange(): void { clearTimeout(this.ft); this.ft = setTimeout(() => this.load(), 400); }
  onComboChange(): void { this.load(); }
  get hasFilters(): boolean { return !!(this.filterName || this.filterMoldTypeId); }
  clearFilters(): void { this.filterName = ''; this.filterMoldTypeId = null; this.load(); }

  goToNew() { this.router.navigate(['/dashboard/molds/new']); }
  goToEdit(id: number) { this.router.navigate(['/dashboard/molds', id, 'edit']); }
  askDeactivate(id: number) { this.confirmDeactivateId = id; }
  cancelDeactivate() { this.confirmDeactivateId = null; }

  openPreview(m: Mold): void {
    if (m.image_url) this.previewImage = { url: m.image_url, name: m.name };
  }
  closePreview(): void { this.previewImage = null; }

  confirmDeactivate() {
    if (!this.confirmDeactivateId) return;
    const id = this.confirmDeactivateId; this.confirmDeactivateId = null;
    this.service.deactivate(id).subscribe({
      next: () => { this.successMsg = 'Molde desactivado'; this.load(); setTimeout(() => this.successMsg = '', 3000); },
      error: err => { this.errorMsg = err.error?.message || 'Error'; }
    });
  }

  downloadPdf(): void {
    let p = new URLSearchParams();
    if (this.filterName) p.set('name', this.filterName);
    if (this.filterMoldTypeId) p.set('mold_type_id', String(this.filterMoldTypeId));
    const qs = p.toString() ? '?' + p.toString() : '';
    this.http.get(`${environment.apiUrl}/molds/pdf${qs}`, { responseType: 'blob' }).subscribe({
      next: blob => { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'moldes.pdf'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); },
      error: () => {}
    });
  }
}
