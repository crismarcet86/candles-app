import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User, AuthResponse } from '../../shared/models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY   = 'candles_token';
  private readonly USER_KEY    = 'candles_user';
  private readonly BNAME_KEY   = 'candles_business_name';

  private userSubject = new BehaviorSubject<User | null>(this.loadUser());
  user$: Observable<User | null> = this.userSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  // ── Getters ────────────────────────────────────────────────
  get currentUser(): User | null { return this.userSubject.value; }
  get token(): string | null     { return localStorage.getItem(this.TOKEN_KEY); }
  get isLoggedIn(): boolean      { return !!this.token; }

  get businessName(): string {
    return localStorage.getItem(this.BNAME_KEY) || 'Mi Negocio';
  }
  setBusinessName(name: string): void {
    localStorage.setItem(this.BNAME_KEY, name);
  }

  // ── Auth ───────────────────────────────────────────────────
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(tap(res => this.saveSession(res)));
  }

  register(data: { name: string; email: string; password: string; role?: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, data)
      .pipe(tap(res => this.saveSession(res)));
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.userSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  // ── Helpers ────────────────────────────────────────────────
  private saveSession(res: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, res.data.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(res.data.user));
    this.userSubject.next(res.data.user);
  }

  private loadUser(): User | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
}
