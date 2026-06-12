import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  DxButtonModule, DxTextAreaModule,
  DxFileUploaderModule, DxLoadIndicatorModule, DxSelectBoxModule,
} from 'devextreme-angular';
import notify from 'devextreme/ui/notify';
import { finalize } from 'rxjs';
import { TicketService, TicketDetail } from './ticket.service';
import { AuthService } from '../core/auth.service';
import { UserService, AppUser } from '../users/user.service';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [
    CommonModule,                      
    DxButtonModule, DxTextAreaModule,
    DxFileUploaderModule, DxLoadIndicatorModule, DxSelectBoxModule,
  ],
  template: `
    <div class="page">
      <div class="page-bar">
        <dx-button text="← Back to tickets" (onClick)="goBack()"></dx-button>
        @if (ticket) {
          <h2>Ticket No.{{ ticket.id }}</h2>
        }
      </div>

      @if (loading) {
        <dx-load-indicator height="60" width="60"></dx-load-indicator>
      }

      @if (ticket) {
        <div class="card">
          <div class="card-title-row">
            <h3>{{ ticket.title }}</h3>
            <div class="badges">
              <span class="badge" [style.background]="statusColor(ticket.status)">
                {{ ticket.status }}
              </span>
              <span class="badge" [style.background]="priorityColor(ticket.priority)">
                {{ ticket.priority }}
              </span>
            </div>
          </div>

          <div class="meta-grid">
            <div class="meta-item">
              <div class="meta-label">Category</div>
              <div>{{ ticket.category?.name ?? '—' }}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Raised by</div>
              <div>{{ ticket.creator?.full_name ?? '—' }}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Assigned to</div>
              <div>{{ ticket.assignee?.full_name ?? 'Unassigned' }}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Created</div>
              <div>{{ ticket.created_at | date:'mediumDate' }}</div>
            </div>
          </div>

          <div class="description-block">
            <div class="meta-label">Description</div>
            <p style="white-space:pre-wrap; margin-top:6px;">{{ ticket.description }}</p>
          </div>

          @if (canChangeStatus() || isAdmin()) {
            <div class="actions">
              @if (canChangeStatus()) {
                <div class="action-row">
                  <span class="action-label">Change status</span>
                  <dx-select-box [dataSource]="statusOptions" [(value)]="statusValue"
                    (onValueChanged)="onStatusChange($event)" width="220">
                  </dx-select-box>
                </div>
              }
              @if (isAdmin()) {
                <div class="action-row">
                  <span class="action-label">Assign to</span>
                  <dx-select-box [dataSource]="agents" displayExpr="full_name" valueExpr="id"
                    [(value)]="assignValue" placeholder="Unassigned" [showClearButton]="true"
                    (onValueChanged)="onAssignChange($event)" width="260">
                  </dx-select-box>
                </div>
              }
            </div>
          }
        </div>

        <div class="card">
          <h3>Comments ( {{ ticket.comments?.length ?? 0 }} )</h3>
          @for (c of (ticket.comments ?? []); track c.id) {
            <div class="comment">
              <div class="comment-meta">
                <span class="comment-author">{{ c.author?.full_name || 'User #' + c.author_id }}</span>
                <span class="comment-date">{{ c.created_at | date:'medium' }}</span>
              </div>
              <div class="comment-body">{{ c.body }}</div>
            </div>
          } @empty {
            <div class="empty-state">No comments yet — be the first!</div>
          }

          <dx-text-area [(value)]="newComment" [height]="80"
            placeholder="Write a comment..." style="margin-top:16px;">
          </dx-text-area>
          <dx-button text="Post comment" type="default" [disabled]="posting"
            (onClick)="addComment()" style="margin-top:8px;">
          </dx-button>
        </div>

        <div class="card">
          <h3>Attachments ( {{ ticket.attachments?.length ?? 0 }} )</h3>
          @for (a of (ticket.attachments ?? []); track a.id) {
            <div class="attachment-row">
              <span class="att-icon">📎</span>
              <span class="att-name">{{ a.file_name }}</span>
              <span class="att-size">{{ formatSize(a.file_size) }}</span>
              <dx-button text="Download" icon="download"
                (onClick)="download(a)" [width]="130">
              </dx-button>
            </div>
          } @empty {
            <div class="empty-state">No files attached yet.</div>
          }

          <div class="upload-section">
            <dx-file-uploader [multiple]="false" uploadMode="useForm"
              selectButtonText="Choose file (image or PDF)" labelText=""
              accept="image/*,application/pdf"
              (onValueChanged)="onFileSelected($event)">
            </dx-file-uploader>
            <dx-button text="Upload" type="success"
              [disabled]="!selectedFile || uploading" (onClick)="upload()">
            </dx-button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { padding:24px; max-width:820px; margin:0 auto; }
    .page-bar { display:flex; align-items:center; gap:16px; margin-bottom:20px; }
    .page-bar h2 { margin:0; font-size:18px; }
    .card {
      background:#fff; border:1px solid #e8e8e8; border-radius:8px;
      padding:20px 24px; margin-bottom:20px;
      box-shadow:0 1px 4px rgba(0,0,0,.06);
    }
    .card h3 { margin:0 0 16px 0; font-size:16px; }
    .card-title-row {
      display:flex; justify-content:space-between; align-items:flex-start;
      margin-bottom:16px;
    }
    .card-title-row h3 { margin:0; font-size:18px; }
    .badges { display:flex; gap:8px; flex-shrink:0; }
    .badge {
      padding:3px 12px; border-radius:12px;
      font-size:12px; font-weight:600; color:#fff;
    }
    .meta-grid {
      display:grid;
      grid-template-columns:repeat(auto-fill, minmax(160px,1fr));
      gap:16px; margin-bottom:16px;
    }
    .meta-label {
      font-size:11px; color:#999;
      text-transform:uppercase; letter-spacing:.5px; margin-bottom:3px;
    }
    .description-block { border-top:1px solid #f0f0f0; padding-top:16px; }
    .actions { border-top:1px solid #f0f0f0; padding-top:16px; margin-top:16px; }
    .action-row { display:flex; align-items:center; gap:12px; margin-bottom:12px; }
    .action-label { width:120px; font-weight:600; font-size:13px; }
    .empty-state { color:#bbb; font-style:italic; margin-bottom:12px; }
    .comment {
      border-left:3px solid #d9d9d9; padding:8px 14px;
      margin-bottom:12px; border-radius:0 4px 4px 0;
    }
    .comment-meta { display:flex; gap:12px; align-items:center; margin-bottom:4px; }
    .comment-author { font-weight:600; font-size:13px; }
    .comment-date { font-size:12px; color:#999; }
    .comment-body { font-size:14px; white-space:pre-wrap; }
    .attachment-row {
      display:flex; align-items:center; gap:12px;
      padding:10px 0; border-bottom:1px solid #f5f5f5;
    }
    .att-icon { font-size:18px; }
    .att-name { flex:1; font-size:14px; }
    .att-size { font-size:12px; color:#999; min-width:60px; text-align:right; }
    .upload-section {
      margin-top:16px; display:flex;
      align-items:center; gap:12px; flex-wrap:wrap;
    }
  `],
})
export class TicketDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ticketService = inject(TicketService);
  private auth = inject(AuthService);
  private userService = inject(UserService);
  private cdr = inject(ChangeDetectorRef);

  ticketId!: number;
  ticket?: TicketDetail;
  loading = false;
  newComment = '';
  posting = false;
  selectedFile: File | null = null;
  uploading = false;
  statusOptions = ['Open', 'In Progress', 'Resolved', 'Closed'];
  statusValue: string | null = null;
  assignValue: number | null = null;
  agents: AppUser[] = [];

  ngOnInit(): void {
    this.ticketId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
    if (this.isAdmin()) {
      this.userService.agents().subscribe({
        next: (res) => { this.agents = res.data; this.cdr.detectChanges(); },
      });
    }
  }

  load(): void {
    this.loading = true;
    this.ticketService.get(this.ticketId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.ticket = res.data;
          this.statusValue = res.data.status;
          this.assignValue = res.data.assigned_to;
          this.cdr.detectChanges();
        },
      });
  }

  isAdmin(): boolean { return this.auth.currentUser()?.role === 'admin'; }
  canChangeStatus(): boolean {
    const r = this.auth.currentUser()?.role;
    return r === 'admin' || r === 'agent';
  }

  statusColor(status: string): string {
    return ({ 'Open':'#1890ff','In Progress':'#fa8c16',
              'Resolved':'#52c41a','Closed':'#8c8c8c' } as Record<string,string>)[status] ?? '#666';
  }
  priorityColor(priority: string): string {
    return ({ 'Low':'#52c41a','Medium':'#1890ff',
              'High':'#fa8c16','Urgent':'#ff4d4f' } as Record<string,string>)[priority] ?? '#666';
  }

  onStatusChange(e: any): void {
    if (!e.event) return;
    this.ticketService.updateStatus(this.ticketId, e.value).subscribe({
      next: () => { notify('Status updated.', 'success', 1500); this.load(); },
    });
  }

  onAssignChange(e: any): void {
    if (!e.event) return;
    this.ticketService.assign(this.ticketId, e.value ?? null).subscribe({
      next: () => { notify('Assignment updated.', 'success', 1500); this.load(); },
    });
  }

  addComment(): void {
    const body = this.newComment.trim();
    if (!body) { notify('Comment cannot be empty.', 'warning', 2000); return; }
    this.posting = true;
    this.ticketService.addComment(this.ticketId, body)
      .pipe(finalize(() => (this.posting = false)))
      .subscribe({
        next: () => { notify('Comment added.', 'success', 1500); this.newComment = ''; this.load(); },
      });
  }

  onFileSelected(e: any): void { this.selectedFile = e.value?.[0] ?? null; }
  upload(): void {
    if (!this.selectedFile) return;
    this.uploading = true;
    this.ticketService.uploadAttachment(this.ticketId, this.selectedFile)
      .pipe(finalize(() => (this.uploading = false)))
      .subscribe({
        next: () => { notify('File uploaded.', 'success', 1500); this.selectedFile = null; this.load(); },
      });
  }

  download(a: { id: number; file_name: string }): void {
    this.ticketService.downloadAttachment(a.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = a.file_name;
        link.click();
        URL.revokeObjectURL(url);
      },
    });
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  goBack(): void { this.router.navigate(['/tickets']); }
}