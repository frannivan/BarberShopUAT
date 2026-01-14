import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Promotion {
    id?: number;
    name: string;
    description?: string;
    discountPercentage: number;
    price?: number;
    validUntil?: string; // ISO Date string
    type?: 'PROMOTION'; // Helper
}

@Injectable({
    providedIn: 'root'
})
export class PromotionService {
    private apiUrl = environment.apiUrl + '/promotions';

    constructor(private http: HttpClient) { }

    getAllPromotions(): Observable<Promotion[]> {
        return this.http.get<Promotion[]>(this.apiUrl);
    }

    getPromotionById(id: number): Observable<Promotion> {
        return this.http.get<Promotion>(`${this.apiUrl}/${id}`);
    }

    createPromotion(promotion: Promotion): Observable<Promotion> {
        return this.http.post<Promotion>(this.apiUrl, promotion);
    }

    updatePromotion(id: number, promotion: Promotion): Observable<Promotion> {
        return this.http.put<Promotion>(`${this.apiUrl}/${id}`, promotion);
    }

    deletePromotion(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
}
