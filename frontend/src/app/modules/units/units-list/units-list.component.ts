import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Unit } from '../../../shared/models/unit.model';
import { UnitsService } from '../units.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-units-list',
  templateUrl: './units-list.component.html',
  styleUrls: ['./units-list.component.css']
})
export class UnitsListComponent implements OnInit {
  units: Unit[] = [];
  loading = true;
  errorMsg = '';
  successMsg = '';
  confirmDeleteId: number | null = null;
  filterSearch = '';
  private ft: any;

  constructor(
    private unitsService: UnitsService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadUnits();
  }

  loadUnits(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.unitsService.getAll({ search: this.filterSearch }).subscribe({
      next: res => { this.units = res.data; this.loading = false; },
      error: err => { this.errorMsg = err.error?.message || 'Error al cargar'; this.loading = false; }
    });
  }
  onFilterChange(): void { clearTimeout(this.ft); this.ft = setTimeout(() => this.load(), 400); }
  get hasFilters(): boolean { return !!this.filterSearch; }
  clearFilters(): void { this.filterSearch = ''; this.load(); }

  goToNew(): void {
    this.router.navigate(['/dashboard/units/new']);
  }

  goToEdit(id: number): void {
    this.router.navigate(['/dashboard/units', id, 'edit']);
  }

  askDelete(id: number): void {
    this.confirmDeleteId = id;
  }

  cancelDelete(): void {
    this.confirmDeleteId = null;
  }

  confirmDelete(): void {
    if (this.confirmDeleteId === null) return;
    const id = this.confirmDeleteId;
    this.confirmDeleteId = null;

    this.unitsService.delete(id).subscribe({
      next: () => {
        this.successMsg = 'Unidad eliminada correctamente';
        this.loadUnits();
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: err => {
        this.errorMsg = err.error?.message || 'Error al eliminar unidad';
      }
    });
  }

  downloadPdf(): void {
    let params = '';
    if (this.filterSearch) params += `?search=${encodeURIComponent(this.filterSearch)}`;
    this.http.get(`${environment.apiUrl}/units/pdf${params}`, { responseType: 'blob' }).subscribe({
      next: blob => { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'unidades.pdf'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); },
      error: () => {}
    });
  }
}
