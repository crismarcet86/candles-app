import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category } from '../../shared/models/category.model';
import { environment } from '../../../environments/environment';

export interface ApiResponse<T> {
  ok: boolean;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private base = `${environment.apiUrl}/categories`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<Category[]>> {
    return this.http.get<ApiResponse<Category[]>>(this.base);
  }

  getById(id: number): Observable<ApiResponse<Category>> {
    return this.http.get<ApiResponse<Category>>(`${this.base}/${id}`);
  }

  create(payload: any): Observable<ApiResponse<Category>> {
    return this.http.post<ApiResponse<Category>>(this.base, payload);
  }

  update(id: number, payload: any): Observable<ApiResponse<Category>> {
    return this.http.put<ApiResponse<Category>>(`${this.base}/${id}`, payload);
  }

  delete(id: number): Observable<ApiResponse<Category>> {
    return this.http.delete<ApiResponse<Category>>(`${this.base}/${id}`);
  }
}
