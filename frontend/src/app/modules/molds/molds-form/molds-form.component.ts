import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MoldsService } from '../molds.service';
import { MoldType, MoldTypesService } from '../../mold-types/mold-types.service';

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
  moldTypes: MoldType[] = [];

  constructor(
    private fb: FormBuilder,
    private service: MoldsService,
    private moldTypesService: MoldTypesService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!id;
    this.moldId = id ? +id : null;
    this.buildForm();
    this.moldTypesService.getAll().subscribe({
      next: r => { this.moldTypes = r.data.filter(t => t.is_active === 1); }
    });
    if (this.isEdit && this.moldId) this.loadMold(this.moldId);
  }

  private buildForm(): void {
    this.form = this.fb.group({
      name:         ['', [Validators.required, Validators.minLength(2)]],
      mold_type_id: [null],
      total_grams:  [null, [Validators.min(0.001)]],
      wax_grams:    [null, [Validators.required, Validators.min(0.001)]],
      description:  [''],
      is_active:    [1]
    });
  }

  private loadMold(id: number): void {
    this.loadingData = true;
    this.service.getById(id).subscribe({
      next: res => { this.form.patchValue(res.data); this.loadingData = false; },
      error: err => { this.errorMsg = err.error?.message || 'Error al cargar'; this.loadingData = false; }
    });
  }

  onTotalGramsChange(): void {
    const total = Number(this.form.get('total_grams')?.value);
    if (total > 0) {
      this.form.get('wax_grams')?.setValue(Math.round(total * 0.9 * 1.05 * 100) / 100, { emitEvent: false });
    }
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMsg = '';
    const val = this.form.value;
    const payload = {
      ...val,
      wax_grams:    Number(val.wax_grams),
      total_grams:  val.total_grams ? Number(val.total_grams) : null,
      mold_type_id: val.mold_type_id ? Number(val.mold_type_id) : null,
    };
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
  blockInvalidKey(e: KeyboardEvent): void {
    if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
  }
}
