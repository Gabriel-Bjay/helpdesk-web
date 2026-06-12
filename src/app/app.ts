import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    @if (auth.currentUser()) {
      <div class="app-shell" [class.sidebar-collapsed]="sidebarCollapsed()">

        <!-- ===== Top navbar ===== -->
        <header class="navbar">
          <div class="navbar__left">
            <button class="icon-btn" (click)="toggleSidebar()" aria-label="Toggle menu">☰</button>
            <span class="brand">🎫 HelpDesk</span>
          </div>
          <div class="navbar__right">
            <div class="user-chip">
              <span class="avatar">{{ initials() }}</span>
              <span class="user-meta">
                <span class="user-name">{{ auth.currentUser()?.full_name }}</span>
                <span class="role-badge">{{ auth.currentUser()?.role }}</span>
              </span>
            </div>
            <button class="logout-btn" (click)="logout()">Log out</button>
          </div>
        </header>

        <!-- ===== Body: sidebar + content side by side ===== -->
        <div class="shell-body">
          <aside class="sidebar">
            <nav>
              <a routerLink="/tickets" routerLinkActive="active" class="nav-link">
                <span class="nav-icon">🎟️</span><span class="nav-text">Tickets</span>
              </a>
              <a routerLink="/dashboard" routerLinkActive="active" class="nav-link">
                <span class="nav-icon">📊</span><span class="nav-text">Dashboard</span>
              </a>
              @if (isAdmin()) {
                <a routerLink="/admin" routerLinkActive="active" class="nav-link">
                  <span class="nav-icon">⚙️</span><span class="nav-text">Admin</span>
                </a>
              }
            </nav>
          </aside>

          <main class="content">
            <router-outlet></router-outlet>
          </main>
        </div>

      </div>
    } @else {
      <router-outlet></router-outlet>
    }
  `,
  styles: [`
    /* Whole shell is a vertical stack: navbar on top, body below */
    .app-shell { min-height: 100dvh; display: flex; flex-direction: column; }

    /* Navbar */
    .navbar {
      position: sticky; top: 0; z-index: 100; flex-shrink: 0;
      height: 60px; display: flex; align-items: center; justify-content: space-between;
      padding: 0 20px; background: var(--surface);
      border-bottom: 1px solid var(--border); box-shadow: var(--shadow-sm);
    }
    .navbar__left, .navbar__right { display: flex; align-items: center; gap: 14px; }
    .brand { font-weight: 700; font-size: 1.15rem; color: var(--brand); }

    .icon-btn {
      border: 0; background: transparent; font-size: 1.3rem; cursor: pointer;
      color: var(--text); padding: 4px 10px; border-radius: var(--radius-sm); line-height: 1;
    }
    .icon-btn:hover { background: var(--brand-soft); }

    .user-chip { display: flex; align-items: center; gap: 10px; }
    .avatar {
      width: 36px; height: 36px; border-radius: 50%; background: var(--brand);
      color: #fff; font-weight: 600; font-size: 0.8rem;
      display: flex; align-items: center; justify-content: center;
    }
    .user-meta { display: flex; flex-direction: column; line-height: 1.15; }
    .user-name { font-weight: 600; font-size: 0.9rem; }
    .role-badge {
      align-self: flex-start; font-size: 0.68rem; font-weight: 600;
      text-transform: capitalize; color: var(--brand);
      background: var(--brand-soft); padding: 0 7px; border-radius: 999px;
    }

    .logout-btn {
      border: 1px solid var(--border); background: var(--surface);
      padding: 7px 14px; border-radius: var(--radius-sm); cursor: pointer;
      font-weight: 600; color: var(--text); transition: all .15s ease;
    }
    .logout-btn:hover { background: #fee2e2; border-color: #fca5a5; color: #b91c1c; }

    /* ⭐ The body row — sidebar and content are siblings here, so they can't overlap */
    .shell-body { display: flex; align-items: flex-start; flex: 1; }

    /* Sidebar — sticks below the navbar, fixed width, doesn't shrink */
    .sidebar {
      position: sticky; top: 60px; height: calc(100dvh - 60px);
      width: 240px; flex-shrink: 0;
      background: var(--surface); border-right: 1px solid var(--border);
      padding: 16px 12px; overflow-y: auto; transition: width .2s ease;
    }
    .sidebar nav { display: flex; flex-direction: column; gap: 6px; }
    .nav-link {
      display: flex; align-items: center; gap: 12px; padding: 10px 12px;
      border-radius: var(--radius-sm); color: var(--text);
      text-decoration: none; font-weight: 500; white-space: nowrap;
      transition: background .15s ease;
    }
    .nav-link:hover { background: var(--bg); }
    .nav-link.active { background: var(--brand-soft); color: var(--brand); }
    .nav-icon { font-size: 1.1rem; width: 22px; text-align: center; }

    /* ⭐ Content takes ALL remaining width — never under the sidebar */
    .content { flex: 1; min-width: 0; min-height: calc(100dvh - 60px); }

    /* Collapsed state */
    .sidebar-collapsed .sidebar { width: 64px; }
    .sidebar-collapsed .nav-text { display: none; }
  `],
})
export class AppComponent {
  auth = inject(AuthService);
  private router = inject(Router);

  sidebarCollapsed = signal(false);

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  isAdmin(): boolean {
    return this.auth.currentUser()?.role === 'admin';
  }

  initials(): string {
    const name = this.auth.currentUser()?.full_name ?? '';
    return name.split(' ').map(p => p[0] ?? '').slice(0, 2).join('').toUpperCase();
  }

  logout(): void {
    this.auth.logout().subscribe({
      complete: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }
}