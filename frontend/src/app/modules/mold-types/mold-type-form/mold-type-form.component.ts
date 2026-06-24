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
  successMsg = '';
  previewUrl: string | null = null;
  uploadingImage = false;

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
        next: r => {
          this.form.patchValue(r.data);
          this.previewUrl = r.data.image_url || null;
          this.loadingData = false;
        },
        error: () => { this.errorMsg = 'Error al cargar'; this.loadingData = false; }
      });
    }
  }

  onImageChange(event: any): void {
    if (!this.isEdit || !this.typeId) return;
    const file: File = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { this.errorMsg = 'Solo se permiten imágenes'; return; }
    if (file.size > 2 * 1024 * 1024) { this.errorMsg = 'La imagen no puede superar 2 MB'; return; }
    this.errorMsg = '';
    const reader = new FileReader();
    reader.onload = e => this.previewUrl = e.target?.result as string;
    reader.readAsDataURL(file);
    this.uploadingImage = true;
    this.svc.uploadImage(this.typeId, file).subscribe({
      next: r => {
        this.previewUrl = r.data.image_url || this.previewUrl;
        this.uploadingImage = false;
        this.successMsg = 'Imagen guardada';
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: () => { this.uploadingImage = false; this.errorMsg = 'Error al subir imagen'; }
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMsg = '';
    const req = this.isEdit
      ? this.svc.update(this.typeId!, this.form.value)
      : this.svc.create(this.form.value);
    req.subscribe({
      next: (r) => {
        if (!this.isEdit) {
          // Si hay imagen pendiente, navegar al edit para subirla; si no, volver a lista
          this.router.navigate(['/dashboard/mold-types']);
        } else {
          this.router.navigate(['/dashboard/mold-types']);
        }
      },
      error: err => { this.errorMsg = err.error?.message || 'Error al guardar'; this.loading = false; }
    });
  }

  cancel(): void { this.router.navigate(['/dashboard/mold-types']); }
  field(n: string) { return this.form.get(n); }
}
