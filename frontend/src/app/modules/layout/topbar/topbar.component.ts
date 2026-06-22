import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../shared/models/user.model';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css']
})
export class TopbarComponent implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>();

  user: User | null = null;
  businessName = '';
  editingName = false;
  tempName = '';
  userMenuOpen = false;

  // Change password modal
  showPwModal = false;
  currentPw = '';
  newPw = '';
  confirmPw = '';
  pwLoading = false;
  pwError = '';
  pwSuccess = '';

  constructor(public auth: AuthService) {}

  ngOnInit(): void {
    this.auth.user$.subscribe(u => this.user = u);
    this.businessName = this.auth.businessName;
  }

  startEdit(): void {
    this.tempName = this.businessName;
    this.editingName = true;
  }

  saveName(): void {
    if (this.tempName.trim()) {
      this.businessName = this.tempName.trim();
      this.auth.setBusinessName(this.businessName);
    }
    this.editingName = false;
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  openPwModal(): void {
    this.userMenuOpen = false;
    this.currentPw = '';
    this.newPw = '';
    this.confirmPw = '';
    this.pwError = '';
    this.pwSuccess = '';
    this.showPwModal = true;
  }

  closePwModal(): void {
    this.showPwModal = false;
  }

  submitChangePassword(): void {
    this.pwError = '';
    this.pwSuccess = '';
    if (!this.currentPw || !this.newPw) {
      this.pwError = 'Completá todos los campos';
      return;
    }
    if (this.newPw.length < 6) {
      this.pwError = 'La nueva contraseña debe tener al menos 6 caracteres';
      return;
    }
    if (this.newPw !== this.confirmPw) {
      this.pwError = 'Las contraseñas no coinciden';
      return;
    }
    this.pwLoading = true;
    this.auth.changePassword(this.currentPw, this.newPw).subscribe({
      next: () => {
        this.pwSuccess = 'Contraseña actualizada correctamente';
        this.pwLoading = false;
        setTimeout(() => this.closePwModal(), 1500);
      },
      error: err => {
        this.pwError = err.error?.message || 'Error al cambiar contraseña';
        this.pwLoading = false;
      }
    });
  }

  logout(): void {
    this.auth.logout();
  }
}
