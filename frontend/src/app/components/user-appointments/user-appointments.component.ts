import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { AppointmentService } from '../../services/appointment.service';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-user-appointments',
    standalone: true,
    imports: [CommonModule, DatePipe, MatCardModule, MatListModule, MatButtonModule],
    templateUrl: './user-appointments.component.html',
    styleUrls: ['./user-appointments.component.css']
})
export class UserAppointmentsComponent implements OnInit {
    private routerSubscription: Subscription | undefined;
    appointments: any[] = [];
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
                this.appointments = this.sortAppointments(data);
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

    private sortAppointments(appointments: any[]): any[] {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        const todayApts: any[] = [];
        const futureApts: any[] = [];
        const pastApts: any[] = [];

        appointments.forEach(apt => {
            const aptDate = new Date(apt.startTime);
            const aptDateStr = aptDate.toISOString().split('T')[0];

            if (aptDateStr === todayStr) {
                todayApts.push(apt);
            } else if (aptDate > now) {
                futureApts.push(apt);
            } else {
                pastApts.push(apt);
            }
        });

        // 1. Today: Ascending (Earliest first)
        todayApts.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

        // 2. Future: Ascending (Nearest date first)
        futureApts.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

        // 3. Past: Descending (Most recent first)
        pastApts.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

        return [...todayApts, ...futureApts, ...pastApts];
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
