import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order } from '../../shared/models/order.model';
import { environment } from '../../../environments/environment';

export interface ApiResponse<T> { ok: boolean; message: string; data: T; }

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private base = `${environment.apiUrl}/orders`;
  constructor(private http: HttpClient) {}
  getAll(): Observable<ApiResponse<Order[]>> { return this.http.get<ApiResponse<Order[]>>(this.base); }
  getById(id: number): Observable<ApiResponse<Order>> { return this.http.get<ApiResponse<Order>>(`${this.base}/${id}`); }
  updateDeliveryStatus(id: number, delivery_status: 'pendiente' | 'entregado'): Observable<ApiResponse<Order>> {
    return this.http.patch<ApiResponse<Order>>(`${this.base}/${id}/delivery-status`, { delivery_status });
  }
  getReturns(id: number): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.base}/${id}/returns`);
  }
  createReturn(id: number, payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.base}/${id}/returns`, payload);
  }
}
