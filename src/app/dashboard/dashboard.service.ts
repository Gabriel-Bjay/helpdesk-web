import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DashboardData {
  total: number;
  by_status: Record<string, number>;    
  by_priority: Record<string, number>;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  get(): Observable<{ status: string; data: DashboardData }> {
    return this.http.get<{ status: string; data: DashboardData }>(`${environment.apiBaseUrl}/dashboard`);
  }
}