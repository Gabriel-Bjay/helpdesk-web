import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DxFormModule, DxButtonModule } from 'devextreme-angular';
import notify from 'devextreme/ui/notify';
import { finalize } from 'rxjs';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [DxFormModule, DxButtonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  formData: { email: string; password: string } = { email: '', password: '' };
  loading = false;

  onLogin(): void {
    if (!this.formData.email || !this.formData.password) {
      notify('Please enter your email and password.', 'warning', 2500);
      return;
    }

    this.loading = true;
    this.auth.login(this.formData.email, this.formData.password)
      .pipe(finalize(() => (this.loading = false)))   
      .subscribe({
        next: () => {
          notify('Welcome back!', 'success', 2000);
          this.router.navigate(['/tickets']);
        },
        error: (err) => {
          const message =
            err?.status === 401
              ? 'Invalid email or password.'
              : err?.error?.message ?? 'Login failed. Please try again.';
          notify(message, 'error', 3000);
        },
      });
  }
}