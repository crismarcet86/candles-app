import { Component, HostListener, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit {
  sidebarOpen = true;
  isMobile = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.checkMobile();
    // Auto-close sidebar on navigation when mobile
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => {
      if (this.isMobile) this.sidebarOpen = false;
    });
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkMobile();
  }

  private checkMobile(): void {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth < 768;
    // Auto-close when switching to mobile, auto-open when switching to desktop
    if (!wasMobile && this.isMobile) this.sidebarOpen = false;
    if (wasMobile && !this.isMobile) this.sidebarOpen = true;
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }
}
