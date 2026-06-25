import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Unit { id: number; name: string; abbreviation: string; created_at: string; }
export interface ApiResponse<T> { ok: boolean; message: string; data: T; }

@Injectable({ providedIn: 'root' })
export class UnitsService {
  private base = `${environment.apiUrl}/units`;
  constructor(private http: HttpClient) {}

  getAll(f: { search?: string } = {}): Observable<ApiResponse<Unit[]>> {
    let params = new HttpParams();
    if (f.search) params = params.set('search', f.search);
    return this.http.get<ApiResponse<Unit[]>>(this.base, { params });
  }

  getById(id: number): Observable<ApiResponse<Unit>> { return this.http.get<ApiResponse<Unit>>(`${this.base}/${id}`); }
  create(payload: any): Observable<ApiResponse<Unit>> { return this.http.post<ApiResponse<Unit>>(this.base, payload); }
  update(id: number, payload: any): Observable<ApiResponse<Unit>> { return this.http.put<ApiResponse<Unit>>(`${this.base}/${id}`, payload); }
  delete(id: number): Observable<ApiResponse<any>> { return this.http.delete<ApiResponse<any>>(`${this.base}/${id}`); }
}
