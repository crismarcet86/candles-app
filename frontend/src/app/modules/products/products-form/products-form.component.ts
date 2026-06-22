import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ProductsService } from '../products.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-products-form',
  templateUrl: './products-form.component.html',
  styleUrls: ['./products-form.component.css']
})
export class ProductsFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  itemId: number | null = null;
  loading = false;
  loadingData = false;
  errorMsg = '';

  categories: any[] = [];
  units: any[] = [];

  constructor(
    private fb: FormBuilder,
    private service: ProductsService,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!id;
    this.itemId = id ? +id : null;

    this.http.get<any>(`${environment.apiUrl}/categories`).subscribe(
      r => this.categories = r.data.filter((c: any) => c.is_active === 1)
    );
    this.http.get<any>(`${environment.apiUrl}/units`).subscribe(
      r => this.units = r.data
    );

    this.buildForm();

    if (this.isEdit && this.itemId) {
      this.loadItem(this.itemId);
    }
  }

  private buildForm(): void {
    this.form = this.fb.group({
      name:        ['', [Validators.required]],
      description: [''],
      category_id: [null, [Validators.required, Validators.min(1)]],
      unit_id:     [null, [Validators.required, Validators.min(1)]],
      price:       [null, [Validators.required, Validators.min(0)]],
      stock:       [0, [Validators.min(0)]],
      min_stock:   [0, [Validators.min(0)]],
      is_active:   [1]
    });
  }

  private loadItem(id: number): void {
    this.loadingData = true;
    this.service.getById(id).subscribe({
      next: res => {
        const p = res.data;
        this.form.patchValue({
          name:        p.name,
          description: p.description,
          category_id: p.category_id,
          unit_id:     p.unit_id,
          price:       p.price,
          stock:       p.stock,
          min_stock:   p.min_stock,
          is_active:   p.is_active
        });
        this.loadingData = false;
      },
      error: err => {
        this.errorMsg = err.error?.message || 'Error al cargar producto';
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
      name:        value.name,
      description: value.description || null,
      category_id: +value.category_id,
      unit_id:     +value.unit_id,
      price:       +value.price,
      stock:       +value.stock,
      min_stock:   +value.min_stock
    };

    if (this.isEdit) {
      payload.is_active = value.is_active ? 1 : 0;
    }

    const req = this.isEdit
      ? this.service.update(this.itemId!, payload)
      : this.service.create(payload);

    req.subscribe({
      next: () => this.router.navigate(['/dashboard/products']),
      error: err => {
        this.errorMsg = err.error?.message || 'Error al guardar producto';
        this.loading = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/dashboard/products']);
  }

  field(name: string) { return this.form.get(name); }
}
