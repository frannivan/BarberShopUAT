import { Component, OnInit, ChangeDetectorRef, OnDestroy, HostListener, NgZone } from '@angular/core';
import { ServiceTypeService } from '../../services/service-type.service';
import { AdminService } from '../../services/admin.service';
import { AppointmentService } from '../../services/appointment.service';
import { CommonModule, DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Router, NavigationEnd } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule, MatTabChangeEvent } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ClientDossierModalComponent } from '../client-dossier-modal/client-dossier-modal.component';

@Component({
    selector: 'app-admin',
    standalone: true,
    imports: [
        CommonModule,
        DatePipe,
        MatCardModule,
        MatListModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatTabsModule,
        MatSelectModule,
        MatOptionModule,
        MatSnackBarModule,
        MatTooltipModule,
        FormsModule,
        MatDialogModule,
        MatDatepickerModule,
        MatNativeDateModule
    ],
    templateUrl: './admin.component.html',
    styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit, OnDestroy {
    private routerSubscription: Subscription | undefined;
    stats: any = {};
    appointments: any[] = [];
    barbers: any[] = [];

    // Appointment Edit Modal Logic
    serviceTypes: any[] = [];
    showAppointmentModal = false;
    selectedAppointment: any = null;

    // Edit Form Fields
    editAptId: number | null = null;
    editBarberId: number | null = null;
    editTypeId: number | null = null;
    editDate: Date = new Date();
    editTime: string = '';
    editEndTime: string = '';
    editStatus: string = '';
    editNotes: string = '';
    editGuestName: string = '';
    editGuestEmail: string = '';
    editGuestPhone: string = '';

    // Unified User Management
    users: any[] = [];
    showUserModal = false;
    isEditingUser = false;
    modalContext: 'staff' | 'client' = 'staff';
    availableRoles: string[] = [];

    newUser = {
        id: null,
        name: '',
        email: '',
        password: '',
        phone: '',
        gender: '',
        role: 'CLIENTE',
        photoUrl: '',
        color: '#000000'
    };

    roles = ['CLIENTE', 'BARBER', 'ADMIN', 'RECEPTION', 'ADMIN_BARBER'];
    staffRoles = ['BARBER', 'ADMIN', 'RECEPTION', 'ADMIN_BARBER'];

    selectedRoleFilter: string = 'ALL';

    constructor(
        private adminService: AdminService,
        private appointmentService: AppointmentService,
        private serviceTypeService: ServiceTypeService,
        private authService: AuthService,
        private snackBar: MatSnackBar,
        private dialog: MatDialog,
        private router: Router,
        private cdr: ChangeDetectorRef,
        private ngZone: NgZone
    ) {
        // Force refresh when navigating to the same URL
        this.routerSubscription = this.router.events.pipe(
            filter(e => e instanceof NavigationEnd)
        ).subscribe(() => {
            this.fullLoad();
        });
    }

    ngOnInit(): void {
        this.fullLoad();
    }

    ngOnDestroy(): void {
        if (this.routerSubscription) {
            this.routerSubscription.unsubscribe();
        }
    }

    private fullLoad(): void {
        this.loadStats();
        this.loadAppointments();
        this.loadBarbers();
        this.loadUsers();
        this.loadServiceTypes();
    }

    todayAppointmentsCount: number = 0;
    activeBarbersCount: number = 0;

    get activeBarbers() {
        return this.barbers ? this.barbers.filter(b => b.active) : [];
    }

    loadStats(): void {
        this.adminService.getStats().subscribe({
            next: data => {
                this.stats = data;
                this.cdr.detectChanges();
            },
            error: err => console.error('Error loading stats', err)
        });
    }

    loadAppointments(): void {
        this.appointmentService.getAllAppointments().subscribe({
            next: data => {
                this.appointments = data;

                // Calculate Today's Appointments
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                this.todayAppointmentsCount = this.appointments.filter(apt => {
                    const aptDate = new Date(apt.startTime);
                    const isToday = aptDate.getDate() === today.getDate() &&
                        aptDate.getMonth() === today.getMonth() &&
                        aptDate.getFullYear() === today.getFullYear();
                    return isToday && apt.status !== 'CANCELLED';
                }).length;

                this.cdr.detectChanges();
            },
            error: err => console.error('Error loading appointments', err)
        });
    }

    loadBarbers(): void {
        this.adminService.getBarbers().subscribe({
            next: data => {
                this.barbers = data;

                // Calculate Active Barbers
                this.activeBarbersCount = this.barbers.filter(b => b.active).length;

                this.cdr.detectChanges();
            },
            error: err => console.error('Error loading barbers', err)
        });
    }

    loadUsers() {
        this.authService.getUsers().subscribe({
            next: (data: any) => {
                this.users = data;
                this.cdr.detectChanges();
            },
            error: (err: any) => console.error('Error loading users', err)
        });
    }

    loadServiceTypes(): void {
        this.serviceTypeService.getAllTypes().subscribe({
            next: (data: any) => {
                this.serviceTypes = data;
            },
            error: (err: any) => console.error('Error loading service types', err)
        });
    }

    openEditAppointmentModal(apt: any): void {
        this.selectedAppointment = apt;
        this.editAptId = apt.id;
        this.editBarberId = apt.barber?.id;
        // Service Type ID might be populated in 'appointmentType' or 'serviceType' object
        this.editTypeId = apt.appointmentType?.id || apt.serviceType?.id;

        // Parse Date/Time
        const dt = new Date(apt.startTime); // Assuming ISO string
        this.editDate = dt;
        // Format time as HH:mm
        const hours = dt.getHours().toString().padStart(2, '0');
        const minutes = dt.getMinutes().toString().padStart(2, '0');
        this.editTime = `${hours}:${minutes}`;

        // Initialize End Time
        if (apt.endTime) {
            const endDt = new Date(apt.endTime);
            const endH = endDt.getHours().toString().padStart(2, '0');
            const endM = endDt.getMinutes().toString().padStart(2, '0');
            this.editEndTime = `${endH}:${endM}`;
        } else {
            // Default +1h if not present (fallback)
            const endDt = new Date(dt.getTime() + 60 * 60 * 1000);
            const endH = endDt.getHours().toString().padStart(2, '0');
            const endM = endDt.getMinutes().toString().padStart(2, '0');
            this.editEndTime = `${endH}:${endM}`;
        }

        this.editStatus = apt.status;
        this.editNotes = apt.notes || '';
        this.editGuestName = apt.guestName || '';
        this.editGuestEmail = apt.guestEmail || '';
        this.editGuestPhone = apt.guestPhone || '';

        this.showAppointmentModal = true;
    }

    closeAppointmentModal(): void {
        this.showAppointmentModal = false;
        this.selectedAppointment = null;
    }

    saveAppointmentChanges(): void {
        if (!this.selectedAppointment) return;

        const updatedApt: any = { // Use 'any' or define a proper interface for updatedApt
            id: this.editAptId,
            barber: { id: this.editBarberId },
            appointmentType: { id: this.editTypeId },
            // startTime: this.adminService.combineDateAndTime(this.editDate, this.editTime), // Use helper from AdminService or duplicated logic
            status: this.editStatus,
            notes: this.editNotes,
            // Guest info is handled by backend or mapped if structure allows.
            // Simplified for now: assuming AppointmentDTO handles guest info fields if they exist on the top level or inside a 'guest' object.
            // Based on previous code, we might need to send guestName/Email/Phone if it's a guest booking.
            guestName: this.editGuestName,
            guestEmail: this.editGuestEmail,
            guestPhone: this.editGuestPhone
        };

        // We need to properly format date for backend.
        // AdminService likely has combineDateAndTime, if not we can implement locally.
        const combinedDate = new Date(this.editDate);
        const [hours, minutes] = this.editTime.split(':');
        combinedDate.setHours(parseInt(hours), parseInt(minutes));
        updatedApt.startTime = combinedDate.toISOString();

        // Handle End Time
        if (this.editEndTime) {
            const endCombinedDate = new Date(this.editDate); // Use same date (assuming same day for now)
            const [endHours, endMinutes] = this.editEndTime.split(':');
            endCombinedDate.setHours(parseInt(endHours), parseInt(endMinutes));

            // Handle day rollover if end time is smaller than start time (e.g. 23:00 -> 01:00)
            if (endCombinedDate <= combinedDate) {
                endCombinedDate.setDate(endCombinedDate.getDate() + 1);
            }

            updatedApt.endTime = endCombinedDate.toISOString();
        }

        this.appointmentService.updateAppointment(this.editAptId!, updatedApt).subscribe({
            next: (res) => {
                this.showSnackBar('Cita actualizada correctamente.');
                this.closeAppointmentModal();
                this.loadAppointments();
                this.loadStats(); // Refresh stats
            },
            error: (err) => {
                console.error('Error updating appointment', err);
                this.showSnackBar('Error al actualizar la cita.', 'error');
            }
        });
    }

    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            if (this.showAppointmentModal) {
                this.closeAppointmentModal();
            } else if (this.showUserModal) {
                this.closeUserModal();
            }
        }
    }

    // Appointment Search Logic
    aptSearchTerm: string = '';

    get filteredAppointments() {
        let result = this.appointments;

        if (this.aptSearchTerm) {
            const term = this.aptSearchTerm.toLowerCase();
            result = result.filter(apt => {
                const clientName = (apt.user?.name || apt.guestName || '').toLowerCase();
                const clientEmail = (apt.user?.email || apt.guestEmail || '').toLowerCase();
                const barberName = (apt.barber?.name || '').toLowerCase();
                return clientName.includes(term) || clientEmail.includes(term) || barberName.includes(term);
            });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return result.sort((a, b) => {
            const dateA = new Date(a.startTime);
            const dateB = new Date(b.startTime);

            // 1. Identify "Today"
            const isTodayA = dateA >= today && dateA < tomorrow;
            const isTodayB = dateB >= today && dateB < tomorrow;

            if (isTodayA && !isTodayB) return -1; // A is Today, put first
            if (!isTodayA && isTodayB) return 1;  // B is Today, put first

            // 2. Identify "Future" vs "Past" (if neither is today)
            const isFutureA = dateA >= tomorrow;
            const isFutureB = dateB >= tomorrow;

            if (isFutureA && !isFutureB) return -1; // A is Future, B is Past -> A first
            if (!isFutureA && isFutureB) return 1;  // B is Future, A is Past -> B first

            // 3. Within same group (Both Today, Both Future, or Both Past) -> Chronological
            return dateA.getTime() - dateB.getTime();
        });
    }

    navigateToBooking() {
        this.router.navigate(['/booking']);
    }

    navigateToPos() {
        this.router.navigate(['/admin/pos']);
    }

    navigateToCash() {
        this.router.navigate(['/admin/cash']);
    }

    cancelAppointment(id: number): void {
        if (confirm('Are you sure you want to cancel this appointment?')) {
            this.appointmentService.cancelAppointment(id).subscribe({
                next: () => {
                    this.showSnackBar('Appointment cancelled successfully!');
                    this.loadAppointments();
                    this.loadStats();
                },
                error: err => {
                    console.error(err);
                    this.showSnackBar('Failed to cancel appointment.', 'error');
                }
            });
        }
    }

    // Unified User Logic / Staff Properties
    get staffMembers() {
        let staff = this.users.filter(u => u.role !== 'CLIENTE' && u.role !== 'USER');
        if (this.selectedRoleFilter !== 'ALL') {
            staff = staff.filter(u => u.role === this.selectedRoleFilter);
        }
        return staff;
    }

    get clients() {
        return this.users.filter(u => u.role === 'CLIENTE' || u.role === 'USER');
    }

    openUserModal() {
        this.isEditingUser = false;
        this.modalContext = 'staff';
        this.availableRoles = [...this.staffRoles];
        this.newUser = {
            id: null,
            name: '',
            email: '',
            password: '',
            phone: '',
            gender: '',
            role: 'BARBER',
            photoUrl: '',
            color: '#000000'
        };
        this.showUserModal = true;
        this.cdr.detectChanges();
    }

    openCreateClientModal() {
        this.isEditingUser = false;
        this.modalContext = 'client';
        this.availableRoles = ['CLIENTE'];
        this.newUser = {
            id: null,
            name: '',
            email: '',
            password: '',
            phone: '',
            gender: '',
            role: 'CLIENTE',
            photoUrl: '',
            color: '#000000'
        };
        this.showUserModal = true;
        this.cdr.detectChanges();
    }

    startEditUser(user: any) {
        this.isEditingUser = true;
        // Find if user has a barber profile to get color/photo
        const barberProfile = this.barbers.find(b => b.user?.id === user.id);

        if (user.role === 'CLIENTE' || user.role === 'USER') {
            this.modalContext = 'client';
            this.availableRoles = ['CLIENTE', 'USER'];
        } else {
            this.modalContext = 'staff';
            this.availableRoles = [...this.staffRoles];
        }

        this.newUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            password: '',
            phone: user.phone || '',
            gender: user.gender || '',
            role: user.role,
            photoUrl: barberProfile?.photoUrl || '',
            color: barberProfile?.color || '#000000'
        };
        this.showUserModal = true;
        this.cdr.detectChanges();
    }

    closeUserModal() {
        this.showUserModal = false;
        this.cdr.detectChanges();
    }

    saveUserForm() {
        if (!this.newUser.name || !this.newUser.email || (!this.isEditingUser && !this.newUser.password)) {
            this.showSnackBar('Please fill in all required fields.', 'warning');
            return;
        }

        const request = this.isEditingUser
            ? this.adminService.updateUser(this.newUser.id!, this.newUser)
            : this.adminService.saveUser(this.newUser);

        request.subscribe({
            next: () => {
                this.showSnackBar(this.isEditingUser ? 'Usuario actualizado exitosamente!' : 'Usuario creado exitosamente!');
                this.closeUserModal();
                this.cdr.detectChanges();
                this.loadUsers();
                this.loadBarbers();
                this.loadStats();
            },
            error: (err) => {
                console.error('Full Error Object:', err);
                let errorMessage = 'Error desconocido';
                if (err.error && typeof err.error === 'object') {
                    errorMessage = err.error.message || err.error.error || JSON.stringify(err.error);
                } else if (typeof err.error === 'string') {
                    errorMessage = err.error;
                } else {
                    errorMessage = err.message || err.statusText || errorMessage;
                }
                this.showSnackBar('Error al procesar: ' + errorMessage, 'error');
            }
        });
    }

    deleteUser(id: number): void {
        if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            this.adminService.deleteUser(id).subscribe({
                next: () => {
                    this.showSnackBar('User deleted successfully!');
                    this.loadUsers();
                    this.loadBarbers();
                    this.loadStats();
                },
                error: (err) => this.showSnackBar('Failed to delete user.', 'error')
            });
        }
    }

    toggleBarberStatus(user: any) {
        const barber = this.barbers.find(b => b.user?.id === user.id);
        if (!barber) {
            this.showSnackBar('Solo se puede desactivar a Barberos (User Active Removed).', 'warning');
            return;
        }

        const newStatus = !barber.active;
        const oldStatus = barber.active;
        barber.active = newStatus;
        this.activeBarbersCount = this.barbers.filter(b => b.active).length;

        this.adminService.toggleBarberStatus(barber.id).subscribe({
            next: (res) => {
                const statusText = newStatus ? 'ACTIVADO' : 'DESACTIVADO';
                this.showSnackBar(`Barbero ${user.name} ${statusText} correctamente.`);
            },
            error: (err) => {
                console.error('Error toggling barber status', err);
                barber.active = oldStatus;
                this.activeBarbersCount = this.barbers.filter(b => b.active).length;
                this.showSnackBar(`Error actualizando estado.`, 'error');
            }
        });
    }

    onFileSelected(event: any) {
        const file: File = event.target.files[0];
        if (file) {
            // 1. Instant Preview
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.newUser.photoUrl = e.target.result; // Show local base64 immediately
                this.cdr.detectChanges();
            };
            reader.readAsDataURL(file);

            // 2. Background Upload
            this.showSnackBar('Subiendo imagen en segundo plano...', 'warning');
            this.adminService.uploadPhoto(file).subscribe({
                next: (res: any) => {
                    this.newUser.photoUrl = res.url; // Replace with Server URL
                    this.showSnackBar('Imagen guardada correctamente.');
                },
                error: (err) => {
                    console.error('Upload Error', err);
                    this.showSnackBar('Error subiendo imagen.', 'error');
                }
            });
        }
    }

    isBarberActive(user: any): boolean {
        const barber = this.barbers.find(b => b.user?.id === user.id);
        return barber ? barber.active : true;
    }

    isBarber(user: any): boolean {
        return user.role === 'BARBER';
    }

    private showSnackBar(message: string, type: 'success' | 'error' | 'warning' = 'success') {
        this.snackBar.open(message, 'Close', {
            duration: 3000,
            panelClass: type === 'error' ? ['red-snackbar'] : (type === 'warning' ? ['orange-snackbar'] : ['green-snackbar']),
            horizontalPosition: 'right',
            verticalPosition: 'top'
        });
    }

    crmSearchTerm = '';

    get uniqueClients() {
        if (!this.users) return [];
        const clients = this.users.filter(u => u.role === 'USER' || u.role === 'CLIENTE')
            .map(u => ({
                id: u.id,
                name: u.name,
                email: u.email,
                phone: u.phone,
                gender: u.gender,
                age: u.age,
                observations: u.observations,
                appointments: [] as any[]
            }));

        if (this.appointments) {
            this.appointments.forEach(apt => {
                const clientId = apt.user?.id;
                const clientEmail = apt.clientEmail || apt.guestEmail || apt.user?.email;
                const client = clients.find(c => c.id === clientId) || clients.find(c => c.email === clientEmail);
                if (client) {
                    client.appointments.push(apt);
                }
            });
        }

        let result = clients;
        if (this.crmSearchTerm) {
            const term = this.crmSearchTerm.toLowerCase();
            result = result.filter(c =>
                (c.name && c.name.toLowerCase().includes(term)) ||
                (c.email && c.email.toLowerCase().includes(term))
            );
        }
        return result;
    }

    trackByClient(index: number, item: any): any {
        return item.id || item.email;
    }

    viewClientHistory(client: any) {

        setTimeout(() => {
            const dialogRef = this.dialog.open(ClientDossierModalComponent, {
                width: '900px',
                maxWidth: '95vw',
                panelClass: 'lux-dialog-panel',
                backdropClass: 'lux-dialog-backdrop',
                data: {
                    client: client,
                    appointments: client.appointments
                }
            });

            // Force rendering of the dialog
            this.cdr.detectChanges();

            dialogRef.afterClosed().subscribe(result => {
                // Refresh data to ensure next open is fresh
                this.loadUsers();
                this.loadAppointments();

                if (result?.action === 'edit') {
                    this.startEditUser(result.client);
                }
            });
        }, 10);
    }



    onTabChange(event: MatTabChangeEvent) {
        this.loadStats();
        if (event.index === 0) {
            this.loadAppointments();
        } else if (event.index === 1) {
            this.loadUsers();
            this.loadBarbers();
        } else if (event.index === 2) {
            this.loadUsers();
            this.loadAppointments();
        }
    }
}
