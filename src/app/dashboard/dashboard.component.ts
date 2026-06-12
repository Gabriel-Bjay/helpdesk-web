import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxPieChartModule, DxChartModule } from 'devextreme-angular';
import { DashboardService } from './dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DxPieChartModule, DxChartModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private cdr = inject(ChangeDetectorRef);

  total = 0;
  statusData: { name: string; count: number }[] = [];
  priorityData: { name: string; count: number }[] = [];

  private statusOrder = ['Open', 'In Progress', 'Resolved', 'Closed'];
  private priorityOrder = ['Low', 'Medium', 'High', 'Urgent'];

  statusColors: Record<string, string> = {
    'Open': '#2563eb', 'In Progress': '#d97706', 'Resolved': '#16a34a', 'Closed': '#6b7280',
  };
  priorityColors: Record<string, string> = {
    'Low': '#16a34a', 'Medium': '#2563eb', 'High': '#d97706', 'Urgent': '#dc2626',
  };

  customizeStatusPoint = (info: any) => ({ color: this.statusColors[info.argument] ?? '#9ca3af' });
  customizePriorityPoint = (info: any) => ({ color: this.priorityColors[info.argument] ?? '#9ca3af' });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.dashboardService.get().subscribe({
      next: (res) => {
        const d = res.data;
        this.total = d.total;
        this.statusData = this.statusOrder.map(name => ({ name, count: d.by_status[name] ?? 0 }));
        this.priorityData = this.priorityOrder.map(name => ({ name, count: d.by_priority[name] ?? 0 }));
        this.cdr.detectChanges();
      },
    });
  }
}