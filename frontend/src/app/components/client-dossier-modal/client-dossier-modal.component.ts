import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AppointmentService } from '../../services/appointment.service';
import { AdminService } from '../../services/admin.service';

@Component({
    selector: 'app-client-dossier-modal',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        MatTooltipModule,
        DatePipe,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule
    ],
    templateUrl: './client-dossier-modal.component.html',
    styleUrls: ['./client-dossier-modal.component.css']
})
export class ClientDossierModalComponent implements OnInit {
    client: any;
    originalClient: any;
    isEditing = false;
    history: any[] = [];
    stats: any = {
        totalAppointments: 0,
        lastAppointment: null,
        preferredBarber: 'N/A'
    };
    selectedAppointment: any = null;
    isLoading = false;

    constructor(
        public dialogRef: MatDialogRef<ClientDossierModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private appointmentService: AppointmentService,
        private adminService: AdminService
    ) {
        this.client = { ...data.client }; // Clone to avoid mutation before save
        this.originalClient = { ...data.client };
        if (data.appointments) {
            this.history = data.appointments;
        }
    }

    ngOnInit(): void {
        if (this.history.length > 0) {
            this.processHistory();
        } else {
            this.fetchHistory();
        }
    }

    fetchHistory() {
        // Implementation remains same
    }

    processHistory() {
        // Implementation remains same
        this.history.sort((a: any, b: any) =>
            new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        );
        this.calculateStats();
    }

    calculateStats() {
        if (!this.history || this.history.length === 0) {
            this.stats = { totalAppointments: 0, lastAppointment: null, preferredBarber: 'N/A' };
            return;
        }

        const completedApts = this.history.filter(a => a.status === 'COMPLETED' || a.status === 'BOOKED');

        // 1. Total
        const total = completedApts.length;

        // 2. Last Appointment
        const now = new Date();
        const lastApt = this.history.find(a => new Date(a.startTime) < now);

        // 3. Preferred Barber
        const barberCounts: { [key: string]: number } = {};
        completedApts.forEach(apt => {
            const bName = apt.barber?.name || 'Unknown';
            barberCounts[bName] = (barberCounts[bName] || 0) + 1;
        });

        let preferredBarber = 'N/A';
        let maxCount = 0;
        for (const [name, count] of Object.entries(barberCounts)) {
            if (count > maxCount) {
                maxCount = count;
                preferredBarber = name;
            }
        }

        this.stats = {
            totalAppointments: total,
            lastAppointment: lastApt ? lastApt.startTime : null,
            preferredBarber: preferredBarber
        };
    }

    close(): void {
        this.dialogRef.close({ action: 'close', client: this.client });
    }

    toggleEdit() {
        this.isEditing = !this.isEditing;
        if (!this.isEditing) {
            // Cancel clicked
            this.client = { ...this.originalClient };
        }
    }

    saveProfile() {
        this.isLoading = true;
        this.adminService.updateUser(this.client.id, this.client).subscribe({
            next: (res) => {
                this.isLoading = false;
                this.isEditing = false;
                this.originalClient = { ...this.client };
                // Optionally notify parent
            },
            error: (err) => {
                console.error(err);
                this.isLoading = false;
            }
        });
    }

    selectAppointment(apt: any) {
        this.selectedAppointment = apt;
    }

    clearSelection() {
        this.selectedAppointment = null;
    }
}
