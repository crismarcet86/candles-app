import { Component, OnInit } from '@angular/core';
import { SettingsService } from './core/services/settings.service';

@Component({
  selector: 'app-root',
  template: '<router-outlet></router-outlet>'
})
export class AppComponent implements OnInit {
  constructor(private settings: SettingsService) {}

  ngOnInit(): void {
    this.settings.load().subscribe();
    this.settings.settings$.subscribe(s => {
      this.setFavicon(s?.logo_url || null);
    });
  }

  private setFavicon(url: string | null): void {
    const link: HTMLLinkElement =
      document.querySelector("link[rel~='icon']") ||
      document.createElement('link');
    link.rel = 'icon';
    if (url) {
      link.type = 'image/png';
      link.href = url + '?t=' + Date.now(); // cache-bust al cambiar logo
    } else {
      link.type = 'image/x-icon';
      link.href = 'favicon.ico';
    }
    document.head.appendChild(link);
  }
}
