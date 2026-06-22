import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Client } from '../../../shared/models/client.model';
import { ClientsService } from '../clients.service';

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

  constructor(private service: ClientsService, private router: Router) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMsg = '';
    this.service.getAll().subscribe({
      next: res => {
        this.items = res.data;
        this.loading = false;
      },
      error: err => {
        this.errorMsg = err.error?.message || 'Error al cargar clientes';
        this.loading = false;
      }
    });
  }

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
}
