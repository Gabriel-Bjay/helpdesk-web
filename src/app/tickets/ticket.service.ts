import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Ticket {
  id: number;
  title: string;
  description: string;
  category_id: number;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  created_by: number;
  assigned_to: number | null;
  created_at: string;
}

export interface Comment {
  id: number; body: string; author_id: number; created_at: string;
  author?: { full_name: string };
}
export interface Attachment {
  id: number; file_name: string; mime_type: string; file_size: number; created_at: string;
}
export interface TicketDetail extends Ticket {
  category?: { id: number; name: string };
  creator?: { full_name: string };
  assignee?: { full_name: string } | null;
  comments?: Comment[];
  attachments?: Attachment[];
}

export interface Paginated<T> {
  status: string;
  data: {
    items: T[];
    pagination: { total: number; per_page: number; current_page: number; last_page: number };
  };
}

@Injectable({ providedIn: 'root' })
export class TicketService {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/tickets`;

  list(opts: {
    page: number;
    perPage: number;
    status?: string;
    priority?: string;
  }): Observable<Paginated<Ticket>> {
    let params = new HttpParams()
      .set('page', opts.page)
      .set('per_page', opts.perPage);

    if (opts.status) params = params.set('status', opts.status);
    if (opts.priority) params = params.set('priority', opts.priority);

    return this.http.get<Paginated<Ticket>>(this.base, { params });
  }

  create(payload: {
    title: string;
    description: string;
    category_id: number;
    priority: string;
  }): Observable<{ status: string; data: Ticket }> {
    return this.http.post<{ status: string; data: Ticket }>(this.base, payload);
  }

  get(id: number): Observable<{ status: string; data: TicketDetail }> {
    return this.http.get<{ status: string; data: TicketDetail }>(`${this.base}/${id}`);
  }

  addComment(ticketId: number, body: string): Observable<unknown> {
    return this.http.post(`${this.base}/${ticketId}/comments`, { body });
  }

  uploadAttachment(ticketId: number, file: File): Observable<unknown> {
    const form = new FormData();
    form.append('file', file);                       // field name MUST be "file" (matches your validator)
    return this.http.post(`${this.base}/${ticketId}/attachments`, form);
  }

  downloadAttachment(attachmentId: number): Observable<Blob> {
    return this.http.get(`${environment.apiBaseUrl}/attachments/${attachmentId}/download`,
      { responseType: 'blob' });                     // we get raw bytes back, not JSON
  }

  updateStatus(id: number, status: string): Observable<unknown> {
    return this.http.patch(`${this.base}/${id}/status`, { status });
  }

  assign(id: number, assignedTo: number | null): Observable<unknown> {
    return this.http.patch(`${this.base}/${id}/assign`, { assigned_to: assignedTo });
  }

}