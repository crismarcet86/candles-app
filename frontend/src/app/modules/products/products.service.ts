import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../../shared/models/product.model';
import { environment } from '../../../environments/environment';

export interface ApiResponse<T> {
  ok: boolean;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private base = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<Product[]>> {
    return this.http.get<ApiResponse<Product[]>>(this.base);
  }

  getById(id: number): Observable<ApiResponse<Product>> {
    return this.http.get<ApiResponse<Product>>(`${this.base}/${id}`);
  }

  create(payload: any): Observable<ApiResponse<Product>> {
    return this.http.post<ApiResponse<Product>>(this.base, payload);
  }

  update(id: number, payload: any): Observable<ApiResponse<Product>> {
    return this.http.put<ApiResponse<Product>>(`${this.base}/${id}`, payload);
  }

  delete(id: number): Observable<ApiResponse<Product>> {
    return this.http.delete<ApiResponse<Product>>(`${this.base}/${id}`);
  }

  addStock(id: number, quantity: number): Observable<ApiResponse<Product>> {
    return this.http.patch<ApiResponse<Product>>(`${this.base}/${id}/stock`, { quantity });
  }

  writeOffStock(id: number, quantity: number): Observable<ApiResponse<Product>> {
    return this.http.patch<ApiResponse<Product>>(`${this.base}/${id}/writeoff`, { quantity });
  }

  inventoryCount(items: { product_id: number; real_stock: number }[]): Observable<ApiResponse<Product[]>> {
    return this.http.post<ApiResponse<Product[]>>(`${this.base}/inventory-count`, { items });
  }
}
