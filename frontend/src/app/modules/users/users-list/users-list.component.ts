import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { User } from '../../../shared/models/user.model';
import { UsersService } from '../users.service';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.css']
})
export class UsersListComponent implements OnInit {
  users: User[] = [];
  loading = true;
  errorMsg = '';
  successMsg = '';
  confirmDeactivateId: number | null = null;

  constructor(
    private usersService: UsersService,
    public auth: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.errorMsg = '';
    this.usersService.getAll().subscribe({
      next: res => {
        this.users = res.data;
        this.loading = false;
      },
      error: err => {
        this.errorMsg = err.error?.message || 'Error al cargar usuarios';
        this.loading = false;
      }
    });
  }

  goToNew(): void {
    this.router.navigate(['/dashboard/users/new']);
  }

  goToEdit(id: number): void {
    this.router.navigate(['/dashboard/users', id, 'edit']);
  }

  askDeactivate(id: number): void {
    this.confirmDeactivateId = id;
  }

  cancelDeactivate(): void {
    this.confirmDeactivateId = null;
  }

  confirmDeactivate(): void {
    if (this.confirmDeactivateId === null) return;
    const id = this.confirmDeactivateId;
    this.confirmDeactivateId = null;

    this.usersService.deactivate(id).subscribe({
      next: () => {
        this.successMsg = 'Usuario desactivado correctamente';
        this.loadUsers();
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: err => {
        this.errorMsg = err.error?.message || 'Error al desactivar usuario';
      }
    });
  }

  isCurrentUser(userId: number): boolean {
    return this.auth.currentUser?.id === userId;
  }

  downloadPdf(): void {
    this.http.get(`${environment.apiUrl}/users/pdf`, { responseType: 'blob' }).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'usuarios.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      },
      error: () => {}
    });
  }
}
