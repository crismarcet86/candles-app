import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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

  getAll(f: { name?: string; category_id?: number | null; unit_id?: number | null } = {}): Observable<ApiResponse<Product[]>> {
    let params = new HttpParams();
    if (f.name) params = params.set('name', f.name);
    if (f.category_id) params = params.set('category_id', String(f.category_id));
    if (f.unit_id) params = params.set('unit_id', String(f.unit_id));
    return this.http.get<ApiResponse<Product[]>>(this.base, { params });
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

  uploadImage(id: number, file: File): Observable<ApiResponse<Product>> {
    const fd = new FormData();
    fd.append('image', file);
    return this.http.post<ApiResponse<Product>>(`${this.base}/${id}/image`, fd);
  }
}
