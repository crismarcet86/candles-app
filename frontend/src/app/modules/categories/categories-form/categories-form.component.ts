import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoriesService } from '../categories.service';

@Component({
  selector: 'app-categories-form',
  templateUrl: './categories-form.component.html',
  styleUrls: ['./categories-form.component.css']
})
export class CategoriesFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  categoryId: number | null = null;
  loading = false;
  loadingData = false;
  errorMsg = '';

  constructor(
    private fb: FormBuilder,
    private categoriesService: CategoriesService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!idParam;
    this.categoryId = idParam ? +idParam : null;

    this.buildForm();

    if (this.isEdit && this.categoryId) {
      this.loadCategory(this.categoryId);
    }
  }

  private buildForm(): void {
    this.form = this.fb.group({
      name:         ['', [Validators.required, Validators.minLength(2)]],
      description:  [''],
      is_fragrance: [0],
      is_active:    [1]
    });
  }

  private loadCategory(id: number): void {
    this.loadingData = true;
    this.categoriesService.getById(id).subscribe({
      next: res => {
        const c = res.data;
        this.form.patchValue({
          name:         c.name,
          description:  c.description ?? '',
          is_fragrance: c.is_fragrance ?? 0,
          is_active:    c.is_active
        });
        this.loadingData = false;
      },
      error: err => {
        this.errorMsg = err.error?.message || 'Error al cargar categoría';
        this.loadingData = false;
      }
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMsg = '';

    const value = this.form.value;
    const payload: any = {
      name:         value.name,
      description:  value.description || null,
      is_fragrance: value.is_fragrance ? 1 : 0
    };

    if (this.isEdit) {
      payload.is_active = value.is_active ? 1 : 0;
    }

    const request = this.isEdit && this.categoryId
      ? this.categoriesService.update(this.categoryId, payload)
      : this.categoriesService.create(payload);

    request.subscribe({
      next: () => this.router.navigate(['/dashboard/categories']),
      error: err => {
        this.errorMsg = err.error?.message || 'Error al guardar categoría';
        this.loading = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/dashboard/categories']);
  }

  field(name: string) { return this.form.get(name); }
}
