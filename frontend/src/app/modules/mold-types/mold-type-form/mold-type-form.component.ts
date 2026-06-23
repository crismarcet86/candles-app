import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MoldTypesService } from '../mold-types.service';

@Component({
  selector: 'app-mold-type-form',
  templateUrl: './mold-type-form.component.html',
  styleUrls: ['./mold-type-form.component.css']
})
export class MoldTypeFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  typeId: number | null = null;
  loading = false;
  loadingData = false;
  errorMsg = '';

  constructor(
    private fb: FormBuilder,
    private svc: MoldTypesService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!id;
    this.typeId = id ? +id : null;
    this.form = this.fb.group({
      name:      ['', [Validators.required, Validators.minLength(2)]],
      is_active: [1]
    });
    if (this.isEdit && this.typeId) {
      this.loadingData = true;
      this.svc.getById(this.typeId).subscribe({
        next: r => { this.form.patchValue(r.data); this.loadingData = false; },
        error: () => { this.errorMsg = 'Error al cargar'; this.loadingData = false; }
      });
    }
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMsg = '';
    const req = this.isEdit
      ? this.svc.update(this.typeId!, this.form.value)
      : this.svc.create(this.form.value);
    req.subscribe({
      next: () => this.router.navigate(['/dashboard/mold-types']),
      error: err => { this.errorMsg = err.error?.message || 'Error al guardar'; this.loading = false; }
    });
  }

  cancel(): void { this.router.navigate(['/dashboard/mold-types']); }
  field(n: string) { return this.form.get(n); }
}
