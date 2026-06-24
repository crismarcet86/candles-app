import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CalcPresetItem {
  id?: number;
  ingredient_id: number | null;
  ingredient_name: string;
  grams: number;
  is_unit: boolean;
  unit_abbr: string;
  unit_cost: number;
  subtotal: number;
  fragrance_pct?: number | null;
}

export interface CalcPreset {
  id: number;
  name: string;
  mold_name: string | null;
  wax_grams: number | null;
  quantity: number;
  sell_price: number;
  cost_per_unit: number;
  includes_color: number;
  labor_cost: number;
  labor_hours: number;
  is_active: number;
  item_count?: number;
  items?: CalcPresetItem[];
  created_at: string;
}

interface ApiResponse<T> { ok: boolean; message: string; data: T; }

@Injectable({ providedIn: 'root' })
export class CalculationPresetsService {
  private base = `${environment.apiUrl}/presets`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<CalcPreset[]>> {
    return this.http.get<ApiResponse<CalcPreset[]>>(this.base);
  }

  getAllIncludingInactive(): Observable<ApiResponse<CalcPreset[]>> {
    return this.http.get<ApiResponse<CalcPreset[]>>(`${this.base}?all=1`);
  }

  getById(id: number): Observable<ApiResponse<CalcPreset>> {
    return this.http.get<ApiResponse<CalcPreset>>(`${this.base}/${id}`);
  }

  create(payload: any): Observable<ApiResponse<CalcPreset>> {
    return this.http.post<ApiResponse<CalcPreset>>(this.base, payload);
  }

  update(id: number, payload: any): Observable<ApiResponse<CalcPreset>> {
    return this.http.put<ApiResponse<CalcPreset>>(`${this.base}/${id}`, payload);
  }

  delete(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.base}/${id}`);
  }
}
