
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { AppointmentService } from '../../services/appointment.service';
import { StorageService } from '../../services/storage.service';
import { BarberService } from '../../services/barber.service';
import { ServiceTypeService } from '../../services/service-type.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Color palette for barbers
const BARBER_COLORS = [
    '#667eea', // Purple
    '#f56565', // Red
    '#48bb78', // Green
    '#ed8936', // Orange
    '#4299e1', // Blue
    '#9f7aea', // Violet
    '#38b2ac', // Teal
    '#e53e3e', // Dark Red
];

@Component({
    selector: 'app-booking',
    standalone: true,
    imports: [
        FullCalendarModule,
        CommonModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        MatDatepickerModule,
        MatNativeDateModule,
        FormsModule,
        RouterModule
    ],
    templateUrl: './booking.component.html',
    styleUrls: ['./booking.component.css']
})
export class BookingComponent implements OnInit {
    calendarOptions: CalendarOptions = {
        initialView: 'timeGridWeek',
        plugins: [dayGridPlugin, interactionPlugin, timeGridPlugin],
        dateClick: (arg) => {
            console.log('dateClick triggered:', arg);
            this.handleDateClick(arg);
        },
        eventClick: (arg) => {
            console.log('eventClick triggered:', arg);
            this.handleEventClick(arg);
        },
        selectable: true,
        events: [],
        businessHours: {
            daysOfWeek: [1, 2, 3, 4, 5, 6], // Monday - Saturday
            startTime: '09:00',
            endTime: '18:00',
        },
        slotMinTime: '09:00:00',
        slotMaxTime: '18:00:00',
        selectConstraint: 'businessHours',
        select: (arg) => {
            console.log('select triggered:', arg);
            this.handleDateClick(arg);
        },
    };

    barbers: any[] = [];
    barberColors: Map<number, string> = new Map();
    selectedBarberId: number | null = null;
    isLoggedIn = false;
    isAdmin = false;

    // Guest info
    guestName = '';
    guestEmail = '';
    guestPhone = '';

    // Selected appointment time
    selectedTime: string | null = null;
    showGuestForm = false;

    // Appointment detail modal
    showAppointmentDetail = false;
    selectedAppointment: any = null;
    isDeleting = false;

    // Edit mode
    isEditMode = false;
    editBarberId: number | null = null;
    editDate: Date | null = null;
    editTime: string = '';
    editNotes: string = '';
    editTypeId: number | null = null;
    serviceTypes: any[] = [];
    isSaving = false;

    constructor(
        private appointmentService: AppointmentService,
        private storageService: StorageService,
        private barberService: BarberService,
        private serviceTypeService: ServiceTypeService,
        private route: ActivatedRoute,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.isLoggedIn = this.storageService.isLoggedIn();
        const user = this.storageService.getUser();
        this.isAdmin = user?.role === 'ADMIN' || user?.roles?.includes('ADMIN');
        this.loadBarbers();
        this.loadServiceTypes();
        this.route.queryParams.subscribe(params => {
            if (params['appointmentId']) {
                // Load specific appointment for editing
                const appointmentId = +params['appointmentId'];
                this.loadAppointmentForEdit(appointmentId);
            } else if (params['barberId']) {
                this.selectedBarberId = +params['barberId'];
                this.loadBarberAppointments(this.selectedBarberId);
            }
        });
    }

    loadServiceTypes(): void {
        this.serviceTypeService.getAllTypes().subscribe(data => {
            this.serviceTypes = data;
        });
    }

    loadBarbers(): void {
        this.barberService.getBarbers().subscribe({
            next: data => {
                this.barbers = data;
                // Assign colors to each barber
                this.barbers.forEach((barber, index) => {
                    this.barberColors.set(barber.id, BARBER_COLORS[index % BARBER_COLORS.length]);
                });
                this.cdr.detectChanges();
            },
            error: err => {
                console.error(err);
            }
        });
    }

