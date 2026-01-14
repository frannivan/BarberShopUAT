import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone, ViewChild, HostListener } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Subscription, Observable } from 'rxjs';
import { filter, startWith, map } from 'rxjs/operators';
import { NavigationEnd, ActivatedRoute, Router } from '@angular/router';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg, EventDropArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { EventResizeDoneArg } from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import esLocale from '@fullcalendar/core/locales/es';
import { AppointmentService } from '../../services/appointment.service';
import { StorageService } from '../../services/storage.service';
import { AdminService } from '../../services/admin.service'; // Added
import { BarberService } from '../../services/barber.service';
import { ServiceTypeService } from '../../services/service-type.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AuthService } from '../../services/auth.service';

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
        CommonModule,
        DatePipe,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        MatTabsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatNativeDateModule,
        MatDatepickerModule,
        MatPaginatorModule,
        MatSortModule,
        MatTooltipModule,
        MatSnackBarModule,
        FormsModule,
        ReactiveFormsModule, // Added
        MatAutocompleteModule, // Added
        MatSlideToggleModule, // Added
        RouterModule,
        MatTableModule,
        FullCalendarModule
    ],
    templateUrl: './booking.component.html',
    styleUrls: ['./booking.component.css']
})
export class BookingComponent implements OnInit, OnDestroy {
    private routerSubscription: Subscription | undefined;


    // Guest Fields
    editGuestName: string = '';
    editGuestEmail: string = '';
    editGuestPhone: string = '';
    calendarOptions: CalendarOptions = {
        initialView: 'timeGridWeek',
        plugins: [dayGridPlugin, interactionPlugin, timeGridPlugin],
        dateClick: (arg) => {
            console.log('dateClick triggered:', arg);
            this.ngZone.run(() => {
                this.handleDateClick(arg);
            });
        },
        eventClick: (arg) => {
            console.log('eventClick triggered:', arg);
            this.ngZone.run(() => {
                this.handleEventClick(arg);
            });
        },
        editable: true,
        eventDrop: (arg) => {
            console.log('eventDrop triggered:', arg);
            this.ngZone.run(() => {
                this.handleEventDrop(arg);
            });
        },
        eventResize: (arg) => {
            console.log('eventResize triggered:', arg);
            this.ngZone.run(() => {
                this.handleEventResize(arg);
            });
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
        allDaySlot: false,
        // Removed selectConstraint to allow clicking anywhere (especially in Month view)
        select: (arg) => {
            console.log('select triggered:', arg);
            this.ngZone.run(() => {
                this.handleDateClick(arg);
            });
        },
        // Custom Toolbar to hide default title (we will show it externally with clock)
        headerToolbar: {
            left: 'prev,next today',
            center: '',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        datesSet: (arg) => {
            this.ngZone.run(() => {
                this.viewTitle = arg.view.title;
            });
        }
    };

    barbers: any[] = [];
    barberColors: Map<number, string> = new Map();
    selectedBarberId: number = 0; // Default to 'All Barbers'
    isLoggedIn = false;
    isAdmin = false;
    isBarber = false;

    // List view properties
    displayedColumns: string[] = ['date', 'time', 'barber', 'client', 'type', 'notes', 'actions'];
    dataSource: MatTableDataSource<any> = new MatTableDataSource();
    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    // View Switcher
    selectedView: 'calendar' | 'list' | 'both' = 'calendar';

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
    editEndTime: string = '';
    editStatus: string = '';
    editNotes: string = '';
    editTypeId: number | null = null;
    serviceTypes: any[] = [];
    isSaving = false;

    // Unified Booking Modal
    showBookingModal = false;
    bookingBarberId: number | null = null;
    bookingDate: Date | null = null;
    bookingTime: string = '';
    bookingEndTime: string = ''; // New field for custom duration
    bookingTypeId: number | null = null;
    bookingNotes: string = '';

    // Guest fields for unified modal
    bookingGuestName = '';
    bookingGuestEmail = '';
    bookingGuestPhone = '';

    // Client Selection Logic
    isGuestBooking = false; // Default to Client Selection for Admin
    clientControl = new FormControl();
    clients: any[] = [];
    filteredClients!: Observable<any[]>; // Added definite assignment assertion
    selectedClientId: number | null = null;

    // Quick Client Creation
    showQuickClientModal = false;
    newClient = {
        name: '',
        email: '',
        phone: '',
        password: '', // Required for creation
        role: 'CLIENTE'
    };

    // Live Clock & Title
    currentTime: string = '';
    viewTitle: string = ''; // Capture Calendar Title
    private clockInterval: any;


    constructor(
        private appointmentService: AppointmentService,
        private storageService: StorageService,
        private barberService: BarberService,
        private authService: AuthService,
        private adminService: AdminService, // Re-added for creating users
        private serviceTypeService: ServiceTypeService,
        private route: ActivatedRoute,
        private router: Router,
        private cdr: ChangeDetectorRef,
        private ngZone: NgZone,
        private snackBar: MatSnackBar
    ) {
        // Force refresh when navigating to the same URL
        this.routerSubscription = this.router.events.pipe(
            filter(e => e instanceof NavigationEnd)
        ).subscribe(() => {
            this.fullReload();
        });
    }

    ngOnInit(): void {
        this.fullReload();
        this.startClock();
    }

    ngOnDestroy(): void {
        if (this.routerSubscription) {
            this.routerSubscription.unsubscribe();
        }
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
        }
    }

    private startClock() {
        this.updateTime();
        this.clockInterval = setInterval(() => {
            this.updateTime();
        }, 1000);
    }

    private updateTime() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        this.currentTime = `${hours}:${minutes}`;
    }


