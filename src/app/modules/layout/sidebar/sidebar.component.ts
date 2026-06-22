import { Component, Input } from '@angular/core';
import { MenuItem } from '../../../shared/models/user.model';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  @Input() open = true;

  // Grupos del menú — agrega más a medida que construyas los módulos
  menuGroups: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Principal',
      items: [
        { label: 'Dashboard',   icon: '📊', route: '/dashboard' }
      ]
    },
    {
      title: 'Mantenimiento',
      items: [
        { label: 'Categorías',  icon: '🏷️',  route: '/dashboard/categories' },
        { label: 'Unidades',    icon: '📏',  route: '/dashboard/units' },
        { label: 'Productos',   icon: '📦',  route: '/dashboard/products' },
        { label: 'Clientes',    icon: '👥',  route: '/dashboard/clients' }
      ]
    },
    {
      title: 'Ventas',
      items: [
        { label: 'Proformas',   icon: '🧾',  route: '/dashboard/proformas' },
        { label: 'Órdenes',     icon: '📋',  route: '/dashboard/orders' }
      ]
    },
    {
      title: 'Sistema',
      items: [
        { label: 'Usuarios',    icon: '👤',  route: '/dashboard/users', roles: ['admin'] }
      ]
    }
  ];
}
