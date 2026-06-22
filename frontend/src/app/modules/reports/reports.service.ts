import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private base = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  getSummary(): Observable<any> {
    return this.http.get<any>(`${this.base}/summary`);
  }

  getOrders(from?: string, to?: string): Observable<any> {
    let url = `${this.base}/orders`;
    const params: string[] = [];
    if (from) params.push(`from=${from}`);
    if (to)   params.push(`to=${to}`);
    if (params.length) url += '?' + params.join('&');
    return this.http.get<any>(url);
  }

  getLowStock(): Observable<any> {
    return this.http.get<any>(`${this.base}/low-stock`);
  }

  getTopClients(): Observable<any> {
    return this.http.get<any>(`${this.base}/top-clients`);
  }

  getPdfUrl(from?: string, to?: string): string {
    let url = `${this.base}/pdf`;
    const params: string[] = [];
    if (from) params.push(`from=${from}`);
    if (to)   params.push(`to=${to}`);
    if (params.length) url += '?' + params.join('&');
    return url;
  }

  downloadPdf(from?: string, to?: string): Observable<Blob> {
    let url = `${this.base}/pdf`;
    const params: string[] = [];
    if (from) params.push(`from=${from}`);
    if (to)   params.push(`to=${to}`);
    if (params.length) url += '?' + params.join('&');
    return this.http.get(url, { responseType: 'blob' });
  }
}
