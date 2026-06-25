import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Client } from '../../shared/models/client.model';
import { environment } from '../../../environments/environment';

export interface ApiResponse<T> {
  ok: boolean;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class ClientsService {
  private base = `${environment.apiUrl}/clients`;

  constructor(private http: HttpClient) {}

  getAll(f: { name?: string; cedula?: string } = {}): Observable<ApiResponse<Client[]>> {
    let params = new HttpParams();
    if (f.name) params = params.set('name', f.name);
    if (f.cedula) params = params.set('cedula', f.cedula);
    return this.http.get<ApiResponse<Client[]>>(this.base, { params });
  }

  getById(id: number): Observable<ApiResponse<Client>> {
    return this.http.get<ApiResponse<Client>>(`${this.base}/${id}`);
  }

  create(payload: any): Observable<ApiResponse<Client>> {
    return this.http.post<ApiResponse<Client>>(this.base, payload);
  }

  update(id: number, payload: any): Observable<ApiResponse<Client>> {
    return this.http.put<ApiResponse<Client>>(`${this.base}/${id}`, payload);
  }

  delete(id: number): Observable<ApiResponse<Client>> {
    return this.http.delete<ApiResponse<Client>>(`${this.base}/${id}`);
  }
}
