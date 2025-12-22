import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { StorageService } from '../../services/storage.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
    form: any = {
        email: null,
        password: null
    };
    isLoggedIn = false;
    isLoginFailed = false;
    errorMessage = '';
    roles: string[] = [];

    constructor(private authService: AuthService, private storageService: StorageService, private router: Router) { }

    ngOnInit(): void {
        if (this.storageService.isLoggedIn()) {
            this.isLoggedIn = true;
            this.roles = this.storageService.getUser().roles;
            this.router.navigate(['/home']);
        }
    }

    onSubmit(): void {
        const { email, password } = this.form;

        this.authService.login({ email, password }).subscribe({
            next: data => {
                this.storageService.saveUser(data);

                this.isLoginFailed = false;
                this.isLoggedIn = true;
                this.roles = this.storageService.getUser().roles;
                this.router.navigate(['/home']);
            },
            error: err => {
                this.errorMessage = err.error.message;
                this.isLoginFailed = true;
            }
        });
    }
}
