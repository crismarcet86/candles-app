import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  summary: any = null;
  lowStock: any[] = [];
  loading = true;
  errorMsg = '';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.http.get<any>(`${environment.apiUrl}/reports/summary`).subscribe({
      next: res => { this.summary = res.data; this.loading = false; },
      error: ()  => { this.loading = false; }
    });
    this.http.get<any>(`${environment.apiUrl}/reports/low-stock`).subscribe({
      next: res => { this.lowStock = (res.data || []).slice(0, 5); },
      error: ()  => {}
    });
  }

  goTo(path: string): void {
    this.router.navigate([path]);
  }
}
