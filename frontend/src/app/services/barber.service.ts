import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

const API_URL = `${environment.apiUrl}/barbers`;

@Injectable({
    providedIn: 'root'
})
export class BarberService {
    constructor(private http: HttpClient) { }

    getBarbers(): Observable<any> {
        return this.http.get(API_URL);
    }

    getAllBarbersAdmin(): Observable<any> {
        return this.http.get(`${API_URL}/admin/all`);
    }

    toggleActive(id: number): Observable<any> {
        return this.http.put(`${API_URL}/${id}/status`, {});
    }
}
