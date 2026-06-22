import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private _settings = new BehaviorSubject<any>(null);
  settings$ = this._settings.asObservable();

  constructor(private http: HttpClient) {}

  load(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/settings`).pipe(
      tap(res => { if (res.ok) this._settings.next(res.data); })
    );
  }

  get current() { return this._settings.value; }
  get businessName(): string { return this.current?.name || 'Mi Negocio'; }
  get logoUrl(): string | null { return this.current?.logo_url || null; }

  update(data: { name: string; ruc?: string; phone?: string; observations?: string }): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/settings`, data).pipe(
      tap(res => { if (res.ok) this._settings.next(res.data); })
    );
  }

  uploadLogo(file: File): Observable<any> {
    const fd = new FormData();
    fd.append('logo', file);
    return this.http.post<any>(`${environment.apiUrl}/settings/logo`, fd).pipe(
      tap(res => { if (res.ok) this._settings.next(res.data); })
    );
  }
}