    getBarberColor(barberId: number): string {
        return this.barberColors.get(barberId) || '#667eea';
    }

    onBarberChange(): void {
        if (this.selectedBarberId === 0) {
            // "All" option selected
            this.loadAllAppointments();
        } else if (this.selectedBarberId) {
            this.loadBarberAppointments(this.selectedBarberId);
        }
    }

    loadAllAppointments(): void {
        // Load appointments from all barbers using existing endpoints
        if (this.barbers.length === 0) {
            console.log('No barbers loaded yet');
            return;
        }

        let allEvents: any[] = [];
        let completedRequests = 0;

        this.barbers.forEach((barber) => {
            this.appointmentService.getBarberAppointments(barber.id).subscribe({
                next: data => {
                    const barberEvents = data.map((appt: any) => ({
                        id: appt.id,
                        title: barber.name || 'Booked',
                        start: appt.startTime,
                        end: appt.endTime,
                        color: this.getBarberColor(barber.id),
                        extendedProps: {
                            appointmentId: appt.id,
                            barber: barber,
                            clientName: appt.clientName || appt.guestName,
                            clientEmail: appt.clientEmail || appt.guestEmail,
                            clientPhone: appt.guestPhone,
                            status: appt.status,
                            notes: appt.notes,
                            appointmentType: appt.appointmentType
                        }
                    }));
                    allEvents = [...allEvents, ...barberEvents];
                    completedRequests++;

                    // When all requests complete, update the calendar
                    if (completedRequests === this.barbers.length) {
                        this.calendarOptions.events = allEvents;
                        this.cdr.detectChanges();
                    }
                },
                error: err => {
                    console.error('Error loading appointments for barber:', barber.name, err);
                    completedRequests++;
                }
            });
        });
    }

    loadBarberAppointments(barberId: number): void {
        this.appointmentService.getBarberAppointments(barberId).subscribe({
            next: data => {
                const barber = this.barbers.find(b => b.id === barberId);
                this.calendarOptions.events = data.map((appt: any) => ({
                    id: appt.id,
                    title: barber?.name || 'Booked',
                    start: appt.startTime,
                    end: appt.endTime,
                    color: this.getBarberColor(barberId),
                    extendedProps: {
                        appointmentId: appt.id,
                        barber: barber,
                        clientName: appt.clientName || appt.guestName,
                        clientEmail: appt.clientEmail || appt.guestEmail,
                        clientPhone: appt.guestPhone,
                        status: appt.status,
                        notes: appt.notes,
                        appointmentType: appt.appointmentType
                    }
                }));
                this.cdr.detectChanges();
            },
            error: err => {
                console.error(err);
            }
        });
    }

    handleEventClick(clickInfo: EventClickArg): void {
        console.log('Event clicked:', clickInfo.event);

        // Only admins/logged in users can view appointment details
        if (!this.isLoggedIn) {
            return;
        }

        this.selectedAppointment = {
            id: clickInfo.event.extendedProps['appointmentId'],
            title: clickInfo.event.title,
            start: clickInfo.event.start,
            end: clickInfo.event.end,
            barber: clickInfo.event.extendedProps['barber'],
            clientName: clickInfo.event.extendedProps['clientName'],
            clientEmail: clickInfo.event.extendedProps['clientEmail'],
            clientPhone: clickInfo.event.extendedProps['clientPhone'],
            status: clickInfo.event.extendedProps['status'],
            color: clickInfo.event.backgroundColor
        };
        this.showAppointmentDetail = true;
        this.cdr.detectChanges();
    }

    closeAppointmentDetail(): void {
        this.showAppointmentDetail = false;
        this.selectedAppointment = null;
    }

