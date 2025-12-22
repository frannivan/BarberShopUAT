import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { BookingComponent } from './components/booking/booking.component';
import { UserAppointmentsComponent } from './components/user-appointments/user-appointments.component';
import { BarberDashboardComponent } from './components/barber-dashboard/barber-dashboard.component';
import { SimpleBookingComponent } from './components/simple-booking/simple-booking.component';
import { HomeComponent } from './components/home/home.component';
import { AppointmentListComponent } from './components/appointment-list/appointment-list.component';
import { UserManagementComponent } from './components/user-management/user-management.component';
import { authGuard, adminGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'booking', component: BookingComponent, canActivate: [authGuard] }, // Calendar View
    { path: 'booking/list', component: AppointmentListComponent, canActivate: [authGuard] }, // List View
    { path: 'my-appointments', component: UserAppointmentsComponent, canActivate: [authGuard] },
    { path: 'admin', component: BarberDashboardComponent, canActivate: [adminGuard] },
    { path: 'user-management', component: UserManagementComponent, canActivate: [adminGuard] },
    { path: 'book/:barberId', component: SimpleBookingComponent },
    { path: 'home', component: HomeComponent },
    { path: '', redirectTo: '/home', pathMatch: 'full' }
];
