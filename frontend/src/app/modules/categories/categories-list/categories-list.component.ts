import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Category } from '../../../shared/models/category.model';
import { CategoriesService } from '../categories.service';

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

  constructor(
    private categoriesService: CategoriesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading = true;
    this.errorMsg = '';
    this.categoriesService.getAll().subscribe({
      next: res => {
        this.categories = res.data;
        this.loading = false;
      },
      error: err => {
        this.errorMsg = err.error?.message || 'Error al cargar categorías';
        this.loading = false;
      }
    });
  }

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
}