    deleteAppointment(): void {
        if (!this.selectedAppointment || !this.isAdmin) {
            return;
        }

        if (!confirm('Are you sure you want to delete this appointment?')) {
            return;
        }

        this.isDeleting = true;
        this.appointmentService.cancelAppointment(this.selectedAppointment.id).subscribe({
            next: () => {
                alert('Appointment deleted successfully!');
                this.closeAppointmentDetail();
                // Reload appointments
                if (this.selectedBarberId === 0) {
                    this.loadAllAppointments();
                } else if (this.selectedBarberId) {
                    this.loadBarberAppointments(this.selectedBarberId);
                }
                this.isDeleting = false;
            },
            error: err => {
                console.error('Error deleting appointment:', err);
                alert('Failed to delete appointment: ' + (err.error?.message || err.message));
                this.isDeleting = false;
            }
        });
    }

    enterEditMode(): void {
        if (!this.selectedAppointment) return;

        this.isEditMode = true;
        this.editBarberId = this.selectedAppointment.barber?.id || null;
        this.editDate = new Date(this.selectedAppointment.start);

        // Format time as HH:mm
        const hours = this.editDate.getHours().toString().padStart(2, '0');
        const minutes = this.editDate.getMinutes().toString().padStart(2, '0');
        this.editTime = `${hours}:${minutes}`;
        this.editNotes = this.selectedAppointment.extendedProps?.notes || '';
        this.editTypeId = this.selectedAppointment.extendedProps?.appointmentType?.id || null;
    }

    cancelEdit(): void {
        this.isEditMode = false;
        this.editBarberId = null;
        this.editDate = null;
        this.editTime = '';
    }

    saveAppointment(): void {
        if (!this.selectedAppointment || !this.editDate || !this.editTime) {
            alert('Please fill in all fields.');
            return;
        }

        this.isSaving = true;

        // Combine date and time
        const [hours, minutes] = this.editTime.split(':').map(Number);
        const newDateTime = new Date(this.editDate);
        newDateTime.setHours(hours, minutes, 0, 0);

        const updateData = {
            barberId: this.editBarberId,
            startTime: this.formatDateForBackend(newDateTime.toISOString()),
            notes: this.editNotes,
            appointmentTypeId: this.editTypeId
        };

        this.appointmentService.updateAppointment(this.selectedAppointment.id, updateData).subscribe({
            next: () => {
                alert('Appointment updated successfully!');
                this.cancelEdit();
                this.closeAppointmentDetail();
                // Reload appointments
                if (this.selectedBarberId === 0) {
                    this.loadAllAppointments();
                } else if (this.selectedBarberId) {
                    this.loadBarberAppointments(this.selectedBarberId);
                }
                this.isSaving = false;
            },
            error: err => {
                console.error('Error updating appointment:', err);
                alert('Failed to update appointment: ' + (err.error?.message || err.message));
                this.isSaving = false;
            }
        });
    }

    handleDateClick(arg: any) {
        console.log('handleDateClick called:', arg);
        console.log('isLoggedIn:', this.isLoggedIn);
        console.log('selectedBarberId:', this.selectedBarberId);

        if (!this.selectedBarberId || this.selectedBarberId === 0) {
            alert('Please select a specific barber first.');
            return;
        }

        // Get the date string - different property names for dateClick vs select
        const dateStr = arg.dateStr || arg.startStr;
        console.log('dateStr:', dateStr);

        if (!dateStr) {
            console.error('No date string found in event', arg);
            return;
        }

        // Format date without timezone for backend
        const formattedDate = this.formatDateForBackend(dateStr);

        if (this.isLoggedIn) {
            // Logged in user - book directly
            if (confirm('Would you like to book an appointment at ' + dateStr + '?')) {
                const user = this.storageService.getUser();
                const appointment = {
                    userId: user.id,
                    barberId: this.selectedBarberId,
                    startTime: formattedDate
                };
                this.bookAppointment(appointment);
            }
        } else {
            // Guest user - show form to collect info
            console.log('Setting showGuestForm = true');
            this.selectedTime = dateStr;
            this.showGuestForm = true;
            console.log('showGuestForm is now:', this.showGuestForm);
            // Force Angular to detect change because FullCalendar runs outside of zone
            this.cdr.detectChanges();
        }
    }

