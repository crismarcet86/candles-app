import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Mold } from '../../shared/models/mold.model';
import { environment } from '../../../environments/environment';

export interface ApiResponse<T> { ok: boolean; message: string; data: T; }

@Injectable({ providedIn: 'root' })
export class MoldsService {
  private base = `${environment.apiUrl}/molds`;
  constructor(private http: HttpClient) {}
  getAll(f: { name?: string; mold_type_id?: number | null } = {}): Observable<ApiResponse<Mold[]>> {
    let params = new HttpParams();
    if (f.name) params = params.set('name', f.name);
    if (f.mold_type_id) params = params.set('mold_type_id', String(f.mold_type_id));
    return this.http.get<ApiResponse<Mold[]>>(this.base, { params });
  }
  getById(id: number): Observable<ApiResponse<Mold>> { return this.http.get<ApiResponse<Mold>>(`${this.base}/${id}`); }
  create(payload: any): Observable<ApiResponse<Mold>> { return this.http.post<ApiResponse<Mold>>(this.base, payload); }
  update(id: number, payload: any): Observable<ApiResponse<Mold>> { return this.http.put<ApiResponse<Mold>>(`${this.base}/${id}`, payload); }
  deactivate(id: number): Observable<ApiResponse<any>> { return this.http.delete<ApiResponse<any>>(`${this.base}/${id}`); }
  uploadImage(id: number, file: File): Observable<ApiResponse<Mold>> {
    const fd = new FormData();
    fd.append('image', file);
    return this.http.post<ApiResponse<Mold>>(`${this.base}/${id}/image`, fd);
  }
}
