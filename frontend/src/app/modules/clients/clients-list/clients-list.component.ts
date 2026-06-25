import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Client } from '../../../shared/models/client.model';
import { ClientsService } from '../clients.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-clients-list',
  templateUrl: './clients-list.component.html',
  styleUrls: ['./clients-list.component.css']
})
export class ClientsListComponent implements OnInit {
  items: Client[] = [];
  loading = true;
  errorMsg = '';
  successMsg = '';
  confirmDeleteId: number | null = null;
  filterName = '';
  filterCedula = '';
  private ft: any;

  constructor(private service: ClientsService, private router: Router, private http: HttpClient) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true; this.errorMsg = '';
    this.service.getAll({ name: this.filterName, cedula: this.filterCedula }).subscribe({
      next: res => { this.items = res.data; this.loading = false; },
      error: err => { this.errorMsg = err.error?.message || 'Error al cargar'; this.loading = false; }
    });
  }
  onFilterChange(): void { clearTimeout(this.ft); this.ft = setTimeout(() => this.load(), 400); }
  get hasFilters(): boolean { return !!(this.filterName || this.filterCedula); }
  clearFilters(): void { this.filterName = ''; this.filterCedula = ''; this.load(); }

  goToNew(): void {
    this.router.navigate(['/dashboard/clients/new']);
  }

  goToEdit(id: number): void {
    this.router.navigate(['/dashboard/clients', id, 'edit']);
  }

  askDelete(id: number): void {
    this.confirmDeleteId = id;
  }

  cancelDelete(): void {
    this.confirmDeleteId = null;
  }

  confirmDelete(): void {
    if (this.confirmDeleteId === null) return;
    const id = this.confirmDeleteId;
    this.confirmDeleteId = null;

    this.service.delete(id).subscribe({
      next: () => {
        this.successMsg = 'Cliente desactivado correctamente';
        this.load();
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: err => {
        this.errorMsg = err.error?.message || 'Error al desactivar cliente';
      }
    });
  }

  downloadPdf(): void {
    let p = new URLSearchParams();
    if (this.filterName) p.set('name', this.filterName);
    if (this.filterCedula) p.set('cedula', this.filterCedula);
    const qs = p.toString() ? '?' + p.toString() : '';
    this.http.get(`${environment.apiUrl}/clients/pdf${qs}`, { responseType: 'blob' }).subscribe({
      next: blob => { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'clientes.pdf'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); },
      error: () => {}
    });
  }
}
