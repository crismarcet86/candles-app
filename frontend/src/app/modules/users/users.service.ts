import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../../shared/models/user.model';
import { environment } from '../../../environments/environment';

export interface ApiResponse<T> {
  ok: boolean;
  message: string;
  data: T;
}

export interface UserPayload {
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'user';
  is_active?: number;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private base = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(this.base);
  }

  getById(id: number): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.base}/${id}`);
  }

  create(payload: UserPayload): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(this.base, payload);
  }

  update(id: number, payload: Partial<UserPayload>): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.base}/${id}`, payload);
  }

  deactivate(id: number): Observable<ApiResponse<User>> {
    return this.http.delete<ApiResponse<User>>(`${this.base}/${id}`);
  }
}
