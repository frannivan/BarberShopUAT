import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

const API_URL = `${environment.apiUrl}/appointment-types`;

@Injectable({
    providedIn: 'root'
})
export class ServiceTypeService {

    constructor(private http: HttpClient) { }

    getAllTypes(): Observable<any[]> {
        return this.http.get<any[]>(API_URL);
    }

    createType(type: any): Observable<any> {
        return this.http.post(API_URL, type);
    }

    deleteType(id: number): Observable<any> {
        return this.http.delete(`${API_URL}/${id}`);
    }
}
