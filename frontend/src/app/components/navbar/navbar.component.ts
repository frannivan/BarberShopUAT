import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { StorageService } from '../../services/storage.service';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [CommonModule, RouterModule, MatToolbarModule, MatButtonModule],
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
    constructor(private storageService: StorageService, private router: Router) { }

    isLoggedIn(): boolean {
        return this.storageService.isLoggedIn();
    }

    isAdmin(): boolean {
        const user = this.storageService.getUser();

        if (!user || null == user.roles) {
            return false;
        }

        // Check for both formats
        return user.roles.includes('ADMIN') || user.roles.includes('ROLE_ADMIN');
    }

    logout(): void {
        this.storageService.clean();
        this.router.navigate(['/home']);
    }
}
