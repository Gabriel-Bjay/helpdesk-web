import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import {
  DxDataGridModule, DxSelectBoxModule, DxButtonModule,
  DxPopupModule, DxFormModule,
} from 'devextreme-angular';
import DataSource from 'devextreme/data/data_source';
import CustomStore from 'devextreme/data/custom_store';
import notify from 'devextreme/ui/notify';
import { firstValueFrom, finalize } from 'rxjs';
import { AuthService } from '../core/auth.service';
import { TicketService } from './ticket.service';
import { CategoryService, Category } from '../categories/category.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [
    DxDataGridModule, DxSelectBoxModule, DxButtonModule,
    DxPopupModule, DxFormModule,
    CommonModule,
  ],
  template: `
    <div class="page-container">
      <h2 class="page-title">Tickets</h2>

      <div class="card">
        <div class="filters">
          <dx-button text="New ticket" icon="add" type="default" (onClick)="openCreate()"></dx-button>
          <dx-select-box
            [dataSource]="statusOptions" [(value)]="statusFilter"
            placeholder="All statuses" [showClearButton]="true"
            (onValueChanged)="reload()" width="180"></dx-select-box>
          <dx-select-box
            [dataSource]="priorityOptions" [(value)]="priorityFilter"
            placeholder="All priorities" [showClearButton]="true"
            (onValueChanged)="reload()" width="180"></dx-select-box>
        </div>

        <dx-data-grid
          [dataSource]="dataSource"
          [remoteOperations]="{ paging: true }"
          [showBorders]="false" [columnAutoWidth]="true"
          [hoverStateEnabled]="true"
          (onRowClick)="openTicket($event)">
          <dxo-paging [pageSize]="15"></dxo-paging>
          <dxo-pager [showPageSizeSelector]="true" [allowedPageSizes]="[15, 25, 50]" [showInfo]="true"></dxo-pager>

          <dxi-column dataField="id" caption="Ticket #" [width]="90"></dxi-column>
          <dxi-column dataField="title"></dxi-column>
          <dxi-column dataField="status" cellTemplate="statusCell"></dxi-column>
          <dxi-column dataField="priority" cellTemplate="priorityCell"></dxi-column>
          <dxi-column dataField="created_at" dataType="datetime" caption="Created"></dxi-column>

          <div *dxTemplate="let cell of 'statusCell'">
            <span class="badge" [ngClass]="statusClass(cell.value)">{{ cell.value }}</span>
          </div>
          <div *dxTemplate="let cell of 'priorityCell'">
            <span class="badge" [ngClass]="priorityClass(cell.value)">{{ cell.value }}</span>
          </div>
        </dx-data-grid>
      </div>

      <dx-popup
        [(visible)]="popupVisible" title="New ticket"
        [width]="480" height="auto" [showCloseButton]="true">
        <div *dxTemplate="let d of 'content'">
          <dx-form [(formData)]="newTicket" [colCount]="1" (onInitialized)="onFormInit($event)">
            <dxi-item dataField="title" editorType="dxTextBox"
              [validationRules]="[{ type:'required', message:'Title is required' }]"></dxi-item>
            <dxi-item dataField="description" editorType="dxTextArea"
              [editorOptions]="{ height: 100 }"
              [validationRules]="[{ type:'required', message:'Description is required' }]"></dxi-item>
            <dxi-item dataField="category_id" editorType="dxSelectBox"
              [editorOptions]="{ dataSource: categories, valueExpr:'id', displayExpr:'name', placeholder:'Select a category' }"
              [validationRules]="[{ type:'required', message:'Category is required' }]">
              <dxo-label text="Category"></dxo-label>
            </dxi-item>
            <dxi-item dataField="priority" editorType="dxSelectBox"
              [editorOptions]="{ dataSource: priorityOptions, placeholder:'Select priority' }"
              [validationRules]="[{ type:'required', message:'Priority is required' }]"></dxi-item>
          </dx-form>
          <div style="margin-top:16px; text-align:right;">
            <dx-button text="Cancel" (onClick)="popupVisible=false" style="margin-right:8px;"></dx-button>
            <dx-button text="Create" type="default" [disabled]="saving" (onClick)="saveTicket()"></dx-button>
          </div>
        </div>
      </dx-popup>
    </div>
  `,
  styles: [`
    .filters { display:flex; gap:12px; margin-bottom:16px; align-items:center; }
  `],
})
export class TicketsComponent implements OnInit {
  auth = inject(AuthService);
  private router = inject(Router);
  private ticketService = inject(TicketService);
  private categoryService = inject(CategoryService);
  private cdr = inject(ChangeDetectorRef);

  statusFilter: string | null = null;
  priorityFilter: string | null = null;
  statusOptions = ['Open', 'In Progress', 'Resolved', 'Closed'];
  priorityOptions = ['Low', 'Medium', 'High', 'Urgent'];
  categories: Category[] = [];
  popupVisible = false;
  saving = false;
  newTicket: { title: string; description: string; category_id: number | null; priority: string | null } =
    { title: '', description: '', category_id: null, priority: null };
  private form?: any;

  dataSource = new DataSource({
    store: new CustomStore({
      key: 'id',
      load: (loadOptions) => {
        const take = loadOptions.take ?? 15;
        const skip = loadOptions.skip ?? 0;
        const page = Math.floor(skip / take) + 1;
        return firstValueFrom(
          this.ticketService.list({
            page, perPage: take,
            status: this.statusFilter ?? undefined,
            priority: this.priorityFilter ?? undefined,
          }),
        ).then((res) => ({ data: res.data.items, totalCount: res.data.pagination.total }));
      },
    }),
  });

  ngOnInit(): void {
    this.categoryService.list().subscribe({ next: (res) => (this.categories = res.data) });
  }

  onFormInit(e: any): void { this.form = e.component; }
  isAdmin(): boolean { return this.auth.currentUser()?.role === 'admin'; }

  openCreate(): void {
    this.newTicket = { title: '', description: '', category_id: null, priority: null };
    this.popupVisible = true;
  }

  saveTicket(): void {
    const result = this.form?.validate();
    if (result && !result.isValid) return; 
    this.saving = true;
    this.ticketService.create(this.newTicket as any)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          notify('Ticket created.', 'success', 2000);
          this.popupVisible = false;
          this.dataSource.reload();
          this.cdr.detectChanges();
        },
        error: (err) => notify(err.error?.message ?? 'Could not create ticket.', 'error', 3000),
      });
  }

  openTicket(e: any): void {
    if (e.rowType !== 'data') return;
    this.router.navigate(['/tickets', e.data.id]);
  }

  reload(): void { this.dataSource.reload(); }

  statusClass(v: string): string {
    const map: Record<string, string> = {
      'Open': 'open', 'In Progress': 'progress', 'Resolved': 'resolved', 'Closed': 'closed',
    };
    return 'badge--' + (map[v] ?? 'closed');
  }

  priorityClass(v: string): string {
    const map: Record<string, string> = {
      'Low': 'low', 'Medium': 'medium', 'High': 'high', 'Urgent': 'urgent',
    };
    return 'badge--' + (map[v] ?? 'low');
  }
}