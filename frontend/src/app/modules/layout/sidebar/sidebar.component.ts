import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MenuItem } from '../../../shared/models/user.model';
import { AuthService } from '../../../core/services/auth.service';
import { SettingsService } from '../../../core/services/settings.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  @Input() open = true;
  @Output() closeRequest = new EventEmitter<void>();

  logoUrl: string | null = null;
  businessName = '';

  // All menu groups — items with roles are filtered for the current user
  private allMenuGroups: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Principal',
      items: [
        { label: 'Dashboard',   icon: '📊', route: '/dashboard' }
      ]
    },
    {
      title: 'Mantenimiento',
      items: [
        { label: 'Categorías',    icon: '🏷️',  route: '/dashboard/categories' },
        { label: 'Unidades',      icon: '📏',  route: '/dashboard/units' },
        { label: 'Tipos de molde',icon: '🫧',  route: '/dashboard/mold-types' },
        { label: 'Moldes',        icon: '🫙',  route: '/dashboard/molds' },
        { label: 'Productos',     icon: '📦',  route: '/dashboard/products' },
        { label: 'Stock',        icon: '🏭',  route: '/dashboard/stock' },
        { label: 'Clientes',     icon: '👥',  route: '/dashboard/clients' }
      ]
    },
    {
      title: 'Ventas',
      items: [
        { label: 'Proformas',   icon: '🧾',  route: '/dashboard/proformas' },
        { label: 'Órdenes',     icon: '📋',  route: '/dashboard/orders' },
        { label: 'Calculadora', icon: '🧮',  route: '/dashboard/calculator' }
      ]
    },
    {
      title: 'Sistema',
      items: [
        { label: 'Reportes',    icon: '📈',  route: '/dashboard/reports' },
        { label: 'Usuarios',    icon: '👤',  route: '/dashboard/users', roles: ['admin'] },
        { label: 'Empresa',     icon: '⚙️',  route: '/dashboard/settings', roles: ['admin'] }
      ]
    }
  ];

  menuGroups: { title: string; items: MenuItem[] }[] = [];

  constructor(private auth: AuthService, private settings: SettingsService) {}

  ngOnInit(): void {
    this.auth.user$.subscribe(() => this.buildMenu());
    this.buildMenu();
    this.settings.settings$.subscribe(s => {
      this.logoUrl = s?.logo_url || null;
      this.businessName = s?.name || 'Mi Negocio';
    });
    if (!this.settings.current) {
      this.settings.load().subscribe();
    }
  }

  private buildMenu(): void {
    const role = this.auth.currentUser?.role;
    this.menuGroups = this.allMenuGroups
      .map(group => ({
        title: group.title,
        items: group.items.filter(item =>
          !item.roles || (role !== undefined && item.roles.includes(role))
        )
      }))
      .filter(group => group.items.length > 0);
  }
}
