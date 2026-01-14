import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CashWithdrawal {
    id?: number;
    amount: number;
    description: string;
    timestamp?: string;
    user?: string;
}

export interface CashRegisterState {
    cashBalance: number;
    totalRevenue: number;
    totalWithdrawals: number;
    lastCutDate?: string;
}

export interface CashTransaction {
    id: number;
    type: 'SALE' | 'WITHDRAWAL';
    amount: number;
    date: string;
    description: string;
    user: string;
    paymentMethod?: string; // Only for Sales
}

@Injectable({
    providedIn: 'root'
})
export class CashService {
    private apiUrl = `${environment.apiUrl}/cash`;

    constructor(private http: HttpClient) { }

    getBalance(): Observable<CashRegisterState> {
        return this.http.get<CashRegisterState>(`${this.apiUrl}/balance`);
    }

    getHistory(): Observable<CashTransaction[]> {
        return this.http.get<CashTransaction[]>(`${this.apiUrl}/history`);
    }

    registerWithdrawal(withdrawal: { amount: number, description: string }): Observable<any> {
        return this.http.post(`${this.apiUrl}/withdraw`, withdrawal);
    }

    performCut(data: { totalActualAmount: number, notes?: string }): Observable<any> {
        return this.http.post(`${this.apiUrl}/cut`, data);
    }
}
