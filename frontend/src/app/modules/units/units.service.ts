import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Unit } from '../../shared/models/unit.model';
import { environment } from '../../../environments/environment';

export interface ApiResponse<T> {
  ok: boolean;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class UnitsService {
  private base = `${environment.apiUrl}/units`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<Unit[]>> {
    return this.http.get<ApiResponse<Unit[]>>(this.base);
  }

  getById(id: number): Observable<ApiResponse<Unit>> {
    return this.http.get<ApiResponse<Unit>>(`${this.base}/${id}`);
  }

  create(payload: any): Observable<ApiResponse<Unit>> {
    return this.http.post<ApiResponse<Unit>>(this.base, payload);
  }

  update(id: number, payload: any): Observable<ApiResponse<Unit>> {
    return this.http.put<ApiResponse<Unit>>(`${this.base}/${id}`, payload);
  }

  delete(id: number): Observable<ApiResponse<Unit>> {
    return this.http.delete<ApiResponse<Unit>>(`${this.base}/${id}`);
  }
}
