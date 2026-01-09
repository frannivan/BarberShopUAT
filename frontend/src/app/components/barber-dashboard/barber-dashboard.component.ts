import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AppointmentService } from '../../services/appointment.service';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';

@Component({
    selector: 'app-barber-dashboard',
    standalone: true,
    imports: [CommonModule, DatePipe, MatCardModule, MatListModule, MatButtonModule, FullCalendarModule],
    templateUrl: './barber-dashboard.component.html',
    styleUrls: ['./barber-dashboard.component.css']
})
export class BarberDashboardComponent implements OnInit {
    appointments: any[] = [];
    calendarOptions: CalendarOptions = {
        initialView: 'timeGridWeek',
        plugins: [dayGridPlugin, timeGridPlugin],
        events: [],
        businessHours: {
            daysOfWeek: [1, 2, 3, 4, 5, 6],
            startTime: '09:00',
            endTime: '18:00',
        },
    };
    stats: any = {};

    constructor(
        private appointmentService: AppointmentService,
        private adminService: AdminService,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        this.loadAppointments();
        if (this.authService.isAdmin()) {
            this.loadStats();
        }
    }

    loadStats(): void {
        this.adminService.getStats().subscribe({
            next: data => this.stats = data,
            error: err => console.error(err)
        });
    }

    loadAppointments(): void {
        this.appointmentService.getMyBarberAppointments().subscribe({
            next: data => {
                this.appointments = data;
                this.calendarOptions.events = data.map((appt: any) => ({
                    title: appt.user ? appt.user.name : appt.guestName,
                    start: appt.startTime,
                    end: appt.endTime,
                    color: appt.status === 'BOOKED' ? '#1976d2' : '#4caf50'
                }));
            },
            error: err => {
                console.error(err);
            }
        });
    }
}
