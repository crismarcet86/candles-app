import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order } from '../../shared/models/order.model';
import { environment } from '../../../environments/environment';

export interface ApiResponse<T> { ok: boolean; message: string; data: T; }

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private base = `${environment.apiUrl}/orders`;
  constructor(private http: HttpClient) {}
  getAll(f: { client?: string; status?: string; delivery_status?: string; from?: string; to?: string } = {}): Observable<any> {
    let params = new HttpParams();
    if (f.client)          params = params.set('client', f.client);
    if (f.status)          params = params.set('status', f.status);
    if (f.delivery_status) params = params.set('delivery_status', f.delivery_status);
    if (f.from)            params = params.set('from', f.from);
    if (f.to)              params = params.set('to', f.to);
    return this.http.get<any>(this.base, { params });
  }
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
