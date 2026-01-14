import { Component, Inject, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
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
        private adminService: AdminService,
        private cdRef: ChangeDetectorRef,
        private ngZone: NgZone
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
        this.isLoading = true;
        this.appointmentService.getAppointments().subscribe({
            next: (data) => {
                // Admin gets all appointments, so we filter for this specific client
                if (Array.isArray(data)) {
                    this.history = data.filter((appt: any) => appt.user && appt.user.id == this.client.id);
                }
                this.processHistory();
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error fetching history:', err);
                this.isLoading = false;
            }
        });
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

        // Ensure role is a string and valid; fallback to original or USER
        let roleVal = this.client.role || 'USER';
        try {
            roleVal = String(roleVal).toUpperCase();
        } catch (e) { roleVal = 'USER'; }

        // Create a clean payload
        const payload = {
            name: this.client.name,
            email: this.client.email,
            phone: this.client.phone,
            gender: this.client.gender,
            role: roleVal,
            age: this.client.age,
            observations: this.client.observations
        };

        console.log('Sending Payload:', payload);

        this.adminService.updateUser(this.client.id, payload).subscribe({
            next: (res) => {
                console.log('Success:', res);

                // Run inside Angular Zone
                this.ngZone.run(() => {
                    // 1. Alert (User wants confirmation)
                    alert('Guardado correctamente!');

                    // 2. Update Local State (So the view reflects changes)
                    this.client = { ...this.client, ...payload }; // Merge payload back to client
                    this.originalClient = { ...this.client };     // Sync original
                    this.isEditing = false;                       // Switch back to view mode
                    this.isLoading = false;

                    // 3. Update Parent Reference (for when modal closes later)
                    if (this.data && this.data.client) {
                        try {
                            this.data.client.name = this.client.name;
                            this.data.client.phone = this.client.phone;
                            this.data.client.gender = this.client.gender;
                            this.data.client.age = this.client.age;
                            this.data.client.email = this.client.email;
                        } catch (e) { }
                    }

                    // 4. Force UI Refresh
                    this.cdRef.detectChanges();
                });
            },
            error: (err) => {
                console.error('Save Error:', err);
                this.ngZone.run(() => {
                    this.isLoading = false;
                    this.cdRef.detectChanges();
                    alert('ERROR DE GUARDADO:\n' + (err.error?.message || err.message || 'Error desconocido'));
                });
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
