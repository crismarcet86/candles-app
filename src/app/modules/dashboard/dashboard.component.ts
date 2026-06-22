import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="welcome">
      <h2>🕯️ Bienvenido al sistema</h2>
      <p>Selecciona una opción del menú lateral para comenzar.</p>
    </div>
  `,
  styles: [`
    .welcome {
      background: #fff;
      border-radius: 12px;
      padding: 2.5rem;
      text-align: center;
      color: #374151;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    h2 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #1a1a2e; }
    p  { color: #6b7280; }
  `]
})
export class DashboardComponent {}
