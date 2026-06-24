import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MoldType {
  id: number;
  name: string;
  image_path: string | null;
  image_url: string | null;
  is_active: number;
  created_at: string;
}

interface ApiResponse<T> { ok: boolean; message: string; data: T; }

@Injectable({ providedIn: 'root' })
export class MoldTypesService {
  private base = `${environment.apiUrl}/mold-types`;
  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<MoldType[]>> {
    return this.http.get<ApiResponse<MoldType[]>>(this.base);
  }

  getById(id: number): Observable<ApiResponse<MoldType>> {
    return this.http.get<ApiResponse<MoldType>>(`${this.base}/${id}`);
  }

  create(payload: { name: string }): Observable<ApiResponse<MoldType>> {
    return this.http.post<ApiResponse<MoldType>>(this.base, payload);
  }

  update(id: number, payload: Partial<MoldType>): Observable<ApiResponse<MoldType>> {
    return this.http.put<ApiResponse<MoldType>>(`${this.base}/${id}`, payload);
  }

  deactivate(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.base}/${id}`);
  }

  uploadImage(id: number, file: File): Observable<ApiResponse<MoldType>> {
    const fd = new FormData();
    fd.append('image', file);
    return this.http.post<ApiResponse<MoldType>>(`${this.base}/${id}/image`, fd);
  }
}
