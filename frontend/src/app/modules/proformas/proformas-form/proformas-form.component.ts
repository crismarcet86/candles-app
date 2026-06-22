import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ProformasService } from '../proformas.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-proformas-form',
  templateUrl: './proformas-form.component.html',
  styleUrls: ['./proformas-form.component.css']
})
export class ProformasFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  proformaId: number | null = null;
  loading = false;
  loadingData = false;
  errorMsg = '';
  clients: any[] = [];

  constructor(
    private fb: FormBuilder,
    private service: ProformasService,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!id;
    this.proformaId = id ? +id : null;
    this.buildForm();
    this.http.get<any>(`${environment.apiUrl}/clients`).subscribe(
      r => this.clients = r.data.filter((c: any) => c.is_active === 1)
    );
    if (this.isEdit && this.proformaId) {
      this.loadProforma(this.proformaId);
    } else {
      this.addItem();
    }
  }

  private buildForm(): void {
    this.form = this.fb.group({
      client_id:  [null, Validators.required],
      notes:      [''],
      discount:   [0, [Validators.min(0)]],
      labor_cost: [0, [Validators.min(0)]],
      items:      this.fb.array([])
    });
  }

  private loadProforma(id: number): void {
    this.loadingData = true;
    this.service.getById(id).subscribe({
      next: res => {
        const p = res.data;
        this.form.patchValue({
          client_id:  p.client_id,
          notes:      p.notes || '',
          discount:   p.discount,
          labor_cost: p.labor_cost || 0
        });
        while (this.items.length) this.items.removeAt(0);
        (p.items || []).forEach((item: any) => {
          this.items.push(this.fb.group({
            description: [item.description || item.product_name || '', Validators.required],
            quantity:    [item.quantity, [Validators.required, Validators.min(0.001)]],
            unit_price:  [item.unit_price, [Validators.required, Validators.min(0)]]
          }));
        });
        this.loadingData = false;
      },
      error: err => { this.errorMsg = err.error?.message || 'Error al cargar'; this.loadingData = false; }
    });
  }

  get items(): FormArray { return this.form.get('items') as FormArray; }

  addItem(): void {
    this.items.push(this.fb.group({
      description: ['', Validators.required],
      quantity:    [1,  [Validators.required, Validators.min(0.001)]],
      unit_price:  [0,  [Validators.required, Validators.min(0)]]
    }));
  }

  removeItem(i: number): void {
    if (this.items.length > 1) this.items.removeAt(i);
  }

  getItemSubtotal(i: number): number {
    const item = this.items.at(i).value;
    return (item.quantity || 0) * (item.unit_price || 0);
  }

  getSubtotal(): number {
    let s = 0;
    for (let i = 0; i < this.items.length; i++) s += this.getItemSubtotal(i);
    return s;
  }

  getTotal(): number {
    const laborCost = +(this.form.get('labor_cost')?.value || 0);
    const discount  = +(this.form.get('discount')?.value  || 0);
    return Math.max(0, this.getSubtotal() + laborCost - discount);
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true; this.errorMsg = '';
    const val = this.form.value;
    const payload = {
      client_id:  +val.client_id,
      notes:      val.notes || null,
      discount:   +(val.discount || 0),
      labor_cost: +(val.labor_cost || 0),
      items: val.items.map((it: any) => ({
        description: it.description,
        quantity:    +it.quantity,
        unit_price:  +it.unit_price
      }))
    };
    const req = this.isEdit
      ? this.service.update(this.proformaId!, payload)
      : this.service.create(payload);
    req.subscribe({
      next: () => this.router.navigate(['/dashboard/proformas']),
      error: err => { this.errorMsg = err.error?.message || 'Error al guardar'; this.loading = false; }
    });
  }

  cancel(): void { this.router.navigate(['/dashboard/proformas']); }
  field(name: string) { return this.form.get(name); }
  itemField(i: number, name: string) { return this.items.at(i).get(name); }
}