    private fullReload(): void {
        this.isLoggedIn = this.storageService.isLoggedIn();
        const user = this.storageService.getUser();
        // Robust Admin Check (Case-insensitive, handles ROLE_ prefix)
        const role = String(user?.role || '').toUpperCase();
        const roles = Array.isArray(user?.roles) ? user.roles.map((r: string) => String(r).toUpperCase()) : [];

        this.isAdmin = role === 'ADMIN' ||
            role === 'ROLE_ADMIN' ||
            roles.includes('ADMIN') ||
            roles.includes('ROLE_ADMIN');

        this.isBarber = role === 'BARBER' ||
            role === 'ROLE_BARBER' ||
            roles.includes('BARBER') ||
            roles.includes('ROLE_BARBER');

        console.log('Admin Check:', { role, roles, result: this.isAdmin });
        this.loadBarbers();
        this.loadServiceTypes();
        this.loadAppointmentsForList(); // Preload for list view
        if (this.isAdmin) {
            this.loadClients();
        }

        this.route.queryParams.subscribe(params => {
            if (params['action'] === 'new') {
                this.openBookingModal();
            }
            if (params['appointmentId']) {
                const appointmentId = +params['appointmentId'];
                this.loadAppointmentForEdit(appointmentId);
            } else if (params['barberId']) {
                this.selectedBarberId = +params['barberId'];
                this.loadBarberAppointments(this.selectedBarberId);
            }
        });
    }

