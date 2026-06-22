import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Proforma } from '../../shared/models/proforma.model';
import { environment } from '../../../environments/environment';

export interface ApiResponse<T> { ok: boolean; message: string; data: T; }

@Injectable({ providedIn: 'root' })
export class ProformasService {
  private base = `${environment.apiUrl}/proformas`;
  constructor(private http: HttpClient) {}
  getAll(): Observable<ApiResponse<Proforma[]>> { return this.http.get<ApiResponse<Proforma[]>>(this.base); }
  getById(id: number): Observable<ApiResponse<Proforma>> { return this.http.get<ApiResponse<Proforma>>(`${this.base}/${id}`); }
  create(payload: any): Observable<ApiResponse<Proforma>> { return this.http.post<ApiResponse<Proforma>>(this.base, payload); }
  update(id: number, payload: any): Observable<ApiResponse<Proforma>> { return this.http.put<ApiResponse<Proforma>>(`${this.base}/${id}`, payload); }
  confirm(id: number): Observable<ApiResponse<any>> { return this.http.post<ApiResponse<any>>(`${this.base}/${id}/confirm`, {}); }
  cancel(id: number): Observable<ApiResponse<any>> { return this.http.post<ApiResponse<any>>(`${this.base}/${id}/cancel`, {}); }
}
