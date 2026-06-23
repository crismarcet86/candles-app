import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product } from '../../shared/models/product.model';
import { ProductsService } from '../products/products.service';
import { environment } from '../../../environments/environment';

interface CountRow {
  product: Product;
  realStock: number | null;
}

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

  // Modal dar de baja
  writeOffProduct: Product | null = null;
  writeOffQty: number | null = null;
  writeOffSaving = false;

  // Toma de inventario
  inventoryMode = false;
  countRows: CountRow[] = [];
  inventorySaving = false;

  constructor(private svc: ProductsService, private http: HttpClient) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.svc.getAll().subscribe({
      next: r => { this.items = r.data.filter(p => p.is_active === 1); this.loading = false; },
      error: () => { this.errorMsg = 'Error al cargar el stock'; this.loading = false; }
    });
  }

  // ── Agregar stock ─────────────────────────────────────
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

  // ── Dar de baja (daño) ────────────────────────────────
  openWriteOff(product: Product): void {
    this.writeOffProduct = product;
    this.writeOffQty = null;
    this.errorMsg = '';
    this.successMsg = '';
  }

  closeWriteOff(): void {
    this.writeOffProduct = null;
    this.writeOffQty = null;
  }

  confirmWriteOff(): void {
    if (!this.writeOffProduct || !this.writeOffQty || this.writeOffQty <= 0) return;
    this.writeOffSaving = true;
    this.svc.writeOffStock(this.writeOffProduct.id, this.writeOffQty).subscribe({
      next: r => {
        const idx = this.items.findIndex(p => p.id === r.data.id);
        if (idx !== -1) this.items[idx] = r.data;
        this.successMsg = `Baja registrada: "${r.data.name}" — nuevo stock: ${r.data.stock} ${r.data.unit_abbr}`;
        this.writeOffSaving = false;
        this.closeWriteOff();
      },
      error: err => {
        this.errorMsg = err?.error?.message || 'Error al registrar la baja';
        this.writeOffSaving = false;
      }
    });
  }

  // ── Toma de inventario ────────────────────────────────
  openInventory(): void {
    this.countRows = this.items.map(p => ({ product: p, realStock: null }));
    this.inventoryMode = true;
    this.successMsg = '';
    this.errorMsg = '';
  }

  cancelInventory(): void {
    this.inventoryMode = false;
    this.countRows = [];
  }

  getDiff(row: CountRow): number | null {
    if (row.realStock == null) return null;
    return row.realStock - +row.product.stock;
  }

  get inventoryFilledCount(): number {
    return this.countRows.filter(r => r.realStock !== null).length;
  }

  saveInventory(): void {
    const filled = this.countRows.filter(r => r.realStock !== null && +r.realStock >= 0);
    if (filled.length === 0) return;
    this.inventorySaving = true;
    const payload = filled.map(r => ({ product_id: r.product.id, real_stock: r.realStock! }));
    this.svc.inventoryCount(payload).subscribe({
      next: r => {
        r.data.forEach(updated => {
          const idx = this.items.findIndex(p => p.id === updated.id);
          if (idx !== -1) this.items[idx] = updated;
          const crow = this.countRows.find(c => c.product.id === updated.id);
          if (crow) crow.product = updated;
        });
        this.successMsg = `Toma de inventario guardada: ${r.data.length} ítems actualizados`;
        this.inventorySaving = false;
        this.inventoryMode = false;
        this.countRows = [];
      },
      error: err => {
        this.errorMsg = err?.error?.message || 'Error al guardar el inventario';
        this.inventorySaving = false;
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────
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
