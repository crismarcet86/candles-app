import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Mold } from '../../shared/models/mold.model';
import { environment } from '../../../environments/environment';

export interface ApiResponse<T> { ok: boolean; message: string; data: T; }

@Injectable({ providedIn: 'root' })
export class MoldsService {
  private base = `${environment.apiUrl}/molds`;
  constructor(private http: HttpClient) {}
  getAll(): Observable<ApiResponse<Mold[]>> { return this.http.get<ApiResponse<Mold[]>>(this.base); }
  getById(id: number): Observable<ApiResponse<Mold>> { return this.http.get<ApiResponse<Mold>>(`${this.base}/${id}`); }
  create(payload: any): Observable<ApiResponse<Mold>> { return this.http.post<ApiResponse<Mold>>(this.base, payload); }
  update(id: number, payload: any): Observable<ApiResponse<Mold>> { return this.http.put<ApiResponse<Mold>>(`${this.base}/${id}`, payload); }
  deactivate(id: number): Observable<ApiResponse<any>> { return this.http.delete<ApiResponse<any>>(`${this.base}/${id}`); }
}
