import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Mold } from '../../../shared/models/mold.model';
import { MoldsService } from '../molds.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-molds-list',
  templateUrl: './molds-list.component.html',
  styleUrls: ['./molds-list.component.css']
})
export class MoldsListComponent implements OnInit {
  molds: Mold[] = [];
  loading = true;
  errorMsg = '';
  successMsg = '';
  confirmDeactivateId: number | null = null;
  previewImage: { url: string; name: string } | null = null;

  constructor(private service: MoldsService, private router: Router, private http: HttpClient) {}
  ngOnInit() { this.load(); }

  load() {
    this.loading = true; this.errorMsg = '';
    this.service.getAll().subscribe({
      next: res => { this.molds = res.data; this.loading = false; },
      error: err => { this.errorMsg = err.error?.message || 'Error al cargar moldes'; this.loading = false; }
    });
  }

  goToNew() { this.router.navigate(['/dashboard/molds/new']); }
  goToEdit(id: number) { this.router.navigate(['/dashboard/molds', id, 'edit']); }
  askDeactivate(id: number) { this.confirmDeactivateId = id; }
  cancelDeactivate() { this.confirmDeactivateId = null; }

  openPreview(m: Mold): void {
    if (m.image_url) this.previewImage = { url: m.image_url, name: m.name };
  }
  closePreview(): void { this.previewImage = null; }

  confirmDeactivate() {
    if (!this.confirmDeactivateId) return;
    const id = this.confirmDeactivateId; this.confirmDeactivateId = null;
    this.service.deactivate(id).subscribe({
      next: () => { this.successMsg = 'Molde desactivado'; this.load(); setTimeout(() => this.successMsg = '', 3000); },
      error: err => { this.errorMsg = err.error?.message || 'Error'; }
    });
  }

  downloadPdf(): void {
    this.http.get(`${environment.apiUrl}/molds/pdf`, { responseType: 'blob' }).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'moldes.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      },
      error: () => {}
    });
  }
}