    private formatDateForBackend(dateStr: string): string {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    }

    submitGuestBooking(): void {
        console.log('submitGuestBooking called', {
            guestName: this.guestName,
            guestEmail: this.guestEmail,
            selectedTime: this.selectedTime,
            selectedBarberId: this.selectedBarberId
        });

        if (!this.guestName || !this.guestEmail) {
            alert('Please enter your name and email.');
            return;
        }

        const formattedDate = this.formatDateForBackend(this.selectedTime!);
        console.log('Formatted date:', formattedDate);

        const appointment = {
            barberId: this.selectedBarberId,
            startTime: formattedDate,
            guestName: this.guestName,
            guestEmail: this.guestEmail,
            guestPhone: this.guestPhone
        };

        console.log('Sending appointment:', appointment);

        // Use public appointment for guests (no auth)
        this.appointmentService.createPublicAppointment(appointment).subscribe({
            next: data => {
                console.log('Booking success:', data);
                alert('Appointment booked successfully!');
                this.showGuestForm = false;
                this.cancelGuestBooking();
                this.loadBarberAppointments(this.selectedBarberId!);
                this.cdr.detectChanges(); // Force UI update
            },
            error: err => {
                console.error('Booking error:', err);
                alert('Failed to book appointment. ' + (err.error?.message || err.message || 'Please try again.'));
            }
        });
    }

    cancelGuestBooking(): void {
        this.showGuestForm = false;
        this.selectedTime = null;
        this.guestName = '';
        this.guestEmail = '';
        this.guestPhone = '';
    }

    private bookAppointment(appointment: any): void {
        this.appointmentService.createAppointment(appointment).subscribe({
            next: data => {
                alert('Appointment booked successfully!');
                this.showGuestForm = false;
                this.cancelGuestBooking();
                this.loadBarberAppointments(this.selectedBarberId!);
            },
            error: err => {
                console.error(err);
                alert('Failed to book appointment. ' + (err.error?.message || ''));
            }
        });
    }

    loadAppointmentForEdit(appointmentId: number): void {
        // Workaround: Load all appointments and find the one we need
        // This works with existing endpoints until backend is restarted with new GET /{id} endpoint
        this.appointmentService.getAppointments().subscribe({
            next: (appointments: any[]) => {
                const appointment = appointments.find((apt: any) => apt.id === appointmentId);

                if (!appointment) {
                    alert('Appointment not found.');
                    return;
                }

                console.log('Loaded appointment for edit:', appointment);

                // Set the barber and load their appointments
                this.selectedBarberId = appointment.barber.id;
                if (this.selectedBarberId) {
                    this.loadBarberAppointments(this.selectedBarberId);
                }

                // Wait a bit for the calendar to load, then open the appointment
                setTimeout(() => {
                    this.selectedAppointment = {
                        id: appointment.id,
                        title: appointment.barber.name,
                        start: new Date(appointment.startTime),
                        end: new Date(appointment.endTime),
                        barber: appointment.barber,
                        clientName: appointment.clientName || appointment.guestName,
                        clientEmail: appointment.clientEmail || appointment.guestEmail,
                        clientPhone: appointment.guestPhone,
                        status: appointment.status,
                        color: this.getBarberColor(appointment.barber.id),
                        extendedProps: {
                            notes: appointment.notes,
                            appointmentType: appointment.appointmentType
                        }
                    };
                    this.showAppointmentDetail = true;
                    this.enterEditMode();
                    this.cdr.detectChanges();
                }, 500);
            },
            error: (err: any) => {
                console.error('Error loading appointments:', err);
                alert('Failed to load appointment for editing. Please make sure you are logged in as admin.');
            }
        });
    }
}
