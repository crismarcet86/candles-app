import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Product } from '../../../shared/models/product.model';
import { ProductsService } from '../products.service';

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

  constructor(private service: ProductsService, private router: Router) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMsg = '';
    this.service.getAll().subscribe({
      next: res => {
        this.items = res.data;
        this.loading = false;
      },
      error: err => {
        this.errorMsg = err.error?.message || 'Error al cargar productos';
        this.loading = false;
      }
    });
  }

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

  isLowStock(product: Product): boolean {
    return product.stock <= product.min_stock && product.is_active === 1;
  }
}
