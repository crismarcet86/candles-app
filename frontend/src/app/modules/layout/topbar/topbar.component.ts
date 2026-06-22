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

  logout(): void {
    this.auth.logout();
  }
}
