import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { AppointmentService } from '../../services/appointment.service';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-user-appointments',
    standalone: true,
    imports: [CommonModule, DatePipe, MatCardModule, MatListModule, MatButtonModule, MatIconModule],
    templateUrl: './user-appointments.component.html',
    styleUrls: ['./user-appointments.component.css']
})
export class UserAppointmentsComponent implements OnInit, OnDestroy {
    private routerSubscription: Subscription | undefined;
    appointments: any[] = [];
    todayAppointments: any[] = [];
    upcomingAppointments: any[] = [];
    pastAppointments: any[] = [];
    loading = true;

    constructor(
        private appointmentService: AppointmentService,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) {
        // Force refresh when navigating to the same URL
        this.routerSubscription = this.router.events.pipe(
            filter(e => e instanceof NavigationEnd)
        ).subscribe(() => {
            this.loadData();
        });
    }

    ngOnInit(): void {
        this.loadData();
    }

    ngOnDestroy(): void {
        if (this.routerSubscription) {
            this.routerSubscription.unsubscribe();
        }
    }

    private loadData(): void {
        this.loading = true;
        this.appointmentService.getAppointments().subscribe({
            next: data => {
                this.processAppointments(data);
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: err => {
                console.error(err);
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    private processAppointments(appointments: any[]): void {
        const now = new Date();
        // Create "Today" date object at 00:00:00 local time
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Create "Tomorrow" date object at 00:00:00 local time
        const tomorrowStart = new Date(todayStart);
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);

        const todayList: any[] = [];
        const upcomingList: any[] = [];
        const pastList: any[] = [];

        appointments.forEach(apt => {
            const dateStr = apt.startTime.includes('T') ? apt.startTime : apt.startTime.replace(' ', 'T');
            const aptDate = new Date(dateStr);
            const aptDayStart = new Date(aptDate.getFullYear(), aptDate.getMonth(), aptDate.getDate());

            // Determine End Time
            let aptEnd: Date;
            if (apt.endTime) {
                aptEnd = new Date(apt.endTime.includes('T') ? apt.endTime : apt.endTime.replace(' ', 'T'));
            } else {
                aptEnd = new Date(aptDate.getTime() + 60 * 60 * 1000); // Default 1 Hour
            }

            // Add date object for sorting (keep original time)
            const enhancedApt = { ...apt, _dateObj: aptDate };

            // Logic:
            // 1. If End Time has PASSED (< now), it goes to Past.
            // 2. Else: Sort into Today or Upcoming based on Day.
            if (aptEnd.getTime() < now.getTime()) {
                pastList.push(enhancedApt);
            } else if (aptDayStart.getTime() === todayStart.getTime()) {
                todayList.push(enhancedApt);
            } else if (aptDayStart.getTime() >= tomorrowStart.getTime()) {
                upcomingList.push(enhancedApt);
            } else {
                // Technically handled by #1, but catch-all for old dates not caught (unlikely)
                pastList.push(enhancedApt);
            }
        });

        // Sort Today and Upcoming: Ascending (Earliest first)
        this.todayAppointments = todayList.sort((a, b) => a._dateObj.getTime() - b._dateObj.getTime());
        this.upcomingAppointments = upcomingList.sort((a, b) => a._dateObj.getTime() - b._dateObj.getTime());

        // Sort Past: Descending (Most recent first)
        this.pastAppointments = pastList.sort((a, b) => b._dateObj.getTime() - a._dateObj.getTime());

        // For compatibility
        this.appointments = [...this.todayAppointments, ...this.upcomingAppointments, ...this.pastAppointments];
    }

    cancelAppointment(id: number): void {
        if (confirm('Are you sure you want to cancel this appointment?')) {
            this.appointmentService.cancelAppointment(id).subscribe({
                next: () => {
                    alert('Appointment cancelled successfully!');
                    this.loadData(); // Reload appointments
                },
                error: (err: any) => {
                    console.error(err);
                    alert('Failed to cancel appointment.');
                }
            });
        }
    }

    isInProgress(appointment: any): boolean {
        // If status is CANCELLED or COMPLETED, it's not "active" in the sense of "happening now" visually as pending
        if (appointment.status === 'CANCELLED' || appointment.status === 'COMPLETED') {
            return false;
        }

        const now = new Date();
        const start = new Date(appointment.startTime.includes('T') ? appointment.startTime : appointment.startTime.replace(' ', 'T'));

        // Assume 1 hour duration if no end time, or use end time if available
        let end: Date;
        if (appointment.endTime) {
            end = new Date(appointment.endTime.includes('T') ? appointment.endTime : appointment.endTime.replace(' ', 'T'));
        } else {
            end = new Date(start.getTime() + 60 * 60 * 1000); // +1 Hour default
        }

        const inProgress = now >= start && now <= end;
        if (inProgress) {
            console.log('ACTIVE APPOINTMENT FOUND:', { id: appointment.id, now, start, end, inProgress });
        }

        return inProgress;
    }
}
