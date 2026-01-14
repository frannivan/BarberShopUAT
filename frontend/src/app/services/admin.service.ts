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

    saveUser(user: any): Observable<any> {
        return this.http.post(API_URL + 'users', user, { headers: this.getHeaders() });
    }

    updateUser(id: number, user: any): Observable<any> {
        return this.http.put(API_URL + 'users/' + id, user, { headers: this.getHeaders() });
    }

    deleteUser(id: number): Observable<any> {
        return this.http.delete(API_URL + 'users/' + id, { headers: this.getHeaders() });
    }

    toggleBarberStatus(id: number): Observable<any> {
        return this.http.put(`${environment.apiUrl}/barbers/${id}/status`, {}, { headers: this.getHeaders() });
    }

    uploadPhoto(file: File): Observable<any> {
        const formData: FormData = new FormData();
        formData.append('file', file);
        return this.http.post(`${environment.apiUrl}/uploads`, formData, { headers: this.getHeaders() });
    }
}

