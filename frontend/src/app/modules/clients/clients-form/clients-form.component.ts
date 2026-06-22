import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientsService } from '../clients.service';

@Component({
  selector: 'app-clients-form',
  templateUrl: './clients-form.component.html',
  styleUrls: ['./clients-form.component.css']
})
export class ClientsFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  itemId: number | null = null;
  loading = false;
  loadingData = false;
  errorMsg = '';

  constructor(
    private fb: FormBuilder,
    private service: ClientsService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!id;
    this.itemId = id ? +id : null;

    this.buildForm();

    if (this.isEdit && this.itemId) {
      this.loadItem(this.itemId);
    }
  }

  private readonly emailPattern = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

  private buildForm(): void {
    this.form = this.fb.group({
      name:      ['', [Validators.required]],
      cedula:    [''],
      email:     ['', [Validators.pattern(this.emailPattern)]],
      phone:     [''],
      address:   [''],
      notes:     [''],
      is_active: [1]
    });
  }

  private loadItem(id: number): void {
    this.loadingData = true;
    this.service.getById(id).subscribe({
      next: res => {
        const c = res.data;
        this.form.patchValue({
          name:      c.name,
          cedula:    c.cedula || '',
          email:     c.email || '',
          phone:     c.phone || '',
          address:   c.address || '',
          notes:     c.notes || '',
          is_active: c.is_active
        });
        this.loadingData = false;
      },
      error: err => {
        this.errorMsg = err.error?.message || 'Error al cargar cliente';
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
      name:    value.name,
      cedula:  value.cedula  || null,
      email:   value.email   || null,
      phone:   value.phone   || null,
      address: value.address || null,
      notes:   value.notes   || null
    };

    if (this.isEdit) {
      payload.is_active = value.is_active ? 1 : 0;
    }

    const req = this.isEdit
      ? this.service.update(this.itemId!, payload)
      : this.service.create(payload);

    req.subscribe({
      next: () => this.router.navigate(['/dashboard/clients']),
      error: err => {
        this.errorMsg = err.error?.message || 'Error al guardar cliente';
        this.loading = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/dashboard/clients']);
  }

  field(name: string) { return this.form.get(name); }
}