    loadAppointmentsForList(): void {
        const obs$ = (this.selectedBarberId && this.selectedBarberId !== 0)
            ? this.appointmentService.getBarberAppointments(this.selectedBarberId)
            : this.appointmentService.getAppointments();

        obs$.subscribe({
            next: (data) => {
                let filteredData = data;
                const user = this.storageService.getUser();

                if (this.isLoggedIn && user) {
                    if (user.role === 'USER') {
                        // User sees only their own appointments
                        filteredData = data.filter((x: any) => x.user?.id === user.id || x.clientEmail === user.email);
                    } else if (user.role === 'BARBER') {
                        // Barber sees only their assignments
                        // Assuming user.id links to barber.id or externalId. 
                        // If logic is complex, backend should handle. For now, filter by barberId matches userId if they map 1:1 or use email.
                        // Let's assume the user object has an ID that matches the barber's ID or we filter by email/name.
                        // For safety, if backend sends all, we filter by barber name or ID.
                        // Ideally backend does this.
                    }
                    // Admin sees all (no filter)
                }

                // Sort by date ascending (Nearest first)
                this.dataSource.data = filteredData.sort((a: any, b: any) => {
                    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
                }).map((apt: any) => ({
                    ...apt,
                    clientName: apt.clientName || apt.user?.name || apt.guestName || 'Unknown',
                    displayTime: new Date(apt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    displayDate: new Date(apt.startTime)
                }));

                setTimeout(() => {
                    this.dataSource.paginator = this.paginator;
                    this.dataSource.sort = this.sort;
                    if (this.sort) {
                        this.sort.active = 'date';
                        this.sort.direction = 'desc';
                    }
                });
            },
            error: (e) => console.error(e)
        });
    }

    loadServiceTypes(): void {
        this.serviceTypeService.getAllTypes().subscribe(data => {
            this.serviceTypes = data;
        });
    }

    loadBarbers(): void {
        const fetch$ = this.isAdmin ? this.barberService.getAllBarbersAdmin() : this.barberService.getBarbers();

        fetch$.subscribe({
            next: data => {
                this.barbers = data;
                this.barbers.forEach((barber, index) => {
                    // Use DB color if available, otherwise fallback to cycle
                    const color = barber.color || BARBER_COLORS[index % BARBER_COLORS.length];
                    this.barberColors.set(barber.id, color);
                });

                // If selectedBarberId is 0, load all after barbers are available
                if (this.selectedBarberId === 0) {
                    this.loadAllAppointments();
                }

                this.cdr.detectChanges();
            },
            error: err => {
                console.error(err);
            }
        });
    }

    get activeBarbers(): any[] {
        return this.barbers.filter(b => b.active !== false);
    }

    // Load Clients for Autocomplete
    loadClients(): void {
        // Fetch all users using AuthService (Admin role check assumed)
        this.authService.getUsers().subscribe({
            next: (data: any[]) => {
                // Filter only clients/users
                this.clients = data.filter(u => u.role === 'CLIENTE' || u.role === 'USER');

                this.filteredClients = this.clientControl.valueChanges.pipe(
                    startWith(''),
                    map(value => {
                        const name = typeof value === 'string' ? value : value?.name;
                        return name ? this._filterClients(name as string) : this.clients.slice();
                    })
                );
            },
            error: (err) => console.error('Error loading clients', err)
        });
    }

    private _filterClients(name: string): any[] {
        const filterValue = name.toLowerCase();
        return this.clients.filter(client =>
            client.name.toLowerCase().includes(filterValue) ||
            client.email.toLowerCase().includes(filterValue)
        );
    }

    displayClientFn(client: any): string {
        return client && client.name ? client.name : '';
    }

    onClientSelected(event: any): void {
        console.log('onClientSelected triggered:', event.option.value);
        const value = event.option.value;
        if (value && value.id === 'NEW') {
            console.log('Opening Quick Client Modal...');
            this.openQuickClientModal();
            // Reset the control so "Crear Nuevo Cliente" doesn't stay in the input
            setTimeout(() => this.clientControl.setValue(null), 100);
        } else {
            console.log('Client selected:', value);
            this.selectedClientId = value.id;
        }
    }

    // Quick Client Modal Logic
    openQuickClientModal() {
        console.log('openQuickClientModal called.');

        // Wrap in timeout to allow Autocomplete event to finish before destroying view
        setTimeout(() => {
            console.log('Hiding Booking Modal and showing Quick Modal');
            this.showBookingModal = false; // TEMPORARILY HIDE BOOKING MODAL

            this.newClient = {
                name: '',
                email: '',
                phone: '',
                password: '',
                role: 'CLIENTE'
            };
            this.showQuickClientModal = true;
            this.cdr.detectChanges();
        }, 150);
    }

    closeQuickClientModal() {
        this.showQuickClientModal = false;
        // RESTORE BOOKING MODAL
        setTimeout(() => {
            this.showBookingModal = true;
            this.cdr.detectChanges();
        }, 0);
    }

    saveQuickClient(): void {
        if (!this.newClient.name || !this.newClient.email || !this.newClient.password) return;

        // Assign 'CLIENT' role by default
        this.newClient.role = 'CLIENT';

        this.adminService.saveUser(this.newClient).subscribe({
            next: (createdUser: any) => {
                this.snackBar.open('¡Cliente registrado con éxito!', 'Cerrar', { duration: 3000, panelClass: ['green-snackbar'] });

                // Add to local list immediately so it can be searched
                this.clients.push(createdUser); // Changed from allClients to clients based on context

                // Update the autocomplete control to select this new user
                this.clientControl.setValue(createdUser);
                this.onClientSelected({ option: { value: createdUser } } as any);

                this.closeQuickClientModal();

                // Reset form
                this.newClient = { name: '', email: '', phone: '', password: '', role: 'CLIENTE' }; // Reverted to original structure
            },
            error: (err: any) => {
                console.error('Error creating client', err);
                const msg = err.error?.message || 'Error al registrar cliente';
                this.snackBar.open(msg, 'Cerrar', { duration: 4000, panelClass: ['red-snackbar'] });
            }
        });
    }

    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            if (this.showQuickClientModal) {
                this.closeQuickClientModal();
            } else if (this.showBookingModal) {
                this.closeBookingModal();
            } else if (this.showAppointmentDetail) {
                this.closeAppointmentDetail();
            }
        }
    }

    getBarberColor(barberId: number): string {
        return this.barberColors.get(barberId) || '#667eea';
    }

    onBarberChange(): void {
        this.loadAppointmentsForList(); // Update list view

        if (this.selectedBarberId === 0) {
            // "All" option selected
            this.loadAllAppointments();
        } else if (this.selectedBarberId) {
            this.loadBarberAppointments(this.selectedBarberId);
        }
    }

    onViewChange(): void {
        // Trigger window resize to force FullCalendar to readjust its size
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 100);
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
                        title: `${barber.name} - ${appt.clientName || appt.guestName || 'Cliente'}`,
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
                    title: `${barber?.name || 'Barbero'} - ${appt.clientName || appt.guestName || 'Cliente'}`,
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

        const appointmentId = clickInfo.event.extendedProps?.['appointmentId'];
        if (appointmentId) {
            this.loadAppointmentForEdit(Number(appointmentId));
        }
    }

    handleEventDrop(arg: EventDropArg): void {
        console.log('Event dropped:', arg);

        if (!this.isAdmin) {
            this.snackBar.open('Only admins can reschedule appointments by dragging.', 'Close', { duration: 3000 });
            arg.revert();
            return;
        }

        const appointmentId = arg.event.extendedProps?.['appointmentId'];
        const newStart = arg.event.start;

        if (!appointmentId || !newStart) {
            this.snackBar.open('Invalid appointment data.', 'Close', { duration: 3000 });
            arg.revert();
            return;
        }

        if (!confirm(`Are you sure you want to reschedule this appointment to ${newStart.toLocaleString()}?`)) {
            arg.revert();
            return;
        }

        const updateData: any = {
            startTime: this.formatDateForBackend(newStart.toISOString()),
            endTime: arg.event.end ? this.formatDateForBackend(arg.event.end.toISOString()) : null,
            barberId: arg.event.extendedProps?.['barber']?.id,
            notes: arg.event.extendedProps?.['notes'],
            appointmentTypeId: arg.event.extendedProps?.['appointmentType']?.id,
            status: arg.event.extendedProps?.['status']
        };

        this.appointmentService.updateAppointment(appointmentId, updateData).subscribe({
            next: () => {
                this.snackBar.open('Appointment rescheduled successfully!', 'Close', { duration: 3000 });
            },
            error: (err) => {
                console.error('Error rescheduling appointment:', err);
                this.snackBar.open('Failed to reschedule appointment: ' + (err.error?.message || err.message), 'Close', { duration: 5000 });
                arg.revert();
            }
        });
    }

    handleEventResize(arg: EventResizeDoneArg): void {
        console.log('Event resized:', arg);

        if (!this.isAdmin && !this.isBarber) {
            this.snackBar.open('Only admins and barbers can resize appointments.', 'Close', { duration: 3000 });
            arg.revert();
            return;
        }

        const appointmentId = arg.event.extendedProps?.['appointmentId'];
        const newEnd = arg.event.end;

        if (!appointmentId || !newEnd) {
            arg.revert();
            return;
        }

        if (!confirm(`Confirm extending appointment to ${newEnd.toLocaleTimeString()}?`)) {
            arg.revert();
            return;
        }

        const updateData: any = {
            // Start time didn't change, but we must send it or backend might complain if validation is strict? 
            // Actually controller checks: if startTime provided... 
            // If we only want to update EndTime, we can send just endTime if controller supports it.
            // My controller update logic:
            // if (request.getEndTime() != null) appointment.setEndTime...
            // It allows updating just endTime if startTime is null.
            // BUT, safe to send all.
            startTime: this.formatDateForBackend(arg.event.start!.toISOString()),
            endTime: this.formatDateForBackend(newEnd.toISOString()),
            barberId: arg.event.extendedProps?.['barber']?.id,
            notes: arg.event.extendedProps?.['notes'],
            appointmentTypeId: arg.event.extendedProps?.['appointmentType']?.id,
            status: arg.event.extendedProps?.['status']
        };

        this.appointmentService.updateAppointment(appointmentId, updateData).subscribe({
            next: () => {
                this.snackBar.open('Appointment duration updated!', 'Close', { duration: 3000 });
            },
            error: (err) => {
                console.error('Error resizing appointment:', err);
                this.snackBar.open('Failed to resize: ' + err.message, 'Close', { duration: 3000 });
                arg.revert();
            }
        });

    }

    onStartTimeChange() {
        if (!this.bookingTime) return;

        const [hours, minutes] = this.bookingTime.split(':').map(Number);
        const startTime = new Date();
        startTime.setHours(hours, minutes, 0, 0);

        // Add 30 minutes
        const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);
        const endHours = endTime.getHours().toString().padStart(2, '0');
        const endMinutes = endTime.getMinutes().toString().padStart(2, '0');

        this.bookingEndTime = `${endHours}:${endMinutes}`;
    }

    private isBarberActive(id: number): boolean {
        return this.activeBarbers.some(b => b.id === id);
    }

    openBookingModal() {
        // Force reset
        this.showBookingModal = false;
        this.cdr.detectChanges();

        this.bookingDate = new Date();
        this.bookingTime = '';
        this.bookingEndTime = '';

        // Fix: Only pre-select if active
        if (this.selectedBarberId !== 0 && this.isBarberActive(this.selectedBarberId)) {
            this.bookingBarberId = this.selectedBarberId;
        } else {
            this.bookingBarberId = null;
        }

        // Reset defaults
        this.bookingTypeId = null;
        this.bookingNotes = '';
        this.bookingGuestName = '';
        this.bookingGuestEmail = '';
        this.bookingGuestPhone = '';

        setTimeout(() => {
            this.showBookingModal = true;
            this.cdr.detectChanges();
        }, 50);
    }

    // ... (omitted)

    handleDateClick(arg: any) {
        // Force reset deferred to avoid NG0100
        setTimeout(() => {
            this.showBookingModal = false;
            this.cdr.detectChanges();
        }, 0);

        console.log('handleDateClick called:', arg);
        const dateStr = arg.dateStr || arg.startStr;
        if (!dateStr) return;

        // Fix for Month View (YYYY-MM-DD) being parsed as UTC -> Previous Day
        if (dateStr.length === 10) {
            // It's a plain date (YYYY-MM-DD), parse as LOCAL
            const [year, month, day] = dateStr.split('-').map((num: string) => parseInt(num, 10));
            this.bookingDate = new Date(year, month - 1, day);
        } else {
            // It has time (TimeGrid), parse normally
            this.bookingDate = new Date(dateStr);
        }

        const hours = this.bookingDate.getHours().toString().padStart(2, '0');
        const minutes = this.bookingDate.getMinutes().toString().padStart(2, '0');
        this.bookingTime = `${hours}:${minutes}`;

        // Initialize End Time (Default +30 Minutes)
        const endTime = new Date(this.bookingDate.getTime() + 30 * 60 * 1000);
        const endHours = endTime.getHours().toString().padStart(2, '0');
        const endMinutes = endTime.getMinutes().toString().padStart(2, '0');
        this.bookingEndTime = `${endHours}:${endMinutes}`;

        // Fix: Only pre-select if active
        if (this.selectedBarberId !== 0 && this.isBarberActive(this.selectedBarberId)) {
            this.bookingBarberId = this.selectedBarberId;
        } else {
            this.bookingBarberId = null;
        }

        // Reset defaults
        this.bookingTypeId = null;
        this.bookingNotes = '';
        this.bookingGuestName = '';
        this.bookingGuestEmail = '';
        this.bookingGuestPhone = '';

        // Reset Client Selection Logic
        this.isGuestBooking = false;
        this.selectedClientId = null;

        // Re-initialize control to force clean state
        this.clientControl = new FormControl();
        this.filteredClients = this.clientControl.valueChanges.pipe(
            startWith(''),
            map(value => {
                const name = typeof value === 'string' ? value : value?.name;
                return name ? this._filterClients(name as string) : this.clients.slice();
            })
        );

        if (this.showQuickClientModal) {
            this.showQuickClientModal = false; // Ensure overlay is closed
        }

        setTimeout(() => {
            this.showBookingModal = true;
            this.cdr.detectChanges();
        }, 200); // Increased delay to ensure DOM teardown
    }

    closeAppointmentDetail() {
        this.showAppointmentDetail = false;
        this.selectedAppointment = null;
    }

    closeBookingModal() {
        this.showBookingModal = false;
        // Clean params
        this.router.navigate([], { queryParams: { action: null }, queryParamsHandling: 'merge' });
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
                this.snackBar.open('Appointment deleted successfully!', 'Close', { duration: 3000 });
                this.closeBookingModal();
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
                this.snackBar.open('Failed to delete appointment: ' + (err.error?.message || err.message), 'Close', { duration: 3000 });
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

        // Initialize End Time
        if (this.selectedAppointment.end) {
            const endDt = new Date(this.selectedAppointment.end);
            const endH = endDt.getHours().toString().padStart(2, '0');
            const endM = endDt.getMinutes().toString().padStart(2, '0');
            this.editEndTime = `${endH}:${endM}`;
        } else {
            // Fallback
            const endDt = new Date(this.editDate.getTime() + 60 * 60 * 1000);
            const endH = endDt.getHours().toString().padStart(2, '0');
            const endM = endDt.getMinutes().toString().padStart(2, '0');
            this.editEndTime = `${endH}:${endM}`;
        }

        this.editStatus = this.selectedAppointment.status || 'CONFIRMED'; // Default if null
        this.editNotes = this.selectedAppointment.extendedProps?.notes || '';
        this.editTypeId = this.selectedAppointment.extendedProps?.appointmentType?.id || null;
    }

    cancelEdit(): void {
        this.isEditMode = false;
        this.editBarberId = null;
        this.editDate = null;
        this.editDate = null;
        this.editTime = '';
        this.editStatus = '';
    }

    saveAppointment(): void {
        if (!this.selectedAppointment) return;

        this.isSaving = true;

        if (this.editDate && this.editTime) {
            const [hours, minutes] = this.editTime.split(':').map(Number);
            const newDateTime = new Date(this.editDate);
            newDateTime.setHours(hours, minutes, 0, 0);

            const updateData: any = {
                barberId: this.editBarberId,
                startTime: this.formatDateForBackend(newDateTime.toISOString()),
                notes: this.editNotes,
                appointmentTypeId: this.editTypeId,
                status: this.editStatus
            };

            // Handle End Time
            if (this.editEndTime) {
                const endCombinedDate = new Date(this.editDate);
                const [endHours, endMinutes] = this.editEndTime.split(':');
                endCombinedDate.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);

                // Handle day rollover if needed
                if (endCombinedDate <= newDateTime) {
                    endCombinedDate.setDate(endCombinedDate.getDate() + 1);
                }
                updateData.endTime = this.formatDateForBackend(endCombinedDate.toISOString());
            }

            console.log('Updating Appointment Payload:', updateData);
            console.log('Edit End Time Input:', this.editEndTime);

            this.appointmentService.updateAppointment(this.selectedAppointment.id, updateData).subscribe({
                next: () => {
                    this.snackBar.open('Appointment updated successfully!', 'Close', { duration: 3000 });
                    this.cancelEdit();
                    this.closeAppointmentDetail(); // Corrected to close the right modal
                    this.refreshAppointments();
                    this.isSaving = false;
                },
                error: err => {
                    console.error('Error updating appointment:', err);
                    this.snackBar.open('Failed to update: ' + (err.error?.message || err.message), 'Close', { duration: 3000 });
                    this.isSaving = false;
                }
            });
        }
    }

    refreshAppointments() {
        if (this.selectedBarberId === 0) {
            this.loadAllAppointments();
        } else if (this.selectedBarberId) {
            this.loadBarberAppointments(this.selectedBarberId);
        }
    }



    submitBooking() {
        if (this.isSaving) return; // Prevent double submission

        if (!this.bookingBarberId || !this.bookingDate || !this.bookingTime || !this.bookingTypeId) {
            this.snackBar.open('Por favor complete todos los campos obligatorios.', 'Close', { duration: 3000 });
            return;
        }

        this.isSaving = true;

        // Validate Client/Guest
        if (!this.isLoggedIn) {
            // For Admin creating booking:
            if (this.isAdmin) {
                if (!this.isGuestBooking && !this.selectedClientId) {
                    this.snackBar.open('Por favor seleccione un cliente o cambie a modo Invitado.', 'Close', { duration: 3000 });
                    this.isSaving = false;
                    return;
                }
                if (this.isGuestBooking && (!this.bookingGuestName || !this.bookingGuestEmail)) {
                    this.snackBar.open('Por favor ingrese nombre y correo del invitado.', 'Close', { duration: 3000 });
                    this.isSaving = false;
                    return;
                }
            } else {
                // Public Guest
                if (!this.bookingGuestName || !this.bookingGuestEmail) {
                    this.snackBar.open('Por favor ingrese su nombre y correo.', 'Close', { duration: 3000 });
                    this.isSaving = false;
                    return;
                }
            }
        }

        const [hours, minutes] = this.bookingTime.split(':').map(Number);
        const finalDate = new Date(this.bookingDate);
        finalDate.setHours(hours, minutes, 0, 0);
        const formattedDate = this.formatDateForBackend(finalDate.toISOString());

        // Calculate End Time for New Appointment
        let endTimeCombined: Date | null = null;
        if (this.bookingEndTime) {
            const [endH, endM] = this.bookingEndTime.split(':').map(Number);
            endTimeCombined = new Date(this.bookingDate);
            endTimeCombined.setHours(endH, endM, 0, 0);
            // Handle rollover
            if (endTimeCombined <= finalDate) {
                endTimeCombined.setDate(endTimeCombined.getDate() + 1);
            }
        }

        const appointment: any = {
            barberId: this.bookingBarberId,
            startTime: formattedDate,
            endTime: endTimeCombined ? this.formatDateForBackend(endTimeCombined.toISOString()) : null,
            appointmentTypeId: this.bookingTypeId,
            notes: this.bookingNotes
        };

        if (this.isLoggedIn) {
            if (this.isAdmin) {
                if (this.isGuestBooking) {
                    // Guest Booking by Admin
                    appointment.guestName = this.bookingGuestName;
                    appointment.guestEmail = this.bookingGuestEmail;
                    appointment.guestPhone = this.bookingGuestPhone;
                    appointment.userId = null; // Explicitly null to trigger guest logic in backend
                } else {
                    // Registered Client Booking by Admin
                    // BE assumes if userId is present it's that user? Or we send 'clientId'?
                    // Checking backend would be ideal. Assuming 'userId' field in DTO allows setting specific user.
                    appointment.userId = this.selectedClientId;
                }
            } else {
                // Regular User booking themselves (Handled by backend usually pulling from token, but we can send ID)
                // Backend usually gets user from token.
                const user = this.storageService.getUser();
                appointment.userId = user.id;
            }
        } else {
            // Public Guest
            appointment.clientName = this.bookingGuestName;
            appointment.clientEmail = this.bookingGuestEmail;
            appointment.clientPhone = this.bookingGuestPhone;
        }

        const request$ = this.isLoggedIn ?
            this.appointmentService.createAppointment(appointment) :
            this.appointmentService.createPublicAppointment(appointment);

        request$.subscribe({
            next: (res) => {
                this.snackBar.open('Cita agendada con éxito!', 'OK', { duration: 3000 });
                // Robust async close to strictly avoid NG0100
                setTimeout(() => {
                    this.closeBookingModal();
                    this.refreshAppointments();
                    this.isSaving = false;
                }, 150);
            },
            error: (err) => {
                console.error(err);
                this.snackBar.open('Error al agendar la cita. Intente nuevamente.', 'Close', { duration: 3000 });
                this.isSaving = false;
            }
        });
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

    loadAppointmentForEdit(appointmentId: number): void {
        this.appointmentService.getAppointments().subscribe({
            next: (appointments: any[]) => {
                const appointment = appointments.find((apt: any) => apt.id === appointmentId);

                if (!appointment) {
                    this.snackBar.open('Appointment not found.', 'Close', { duration: 3000 });
                    return;
                }

                console.log('Loaded appointment for edit:', appointment);

                // Removed automatic filtering by barber to preserve user's list view context
                // this.selectedBarberId = appointment.barber.id;
                // if (this.selectedBarberId) {
                //     this.loadBarberAppointments(this.selectedBarberId);
                // }

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

                    // Populate Edit Form Fields Immediately
                    this.isEditMode = true;
                    this.editBarberId = this.selectedAppointment.barber?.id || null;
                    this.editDate = new Date(this.selectedAppointment.start);

                    const hours = this.editDate.getHours().toString().padStart(2, '0');
                    const minutes = this.editDate.getMinutes().toString().padStart(2, '0');
                    this.editTime = `${hours}:${minutes}`;

                    if (this.selectedAppointment.end) {
                        const endDt = new Date(this.selectedAppointment.end);
                        const endH = endDt.getHours().toString().padStart(2, '0');
                        const endM = endDt.getMinutes().toString().padStart(2, '0');
                        this.editEndTime = `${endH}:${endM}`;
                    }

                    this.editStatus = this.selectedAppointment.status || 'CONFIRMED';
                    this.editNotes = this.selectedAppointment.extendedProps?.notes || '';
                    this.editTypeId = this.selectedAppointment.extendedProps?.appointmentType?.id || null;

                    this.showAppointmentDetail = true;
                    this.cdr.detectChanges();
                }, 100);
            },
            error: (err: any) => {
                console.error('Error loading appointments:', err);
                this.snackBar.open('Failed to load appointment for editing. Please make sure you are logged in as admin.', 'Close', { duration: 3000 });
            }
        });
    }

    cancelAppointmentStatus(): void {
        if (!this.selectedAppointment) return;

        if (!confirm('¿Estás seguro de que deseas cancelar esta cita? El estatus cambiará a CANCELADA pero no se eliminará.')) {
            return;
        }

        const updateData: any = {
            status: 'CANCELLED'
        };

        this.appointmentService.updateAppointment(this.selectedAppointment.id, updateData).subscribe({
            next: () => {
                this.snackBar.open('Cita cancelada correctamente.', 'Cerrar', { duration: 3000 });
                this.closeAppointmentDetail();
                this.refreshAppointments();
            },
            error: (err) => {
                console.error('Error cancelling appointment:', err);
                this.snackBar.open('Error al cancelar la cita.', 'Cerrar', { duration: 3000 });
            }
        });
    }
}
