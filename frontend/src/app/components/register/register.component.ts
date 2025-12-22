import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule],
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
    form: any = {
        name: null,
        email: null,
        password: null,
        role: null
    };
    isSuccessful = false;
    isSignUpFailed = false;
    errorMessage = '';

    constructor(private authService: AuthService) { }

    ngOnInit(): void {
    }

    onSubmit(): void {
        const { name, email, password, role } = this.form;

        this.authService.register({ name, email, password, role }).subscribe({
            next: data => {
                console.log(data);
                this.isSuccessful = true;
                this.isSignUpFailed = false;
            },
            error: err => {
                this.errorMessage = err.error.message;
                this.isSignUpFailed = true;
            }
        });
    }
}
