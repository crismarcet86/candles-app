import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  getAll(): Observable<ApiResponse<Client[]>> {
    return this.http.get<ApiResponse<Client[]>>(this.base);
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
