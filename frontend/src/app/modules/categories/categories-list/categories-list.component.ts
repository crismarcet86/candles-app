import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Category } from '../../../shared/models/category.model';
import { CategoriesService } from '../categories.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-categories-list',
  templateUrl: './categories-list.component.html',
  styleUrls: ['./categories-list.component.css']
})
export class CategoriesListComponent implements OnInit {
  categories: Category[] = [];
  loading = true;
  errorMsg = '';
  successMsg = '';
  confirmDeactivateId: number | null = null;
  filterName = '';
  private ft: any;

  constructor(
    private categoriesService: CategoriesService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading = true;
    this.errorMsg = '';
    this.categoriesService.getAll({ name: this.filterName }).subscribe({
      next: res => { this.categories = res.data; this.loading = false; },
      error: err => { this.errorMsg = err.error?.message || 'Error al cargar categorías'; this.loading = false; }
    });
  }

  onFilterChange(): void { clearTimeout(this.ft); this.ft = setTimeout(() => this.loadCategories(), 400); }
  get hasFilters(): boolean { return !!this.filterName; }
  clearFilters(): void { this.filterName = ''; this.loadCategories(); }

  goToNew(): void {
    this.router.navigate(['/dashboard/categories/new']);
  }

  goToEdit(id: number): void {
    this.router.navigate(['/dashboard/categories', id, 'edit']);
  }

  askDeactivate(id: number): void {
    this.confirmDeactivateId = id;
  }

  cancelDeactivate(): void {
    this.confirmDeactivateId = null;
  }

  confirmDeactivate(): void {
    if (this.confirmDeactivateId === null) return;
    const id = this.confirmDeactivateId;
    this.confirmDeactivateId = null;

    this.categoriesService.delete(id).subscribe({
      next: () => {
        this.successMsg = 'Categoría desactivada correctamente';
        this.loadCategories();
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: err => {
        this.errorMsg = err.error?.message || 'Error al desactivar categoría';
      }
    });
  }

  downloadPdf(): void {
    let params = '';
    if (this.filterName) params += `?name=${encodeURIComponent(this.filterName)}`;
    this.http.get(`${environment.apiUrl}/categories/pdf${params}`, { responseType: 'blob' }).subscribe({
      next: blob => { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'categorias.pdf'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); },
      error: () => {}
    });
  }
}
