import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../services/admin.service';
import { AppointmentService } from '../../services/appointment.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-admin',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatListModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatTabsModule,
        FormsModule
    ],
    templateUrl: './admin.component.html',
    styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
    stats: any = {};
    appointments: any[] = [];
    barbers: any[] = [];

    // New barber form
    newBarber = {
        name: '',
        email: '',
        password: '',
        photoUrl: ''
    };

    // New admin form
    newAdmin = {
        name: '',
        email: '',
        password: ''
    };

    constructor(private adminService: AdminService, private appointmentService: AppointmentService) { }

    ngOnInit(): void {
        this.loadStats();
        this.loadAppointments();
        this.loadBarbers();
    }

    loadStats(): void {
        this.adminService.getStats().subscribe({
            next: data => {
                this.stats = data;
            },
            error: err => {
                console.error(err);
            }
        });
    }

    loadAppointments(): void {
        this.appointmentService.getAppointments().subscribe({
            next: data => {
                this.appointments = data;
            },
            error: err => {
                console.error(err);
            }
        });
    }

    loadBarbers(): void {
        this.adminService.getBarbers().subscribe({
            next: data => {
                this.barbers = data;
            },
            error: err => {
                console.error(err);
            }
        });
    }

    cancelAppointment(id: number): void {
        if (confirm('Are you sure you want to cancel this appointment?')) {
            this.appointmentService.cancelAppointment(id).subscribe({
                next: () => {
                    alert('Appointment cancelled successfully!');
                    this.loadAppointments();
                    this.loadStats();
                },
                error: err => {
                    console.error(err);
                    alert('Failed to cancel appointment.');
                }
            });
        }
    }

    createBarber(): void {
        if (!this.newBarber.name || !this.newBarber.email || !this.newBarber.password) {
            alert('Please fill in all required fields.');
            return;
        }

        this.adminService.createBarber(this.newBarber).subscribe({
            next: () => {
                alert('Barber created successfully!');
                this.newBarber = { name: '', email: '', password: '', photoUrl: '' };
                this.loadBarbers();
                this.loadStats();
            },
            error: err => {
                console.error(err);
                alert('Failed to create barber. ' + (err.error?.message || ''));
            }
        });
    }

    createAdmin(): void {
        if (!this.newAdmin.name || !this.newAdmin.email || !this.newAdmin.password) {
            alert('Please fill in all required fields.');
            return;
        }

        this.adminService.createAdmin(this.newAdmin).subscribe({
            next: () => {
                alert('Admin created successfully!');
                this.newAdmin = { name: '', email: '', password: '' };
                this.loadStats();
            },
            error: err => {
                console.error(err);
                alert('Failed to create admin. ' + (err.error?.message || ''));
            }
        });
    }
}

