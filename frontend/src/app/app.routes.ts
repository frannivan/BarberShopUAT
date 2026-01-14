import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { BookingComponent } from './components/booking/booking.component';
import { UserAppointmentsComponent } from './components/user-appointments/user-appointments.component';
import { BarberDashboardComponent } from './components/barber-dashboard/barber-dashboard.component';
import { SimpleBookingComponent } from './components/simple-booking/simple-booking.component';
import { HomeComponent } from './components/home/home.component';
import { AdminComponent } from './components/admin/admin.component';
import { UserManagementComponent } from './components/user-management/user-management.component';
import { AdminCrmLeadsComponent } from './components/admin/crm/leads/crm-leads.component';
import { AdminCrmOpportunitiesComponent } from './components/admin/crm/opportunities/crm-opportunities.component';
import { authGuard, adminGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'booking', component: BookingComponent, canActivate: [authGuard] }, // Unified View
    { path: 'my-appointments', component: UserAppointmentsComponent, canActivate: [authGuard] },
    { path: 'admin', component: AdminComponent, canActivate: [adminGuard] }, // Main Admin Stats
    { path: 'barber-dashboard', component: BarberDashboardComponent, canActivate: [authGuard] }, // Individual Barber View
    { path: 'user-management', component: UserManagementComponent, canActivate: [adminGuard] },
    { path: 'admin/crm/leads', component: AdminCrmLeadsComponent, canActivate: [adminGuard] },
    { path: 'admin/crm/opportunities', component: AdminCrmOpportunitiesComponent, canActivate: [adminGuard] },
    { path: 'admin/pos', loadComponent: () => import('./components/admin/pos/pos.component').then(m => m.PointOfSaleComponent), canActivate: [adminGuard] },
    { path: 'admin/articles', loadComponent: () => import('./components/admin/articles/articles.component').then(m => m.ArticlesComponent), canActivate: [adminGuard] },
    { path: 'admin/cash', loadComponent: () => import('./components/admin/cash-register/cash-register.component').then(m => m.CashRegisterComponent), canActivate: [adminGuard] },
    { path: 'book/:barberId', component: SimpleBookingComponent },
    { path: 'home', component: HomeComponent },
    { path: '', redirectTo: '/home', pathMatch: 'full' }
];
