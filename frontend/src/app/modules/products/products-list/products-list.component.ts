import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Product } from '../../../shared/models/product.model';
import { ProductsService } from '../products.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-products-list',
  templateUrl: './products-list.component.html',
  styleUrls: ['./products-list.component.css']
})
export class ProductsListComponent implements OnInit {
  items: Product[] = [];
  loading = true;
  errorMsg = '';
  successMsg = '';
  confirmDeleteId: number | null = null;
  previewImage: { url: string; name: string } | null = null;
  filterName = '';
  filterCategoryId: number | null = null;
  filterUnitId: number | null = null;
  categories: any[] = [];
  units: any[] = [];
  private ft: any;

  constructor(private service: ProductsService, private router: Router, private http: HttpClient) {}

  ngOnInit(): void { this.loadCombos(); this.load(); }

  loadCombos(): void {
    this.http.get<any>(`${environment.apiUrl}/categories`).subscribe({ next: r => this.categories = r.data || [], error: () => {} });
    this.http.get<any>(`${environment.apiUrl}/units`).subscribe({ next: r => this.units = r.data || [], error: () => {} });
  }

  load(): void {
    this.loading = true;
    this.errorMsg = '';
    this.service.getAll({ name: this.filterName, category_id: this.filterCategoryId, unit_id: this.filterUnitId }).subscribe({
      next: res => { this.items = res.data; this.loading = false; },
      error: err => { this.errorMsg = err.error?.message || 'Error al cargar productos'; this.loading = false; }
    });
  }
  onFilterChange(): void { clearTimeout(this.ft); this.ft = setTimeout(() => this.load(), 400); }
  onComboChange(): void { this.load(); }
  get hasFilters(): boolean { return !!(this.filterName || this.filterCategoryId || this.filterUnitId); }
  clearFilters(): void { this.filterName = ''; this.filterCategoryId = null; this.filterUnitId = null; this.load(); }

  goToNew(): void {
    this.router.navigate(['/dashboard/products/new']);
  }

  goToEdit(id: number): void {
    this.router.navigate(['/dashboard/products', id, 'edit']);
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

    this.service.delete(id).subscribe({
      next: () => {
        this.successMsg = 'Producto desactivado correctamente';
        this.load();
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: err => {
        this.errorMsg = err.error?.message || 'Error al desactivar producto';
      }
    });
  }

  openPreview(p: Product): void {
    if (p.image_url) this.previewImage = { url: p.image_url, name: p.name };
  }
  closePreview(): void { this.previewImage = null; }

  isLowStock(product: Product): boolean {
    return product.stock <= product.min_stock && product.is_active === 1;
  }

  downloadPdf(): void {
    let p = new URLSearchParams();
    if (this.filterName) p.set('name', this.filterName);
    if (this.filterCategoryId) p.set('category_id', String(this.filterCategoryId));
    if (this.filterUnitId) p.set('unit_id', String(this.filterUnitId));
    const qs = p.toString() ? '?' + p.toString() : '';
    this.http.get(`${environment.apiUrl}/products/pdf${qs}`, { responseType: 'blob' }).subscribe({
      next: blob => { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'productos.pdf'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); },
      error: () => {}
    });
  }
}
