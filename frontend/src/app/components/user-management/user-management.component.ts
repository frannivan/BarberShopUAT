import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { MatTabsModule } from '@angular/material/tabs';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { BarberService } from '../../services/barber.service';
import { BehaviorSubject, Observable } from 'rxjs'; // Import BehaviorSubject

@Component({
    selector: 'app-user-management',
    standalone: true,
    imports: [
        CommonModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatCardModule,
        FormsModule,
        MatSnackBarModule,
        MatTabsModule,
        MatSlideToggleModule
    ],
    templateUrl: './user-management.component.html',
    styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {
    private usersSubject = new BehaviorSubject<any[]>([]);
    users$ = this.usersSubject.asObservable();

    private barbersSubject = new BehaviorSubject<any[]>([]);
    barbers$ = this.barbersSubject.asObservable();

    displayedColumns: string[] = ['name', 'email', 'role', 'actions'];
    barberColumns: string[] = ['photo', 'name', 'status', 'actions'];

    newUser = {
        name: '',
        email: '',
        password: '',
        role: 'USER'
    };

    constructor(
        private authService: AuthService,
        private barberService: BarberService,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit(): void {
        this.loadUsers();
        this.loadBarbers();
    }

    loadUsers(): void {
        this.authService.getUsers().subscribe({
            next: (data) => {
                this.usersSubject.next(data);
            },
            error: (e) => {
                console.error(e);
                this.showSnackBar('Error loading users', 'error-snack');
            }
        });
    }

    loadBarbers(): void {
        this.barberService.getAllBarbersAdmin().subscribe({
            next: (data) => {
                this.barbersSubject.next(data);
            },
            error: (e) => {
                console.error(e);
                this.showSnackBar('Error loading barbers', 'error-snack');
            }
        });
    }

    toggleBarberStatus(barber: any): void {
        this.barberService.toggleActive(barber.id).subscribe({
            next: () => {
                const status = !barber.active ? 'activated' : 'deactivated';
                this.showSnackBar(`Barber ${status} successfully`, 'success-snack');
                // Optimistic update - local only, data refresh will confirm
                barber.active = !barber.active;
            },
            error: (e) => {
                console.error(e);
                this.showSnackBar('Error updating status', 'error-snack');
                barber.active = !barber.active;
            }
        });
    }

    createUser(): void {
        if (!this.newUser.name || !this.newUser.email || !this.newUser.password) {
            this.showSnackBar('Please fill all fields', 'warning-snack');
            return;
        }

        this.authService.register(this.newUser).subscribe({
            next: (res) => {
                this.showSnackBar('User created successfully!', 'success-snack');
                this.loadUsers();
                // Reset form asynchronously to prevent NG0100
                setTimeout(() => {
                    this.newUser = {
                        name: '',
                        email: '',
                        password: '',
                        role: 'BARBER'
                    };
                });
            },
            error: (e) => {
                console.error(e);
                const msg = e.error?.message || 'Error creating user';
                this.showSnackBar(msg, 'error-snack');
            }
        });
    }

    deleteUser(id: number): void {
        if (confirm('Are you sure you want to delete this user?')) {
            this.authService.deleteUser(id).subscribe({
                next: () => {
                    this.showSnackBar('User deleted successfully', 'success-snack');
                    this.loadUsers();
                },
                error: (e) => {
                    console.error(e);
                    this.showSnackBar('Error deleting user', 'error-snack');
                }
            });
        }
    }

    private showSnackBar(message: string, panelClass: string) {
        this.snackBar.open(message, 'Close', {
            duration: 3000,
            panelClass: [panelClass],
            horizontalPosition: 'end',
            verticalPosition: 'top'
        });
    }
}
