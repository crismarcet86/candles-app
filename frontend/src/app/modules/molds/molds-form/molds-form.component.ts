import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MoldsService } from '../molds.service';

@Component({
  selector: 'app-molds-form',
  templateUrl: './molds-form.component.html',
  styleUrls: ['./molds-form.component.css']
})
export class MoldsFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  moldId: number | null = null;
  loading = false;
  loadingData = false;
  errorMsg = '';

  constructor(
    private fb: FormBuilder,
    private service: MoldsService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!id;
    this.moldId = id ? +id : null;
    this.buildForm();
    if (this.isEdit && this.moldId) this.loadMold(this.moldId);
  }

  private buildForm(): void {
    this.form = this.fb.group({
      name:        ['', [Validators.required, Validators.minLength(2)]],
      wax_grams:   [null, [Validators.required, Validators.min(0.001)]],
      description: [''],
      is_active:   [1]
    });
  }

  private loadMold(id: number): void {
    this.loadingData = true;
    this.service.getById(id).subscribe({
      next: res => { this.form.patchValue(res.data); this.loadingData = false; },
      error: err => { this.errorMsg = err.error?.message || 'Error al cargar'; this.loadingData = false; }
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true; this.errorMsg = '';
    const val = this.form.value;
    const payload = { ...val, wax_grams: Number(val.wax_grams) };
    const req = this.isEdit
      ? this.service.update(this.moldId!, payload)
      : this.service.create(payload);
    req.subscribe({
      next: () => this.router.navigate(['/dashboard/molds']),
      error: err => { this.errorMsg = err.error?.message || 'Error al guardar'; this.loading = false; }
    });
  }

  cancel(): void { this.router.navigate(['/dashboard/molds']); }
  field(name: string) { return this.form.get(name); }
}
