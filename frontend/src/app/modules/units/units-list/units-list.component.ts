import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Unit } from '../../../shared/models/unit.model';
import { UnitsService } from '../units.service';

@Component({
  selector: 'app-units-list',
  templateUrl: './units-list.component.html',
  styleUrls: ['./units-list.component.css']
})
export class UnitsListComponent implements OnInit {
  units: Unit[] = [];
  loading = true;
  errorMsg = '';
  successMsg = '';
  confirmDeleteId: number | null = null;

  constructor(
    private unitsService: UnitsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUnits();
  }

  loadUnits(): void {
    this.loading = true;
    this.errorMsg = '';
    this.unitsService.getAll().subscribe({
      next: res => {
        this.units = res.data;
        this.loading = false;
      },
      error: err => {
        this.errorMsg = err.error?.message || 'Error al cargar unidades';
        this.loading = false;
      }
    });
  }

  goToNew(): void {
    this.router.navigate(['/dashboard/units/new']);
  }

  goToEdit(id: number): void {
    this.router.navigate(['/dashboard/units', id, 'edit']);
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

    this.unitsService.delete(id).subscribe({
      next: () => {
        this.successMsg = 'Unidad eliminada correctamente';
        this.loadUnits();
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: err => {
        this.errorMsg = err.error?.message || 'Error al eliminar unidad';
      }
    });
  }
}
