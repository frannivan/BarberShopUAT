import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StorageService } from './storage.service';

import { environment } from '../../environments/environment';

const API_URL = `${environment.apiUrl}/appointments`;

@Injectable({
    providedIn: 'root'
})
export class AppointmentService {
    constructor(private http: HttpClient, private storageService: StorageService) { }

    getAppointments(): Observable<any> {
        const user = this.storageService.getUser();
        const headers = new HttpHeaders({ 'Authorization': 'Bearer ' + user.token });
        return this.http.get(API_URL, { headers });
    }

    getBarberAppointments(barberId: number): Observable<any> {
        // Public endpoint - no auth required
        return this.http.get(API_URL + '/barber/' + barberId);
    }

    getAllAppointments(): Observable<any> {
        // Public endpoint for appointments viewer
        return this.http.get(API_URL + '/all');
    }

    createAppointment(appointment: any): Observable<any> {
        const user = this.storageService.getUser();
        if (user && user.token) {
            const headers = new HttpHeaders({ 'Authorization': 'Bearer ' + user.token });
            return this.http.post(API_URL, appointment, { headers });
        }
        // Public booking without auth
        return this.http.post(API_URL, appointment);
    }

    createPublicAppointment(appointment: any): Observable<any> {
        // For guest bookings - no auth token
        return this.http.post(API_URL, appointment);
    }

    getAvailableSlots(barberId: number, date: string): Observable<string[]> {
        return this.http.get<string[]>(`${API_URL}/available-slots?barberId=${barberId}&date=${date}`);
    }


    cancelAppointment(id: number): Observable<any> {
        const user = this.storageService.getUser();
        const headers = new HttpHeaders({ 'Authorization': 'Bearer ' + user.token });
        return this.http.delete(API_URL + '/' + id, { headers });
    }

    getMyBarberAppointments(): Observable<any> {
        const user = this.storageService.getUser();
        const headers = new HttpHeaders({ 'Authorization': 'Bearer ' + user.token });
        return this.http.get(API_URL + '/my-barber-appointments', { headers });
    }

    updateAppointment(id: number, appointment: any): Observable<any> {
        const user = this.storageService.getUser();
        const headers = new HttpHeaders({ 'Authorization': 'Bearer ' + user.token });
        return this.http.put(API_URL + '/' + id, appointment, { headers });
    }

    getAppointmentById(id: number): Observable<any> {
        const user = this.storageService.getUser();
        const headers = new HttpHeaders({ 'Authorization': 'Bearer ' + user.token });
        return this.http.get(API_URL + '/' + id, { headers });
    }
}

