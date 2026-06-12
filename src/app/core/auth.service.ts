import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, finalize } from 'rxjs';
import { environment } from '../../environments/environment';

interface LoginResponse {
  status: string;
  data: {
    token: string;
    user: { id: number; full_name: string; email: string; role: 'admin' | 'agent' | 'user' };
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'helpdesk_token';
  private readonly userKey = 'helpdesk_user';
  
  private readStoredUser() {
    const raw = localStorage.getItem(this.userKey);
    return raw ? JSON.parse(raw) : null;
  }

  currentUser = signal<LoginResponse['data']['user'] | null>(this.readStoredUser());

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiBaseUrl}/login`, { email, password })
      .pipe(
        tap((res) => {
          localStorage.setItem(this.tokenKey, res.data.token);
          localStorage.setItem(this.userKey, JSON.stringify(res.data.user));
          this.currentUser.set(res.data.user);
        }),
      );
  }

  clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUser.set(null);
  }

  logout(): Observable<unknown> {
  return this.http.post(`${environment.apiBaseUrl}/logout`, {}).pipe(
    finalize(() => this.clearSession()),
  );
}

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}