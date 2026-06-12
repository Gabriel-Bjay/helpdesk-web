import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Category { id: number; name: string; description?: string; is_active: boolean; }

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/categories`;

  list(): Observable<{ status: string; data: Category[] }> {
    return this.http.get<{ status: string; data: Category[] }>(this.base);
  }
  create(payload: Partial<Category>): Observable<unknown> {
    return this.http.post(this.base, payload);
  }
  update(id: number, payload: Partial<Category>): Observable<unknown> {
    return this.http.patch(`${this.base}/${id}`, payload);
  }
  remove(id: number): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}`);
  }
}