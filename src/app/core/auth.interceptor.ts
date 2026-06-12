import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import notify from 'devextreme/ui/notify';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.getToken();

  const request = req.clone({
    setHeaders: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return next(request).pipe(
    catchError((err: HttpErrorResponse) => {
        const isLoginRequest = request.url.includes('/login');

        if (!isLoginRequest) {
        if (err.status === 401) {
            auth.clearSession();
            router.navigate(['/login']);
            notify('Your session has expired. Please log in again.', 'error', 3000);
        } else if (err.status === 403) {
            notify('You do not have permission to do that.', 'error', 3000);
        } else {
            const message = err.error?.message ?? 'Something went wrong. Please try again.';
            notify(message, 'error', 3000);
        }
        }

        return throwError(() => err);
    }),
    );
};