import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { AppointmentService } from '../../services/appointment.service';
import { BarberService } from '../../services/barber.service';
import { RouterModule, Router } from '@angular/router';

// ...

@Component({
    selector: 'app-appointment-list',
    standalone: true,
    imports: [
        CommonModule,
        MatTableModule,
        MatCardModule,
        MatPaginatorModule,
        MatSortModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        FormsModule,
        RouterModule
    ],
    templateUrl: './appointment-list.component.html',
    styleUrls: ['./appointment-list.component.css']
})
export class AppointmentListComponent implements OnInit {
    displayedColumns: string[] = ['date', 'time', 'barber', 'client', 'type', 'notes', 'actions'];
    dataSource: MatTableDataSource<any>;
    barbers: any[] = [];
    selectedBarberId: number | null = null;
    selectedDate: Date | null = null;

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    constructor(
        private appointmentService: AppointmentService,
        private barberService: BarberService,
        private router: Router
    ) {
        this.dataSource = new MatTableDataSource();
    }

    ngOnInit(): void {
        this.loadBarbers();
        this.loadAppointments();
    }

    loadBarbers(): void {
        this.barberService.getBarbers().subscribe({
            next: (data: any[]) => {
                this.barbers = data;
            },
            error: (e: any) => console.error(e)
        });
    }

    loadAppointments(): void {
        // In a real app, we might want a filtered endpoint. For now, we get all and filter locally.
        this.appointmentService.getAppointments().subscribe({
            next: (data) => {
                this.dataSource.data = data.map((apt: any) => ({
                    ...apt,
                    clientName: apt.clientName || apt.user?.name || apt.guestName || 'Unknown',
                    displayTime: new Date(apt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    displayDate: new Date(apt.startTime)
                }));

                this.dataSource.paginator = this.paginator;
                this.dataSource.sortingDataAccessor = (item, property) => {
                    switch (property) {
                        case 'date': return item.startTime;
                        case 'time': return item.startTime;
                        case 'barber': return item.barber?.name;
                        case 'client': return item.clientName;
                        case 'type': return item.appointmentType?.name;
                        default: return item[property];
                    }
                };
                this.dataSource.sort = this.sort;

                // Default sort
                this.sort.active = 'date';
                this.sort.direction = 'desc';
                this.sort.sortChange.emit({ active: 'date', direction: 'desc' });
            },
            error: (e) => console.error(e)
        });
    }
    deleteAppointment(id: number): void {
        if (confirm('Are you sure you want to delete this appointment?')) {
            this.appointmentService.cancelAppointment(id).subscribe({
                next: () => {
                    // Remove from data source
                    const data = this.dataSource.data.filter((x: any) => x.id !== id);
                    this.dataSource.data = data;
                },
                error: (e) => {
                    console.error(e);
                    alert('Failed to delete appointment');
                }
            });
        }
    }

    editAppointment(appointmentId: number): void {
        this.router.navigate(['/booking'], { queryParams: { appointmentId: appointmentId } });
    }
}
