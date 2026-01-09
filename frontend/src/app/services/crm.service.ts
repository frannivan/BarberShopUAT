import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const API_URL = environment.apiUrl + '/admin/crm/';

@Injectable({
    providedIn: 'root'
})
export class CRMService {
    private http = inject(HttpClient);

    constructor() { }

    getAllLeads(): Observable<any> {
        return this.http.get(API_URL + 'leads');
    }

    createLead(lead: any): Observable<any> {
        // Lead creation is PUBLIC, but we'll use the original path or keep it here
        // Usually creation comes from chatbot which doesn't have admin access.
        // Let's check environment.apiUrl + '/crm/leads' for public creation.
        return this.http.post(environment.apiUrl + '/crm/leads', lead);
    }

    convertLeadToOpportunity(leadId: number, serviceTypeId: number): Observable<any> {
        return this.http.post(`${API_URL}leads/${leadId}/convert?serviceTypeId=${serviceTypeId}`, {});
    }

    getAllOpportunities(): Observable<any> {
        return this.http.get(API_URL + 'opportunities');
    }

    updateOpportunity(id: number, opportunity: any): Observable<any> {
        return this.http.put(API_URL + 'opportunities/' + id, opportunity);
    }

    updateLeadStatus(id: number, status: string): Observable<any> {
        return this.http.put(`${API_URL}leads/${id}/status?status=${status}`, {});
    }

    convertLeadToClient(id: number): Observable<any> {
        return this.http.post(`${API_URL}leads/${id}/convert-to-client`, {});
    }
}
