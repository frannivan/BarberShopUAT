import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { StorageService } from '../services/storage.service';

export const authGuard: CanActivateFn = (route, state) => {
    const storageService = inject(StorageService);
    const router = inject(Router);

    if (storageService.isLoggedIn()) {
        return true;
    }

    router.navigate(['/login']);
    return false;
};

export const adminGuard: CanActivateFn = (route, state) => {
    const storageService = inject(StorageService);
    const router = inject(Router);

    const user = storageService.getUser();
    if (storageService.isLoggedIn() && user && user.roles && (user.roles.includes('ADMIN') || user.roles.includes('ROLE_ADMIN'))) {
        return true;
    }

    router.navigate(['/home']);
    return false;
};
