import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SettingsService } from '../../core/services/settings.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  form!: FormGroup;
  loading = true;
  saving = false;
  uploadingLogo = false;
  uploadingReportLogo = false;
  successMsg = '';
  errorMsg = '';
  previewUrl: string | null = null;
  reportPreviewUrl: string | null = null;

  constructor(private fb: FormBuilder, private settings: SettingsService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name:         ['', Validators.required],
      ruc:          [''],
      phone:        [''],
      observations: ['']
    });
    this.settings.load().subscribe({
      next: () => {
        const s = this.settings.current;
        if (s) {
          this.form.patchValue({ name: s.name, ruc: s.ruc || '', phone: s.phone || '', observations: s.observations || '' });
          this.previewUrl = s.logo_url || null;
          this.reportPreviewUrl = s.report_logo_url || null;
        }
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  field(name: string) { return this.form.get(name); }

  private validateImageFile(file: File): boolean {
    if (!file.type.startsWith('image/')) { this.errorMsg = 'Solo se permiten imágenes'; return false; }
    if (file.size > 2 * 1024 * 1024)    { this.errorMsg = 'La imagen no puede superar 2 MB'; return false; }
    return true;
  }

  onFileChange(event: any): void {
    const file: File = event.target.files?.[0];
    if (!file) return;
    this.errorMsg = '';
    if (!this.validateImageFile(file)) return;
    const reader = new FileReader();
    reader.onload = e => this.previewUrl = e.target?.result as string;
    reader.readAsDataURL(file);
    this.uploadingLogo = true;
    this.settings.uploadLogo(file).subscribe({
      next: () => { this.uploadingLogo = false; this.successMsg = 'Logo de icono actualizado'; setTimeout(() => this.successMsg = '', 3000); },
      error: () => { this.uploadingLogo = false; this.errorMsg = 'Error al subir logo'; }
    });
  }

  onReportLogoChange(event: any): void {
    const file: File = event.target.files?.[0];
    if (!file) return;
    this.errorMsg = '';
    if (!this.validateImageFile(file)) return;
    const reader = new FileReader();
    reader.onload = e => this.reportPreviewUrl = e.target?.result as string;
    reader.readAsDataURL(file);
    this.uploadingReportLogo = true;
    this.settings.uploadReportLogo(file).subscribe({
      next: () => { this.uploadingReportLogo = false; this.successMsg = 'Imagen de reportes actualizada'; setTimeout(() => this.successMsg = '', 3000); },
      error: () => { this.uploadingReportLogo = false; this.errorMsg = 'Error al subir imagen de reportes'; }
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    this.errorMsg = '';
    this.settings.update(this.form.value).subscribe({
      next: () => {
        this.saving = false;
        this.successMsg = 'Configuración guardada';
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: err => {
        this.saving = false;
        this.errorMsg = err.error?.message || 'Error al guardar';
      }
    });
  }
}
