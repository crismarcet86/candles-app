import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UnitsService } from '../units.service';

@Component({
  selector: 'app-units-form',
  templateUrl: './units-form.component.html',
  styleUrls: ['./units-form.component.css']
})
export class UnitsFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  unitId: number | null = null;
  loading = false;
  loadingData = false;
  errorMsg = '';

  constructor(
    private fb: FormBuilder,
    private unitsService: UnitsService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!idParam;
    this.unitId = idParam ? +idParam : null;

    this.buildForm();

    if (this.isEdit && this.unitId) {
      this.loadUnit(this.unitId);
    }
  }

  private buildForm(): void {
    this.form = this.fb.group({
      name:         ['', [Validators.required, Validators.minLength(2)]],
      abbreviation: ['', [Validators.required, Validators.minLength(1)]]
    });
  }

  private loadUnit(id: number): void {
    this.loadingData = true;
    this.unitsService.getById(id).subscribe({
      next: res => {
        const u = res.data;
        this.form.patchValue({
          name:         u.name,
          abbreviation: u.abbreviation
        });
        this.loadingData = false;
      },
      error: err => {
        this.errorMsg = err.error?.message || 'Error al cargar unidad';
        this.loadingData = false;
      }
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMsg = '';

    const value = this.form.value;
    const payload = {
      name:         value.name,
      abbreviation: value.abbreviation
    };

    const request = this.isEdit && this.unitId
      ? this.unitsService.update(this.unitId, payload)
      : this.unitsService.create(payload);

    request.subscribe({
      next: () => this.router.navigate(['/dashboard/units']),
      error: err => {
        this.errorMsg = err.error?.message || 'Error al guardar unidad';
        this.loading = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/dashboard/units']);
  }

  field(name: string) { return this.form.get(name); }
}
