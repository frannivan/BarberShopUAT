import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { BarberService } from '../../services/barber.service';
import { AppointmentService } from '../../services/appointment.service';
import { ServiceTypeService } from '../../services/service-type.service';

@Component({
    selector: 'app-simple-booking',
    standalone: true,
    imports: [
        CommonModule,
        DatePipe,
        FormsModule,
        MatCardModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatRadioModule,
        MatProgressSpinnerModule,
        MatIconModule,
        MatStepperModule
    ],
    templateUrl: './simple-booking.component.html',
    styleUrls: ['./simple-booking.component.css']
})
export class SimpleBookingComponent implements OnInit {
    barber: any = null;
    barberId: number = 0;
    loadingBarber = true;

    // Step tracking
    currentStep = 1;

    // Date selection
    selectedDate: Date | null = null;
    minDate = new Date();
    maxDate = new Date();

    // Time slots
    availableSlots: string[] = [];
    selectedSlot: string = '';
    loadingSlots = false;

    // Service types
    serviceTypes: any[] = [];
    selectedTypeId: number | null = null;
    loadingTypes = false;

    // Guest info
    guestName = '';
    guestEmail = '';
    guestPhone = '';

    // Booking state
    isBooking = false;
    bookingSuccess = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private barberService: BarberService,
        private appointmentService: AppointmentService,
        private serviceTypeService: ServiceTypeService,
        private cdr: ChangeDetectorRef
    ) {
        // Allow booking up to 30 days in advance
        this.maxDate.setDate(this.maxDate.getDate() + 30);
    }

    ngOnInit(): void {
        const barberId = this.route.snapshot.paramMap.get('barberId');
        if (barberId) {
            this.barberId = +barberId;
            this.loadBarber();
        }
        this.loadServiceTypes();
    }

    loadBarber(): void {
        this.loadingBarber = true;
        this.barberService.getBarbers().subscribe({
            next: (data: any[]) => {
                this.barber = data.find(b => b.id === this.barberId);
                this.loadingBarber = false;
                this.cdr.detectChanges();
            },
            error: (e: any) => {
                console.error(e);
                this.loadingBarber = false;
                this.cdr.detectChanges();
            }
        });
    }

    loadServiceTypes(): void {
        this.loadingTypes = true;
        this.serviceTypeService.getAllTypes().subscribe({
            next: (data) => {
                this.serviceTypes = data;
                this.loadingTypes = false;
                this.cdr.detectChanges();
            },
            error: (e) => {
                console.error(e);
                this.loadingTypes = false;
                this.cdr.detectChanges();
            }
        });
    }

    onDateChange(): void {
        console.log('onDateChange triggered, selectedDate:', this.selectedDate);
        if (this.selectedDate) {
            this.loadAvailableSlots();
            this.cdr.detectChanges();
        }
    }

    loadAvailableSlots(): void {
        if (!this.selectedDate) return;

        console.log('loadAvailableSlots called');
        this.loadingSlots = true;
        this.availableSlots = [];
        this.selectedSlot = '';

        // Format date as YYYY-MM-DD
        const dateStr = this.formatDate(this.selectedDate);
        console.log('Loading slots for date:', dateStr, 'barberId:', this.barberId);

        this.appointmentService.getAvailableSlots(this.barberId, dateStr).subscribe({
            next: (slots) => {
                console.log('Slots received:', slots);
                this.availableSlots = slots;
                this.loadingSlots = false;
                if (slots.length > 0) {
                    this.currentStep = 2;
                }
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error loading slots:', err);
                this.loadingSlots = false;
                this.cdr.detectChanges();
            }
        });
    }


    formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    formatSlotTime(slot: string): string {
        const date = new Date(slot);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }

    formatSlotDate(slot: string): string {
        const date = new Date(slot);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    selectSlot(slot: string): void {
        this.selectedSlot = slot;
    }

    continueToForm(): void {
        if (this.selectedSlot) {
            this.currentStep = 3;
        }
    }

    goBack(): void {
        if (this.currentStep > 1) {
            this.currentStep--;
        }
    }

    submitBooking(): void {
        if (!this.selectedSlot || !this.guestName || !this.guestEmail || !this.selectedTypeId) return;

        this.isBooking = true;
        this.cdr.detectChanges();

        const bookingData = {
            barberId: this.barberId,
            startTime: this.selectedSlot,
            guestName: this.guestName,
            guestEmail: this.guestEmail,
            guestPhone: this.guestPhone,
            appointmentTypeId: this.selectedTypeId
        };

        this.appointmentService.createPublicAppointment(bookingData).subscribe({
            next: (res) => {
                this.bookingSuccess = true;
                this.isBooking = false;
                this.currentStep = 4;
                this.cdr.detectChanges();
            },
            error: (e) => {
                console.error(e);
                this.isBooking = false;
                this.cdr.detectChanges();
                alert('Error booking appointment. Please try again.');
            }
        });
    }

    goHome(): void {
        this.router.navigate(['/']);
    }

    // Filter for datepicker - only allow Mon-Sat
    dateFilter = (date: Date | null): boolean => {
        if (!date) return false;
        const day = date.getDay();
        // 0 = Sunday, 6 = Saturday
        return day !== 0; // Exclude Sunday
    };
}
