import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DxDataGridModule, DxButtonModule } from 'devextreme-angular';
import CustomStore from 'devextreme/data/custom_store';
import { firstValueFrom } from 'rxjs';
import { CategoryService } from '../categories/category.service';
import { UserService } from '../users/user.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [DxDataGridModule, DxButtonModule],
  templateUrl: './admin.component.html',
})
export class AdminComponent {
  private router = inject(Router);
  private categoryService = inject(CategoryService);
  private userService = inject(UserService);

  roles = ['admin', 'agent', 'user'];

    categoriesStore = new CustomStore({
        key: 'id',
        load: () =>
            firstValueFrom(this.categoryService.list()).then((r) => r.data),
        insert: (values) =>
            firstValueFrom(this.categoryService.create(values)) as Promise<any>,
        update: (key, values) =>
            firstValueFrom(this.categoryService.update(key as number, values)) as Promise<any>,
        remove: (key) =>
            firstValueFrom(this.categoryService.remove(key as number)).then(() => undefined) as Promise<any>,
    });

    usersStore = new CustomStore({
        key: 'id',
        load: () =>
            firstValueFrom(this.userService.list()).then((r) => r.data.items),
        insert: (values) =>
            firstValueFrom(this.userService.create(values)) as Promise<any>,
        update: (key, values) =>
            firstValueFrom(this.userService.update(key as number, values)) as Promise<any>,
    });

  goBack(): void { this.router.navigate(['/tickets']); }
}