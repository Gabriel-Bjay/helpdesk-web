import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AppUser {
  id: number; full_name: string; email: string; role: string; is_active: boolean; password?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  agents(): Observable<{ status: string; data: AppUser[] }> {
    return this.http.get<{ status: string; data: AppUser[] }>(`${this.base}/agents`);
  }
  list(): Observable<{ status: string; data: { items: AppUser[]; pagination: any } }> {
    const params = new HttpParams().set('per_page', 100);
    return this.http.get<{ status: string; data: { items: AppUser[]; pagination: any } }>(`${this.base}/users`, { params });
  }
  create(payload: Partial<AppUser>): Observable<unknown> {
    return this.http.post(`${this.base}/users`, payload);
  }
  update(id: number, payload: Partial<AppUser>): Observable<unknown> {
    return this.http.patch(`${this.base}/users/${id}`, payload);
  }
}