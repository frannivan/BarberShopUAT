import { Component, OnInit } from '@angular/core';
import { AppointmentService } from '../../services/appointment.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-user-appointments',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatListModule, MatButtonModule],
    templateUrl: './user-appointments.component.html',
    styleUrls: ['./user-appointments.component.css']
})
export class UserAppointmentsComponent implements OnInit {
    appointments: any[] = [];
    loading = true;

    constructor(private appointmentService: AppointmentService) { }

    ngOnInit(): void {
        this.appointmentService.getAppointments().subscribe({
            next: data => {
                this.appointments = data;
                this.loading = false;
            },
            error: err => {
                console.error(err);
                this.loading = false;
            }
        });
    }

    cancelAppointment(id: number): void {
        if (confirm('Are you sure you want to cancel this appointment?')) {
            this.appointmentService.cancelAppointment(id).subscribe({
                next: () => {
                    alert('Appointment cancelled successfully!');
                    this.ngOnInit(); // Reload appointments
                },
                error: err => {
                    console.error(err);
                    alert('Failed to cancel appointment.');
                }
            });
        }
    }
}
