import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { SettingsService } from '../../../core/services/settings.service';
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
  userMenuOpen = false;

  // Change password modal
  showPwModal = false;
  currentPw = '';
  newPw = '';
  confirmPw = '';
  pwLoading = false;
  pwError = '';
  pwSuccess = '';

  constructor(public auth: AuthService, private settingsService: SettingsService) {}

  ngOnInit(): void {
    this.auth.user$.subscribe(u => this.user = u);
    this.settingsService.settings$.subscribe(s => {
      this.businessName = s?.name || this.auth.businessName;
    });
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
