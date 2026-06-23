import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product } from '../../shared/models/product.model';
import { ProductsService } from '../products/products.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-stock',
  templateUrl: './stock.component.html',
  styleUrls: ['./stock.component.css']
})
export class StockComponent implements OnInit {
  items: Product[] = [];
  loading = true;
  successMsg = '';
  errorMsg = '';

  pdfLoading = false;

  // Modal agregar stock
  modalProduct: Product | null = null;
  addQty: number | null = null;
  saving = false;

  constructor(private svc: ProductsService, private http: HttpClient) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.svc.getAll().subscribe({
      next: r => { this.items = r.data; this.loading = false; },
      error: () => { this.errorMsg = 'Error al cargar el stock'; this.loading = false; }
    });
  }

  openModal(product: Product): void {
    this.modalProduct = product;
    this.addQty = null;
    this.errorMsg = '';
    this.successMsg = '';
  }

  closeModal(): void {
    this.modalProduct = null;
    this.addQty = null;
  }

  confirm(): void {
    if (!this.modalProduct || !this.addQty || this.addQty <= 0) return;
    this.saving = true;
    this.svc.addStock(this.modalProduct.id, this.addQty).subscribe({
      next: r => {
        // Update in-place so table reflects new value immediately
        const idx = this.items.findIndex(p => p.id === r.data.id);
        if (idx !== -1) this.items[idx] = r.data;
        this.successMsg = `Stock de "${r.data.name}" actualizado a ${r.data.stock} ${r.data.unit_abbr}`;
        this.saving = false;
        this.closeModal();
      },
      error: err => {
        this.errorMsg = err?.error?.message || 'Error al actualizar stock';
        this.saving = false;
      }
    });
  }

  isLowStock(p: Product): boolean {
    return +p.min_stock > 0 && +p.stock <= +p.min_stock;
  }

  downloadPdf(): void {
    this.pdfLoading = true;
    this.http.get(`${environment.apiUrl}/products/stock/pdf`, { responseType: 'blob' }).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'stock.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.pdfLoading = false;
      },
      error: () => { this.pdfLoading = false; }
    });
  }

  blockInvalidKey(e: KeyboardEvent): void {
    if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
  }
}
