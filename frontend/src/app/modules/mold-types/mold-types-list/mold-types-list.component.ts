import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MoldType, MoldTypesService } from '../mold-types.service';

@Component({
  selector: 'app-mold-types-list',
  templateUrl: './mold-types-list.component.html',
  styleUrls: ['./mold-types-list.component.css']
})
export class MoldTypesListComponent implements OnInit {
  types: MoldType[] = [];
  loading = true;
  errorMsg = '';
  successMsg = '';
  confirmDeactivateId: number | null = null;
  previewImage: { url: string; name: string } | null = null;
  filterName = '';
  private ft: any;

  constructor(private svc: MoldTypesService, private router: Router) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.svc.getAll({ name: this.filterName }).subscribe({
      next: r => { this.types = r.data; this.loading = false; },
      error: () => { this.errorMsg = 'Error al cargar los tipos de molde'; this.loading = false; }
    });
  }
  onFilterChange(): void { clearTimeout(this.ft); this.ft = setTimeout(() => this.load(), 400); }
  get hasFilters(): boolean { return !!this.filterName; }
  clearFilters(): void { this.filterName = ''; this.load(); }

  goToNew(): void  { this.router.navigate(['/dashboard/mold-types/new']); }
  goToEdit(id: number): void { this.router.navigate(['/dashboard/mold-types', id, 'edit']); }
  askDeactivate(id: number): void { this.confirmDeactivateId = id; }
  cancelDeactivate(): void { this.confirmDeactivateId = null; }

  openPreview(t: MoldType): void {
    if (t.image_url) this.previewImage = { url: t.image_url, name: t.name };
  }
  closePreview(): void { this.previewImage = null; }

  confirmDeactivate(): void {
    if (!this.confirmDeactivateId) return;
    const id = this.confirmDeactivateId;
    this.confirmDeactivateId = null;
    this.svc.deactivate(id).subscribe({
      next: () => { this.successMsg = 'Tipo desactivado'; this.load(); setTimeout(() => this.successMsg = '', 3000); },
      error: err => { this.errorMsg = err.error?.message || 'Error al desactivar'; }
    });
  }
}
