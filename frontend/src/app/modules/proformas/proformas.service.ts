import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Proforma } from '../../shared/models/proforma.model';
import { environment } from '../../../environments/environment';

export interface ApiResponse<T> { ok: boolean; message: string; data: T; }

@Injectable({ providedIn: 'root' })
export class ProformasService {
  private base = `${environment.apiUrl}/proformas`;
  constructor(private http: HttpClient) {}
  getAll(f: { client?: string; status?: string; from?: string; to?: string } = {}): Observable<ApiResponse<Proforma[]>> {
    let params = new HttpParams();
    if (f.client) params = params.set('client', f.client);
    if (f.status) params = params.set('status', f.status);
    if (f.from)   params = params.set('from', f.from);
    if (f.to)     params = params.set('to', f.to);
    return this.http.get<ApiResponse<Proforma[]>>(this.base, { params });
  }
  getById(id: number): Observable<ApiResponse<Proforma>> { return this.http.get<ApiResponse<Proforma>>(`${this.base}/${id}`); }
  create(payload: any): Observable<ApiResponse<Proforma>> { return this.http.post<ApiResponse<Proforma>>(this.base, payload); }
  update(id: number, payload: any): Observable<ApiResponse<Proforma>> { return this.http.put<ApiResponse<Proforma>>(`${this.base}/${id}`, payload); }
  confirm(id: number): Observable<ApiResponse<any>> { return this.http.post<ApiResponse<any>>(`${this.base}/${id}/confirm`, {}); }
  cancel(id: number): Observable<ApiResponse<any>> { return this.http.post<ApiResponse<any>>(`${this.base}/${id}/cancel`, {}); }
}
