import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StorageService } from './storage.service';

import { environment } from '../../environments/environment';

const API_URL = `${environment.apiUrl}/admin/`;

@Injectable({
    providedIn: 'root'
})
export class AdminService {
    constructor(private http: HttpClient, private storageService: StorageService) { }

    private getHeaders(): HttpHeaders {
        const user = this.storageService.getUser();
        return new HttpHeaders({ 'Authorization': 'Bearer ' + user.token });
    }

    getStats(): Observable<any> {
        return this.http.get(API_URL + 'stats', { headers: this.getHeaders() });
    }

    getBarbers(): Observable<any> {
        return this.http.get(API_URL + 'barbers', { headers: this.getHeaders() });
    }

    createBarber(barber: any): Observable<any> {
        return this.http.post(API_URL + 'barbers', barber, { headers: this.getHeaders() });
    }

    createAdmin(admin: any): Observable<any> {
        return this.http.post(API_URL + 'admins', admin, { headers: this.getHeaders() });
    }
}

