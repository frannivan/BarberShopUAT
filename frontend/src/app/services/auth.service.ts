import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StorageService } from './storage.service';

import { environment } from '../../environments/environment';

const AUTH_API = `${environment.apiUrl}/auth/`;

const httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    constructor(private http: HttpClient, private storageService: StorageService) { }

    login(credentials: any): Observable<any> {
        return this.http.post(AUTH_API + 'signin', {
            email: credentials.email,
            password: credentials.password
        }, httpOptions);
    }

    register(user: any): Observable<any> {
        return this.http.post(AUTH_API + 'signup', {
            name: user.name,
            email: user.email,
            password: user.password,
            role: user.role
        }, httpOptions);
    }

    getUsers(): Observable<any[]> {
        return this.http.get<any[]>(AUTH_API + 'users');
    }

    deleteUser(id: number): Observable<any> {
        return this.http.delete(AUTH_API + 'users/' + id);
    }

    isLoggedIn(): boolean {
        return !!this.storageService.getUser()?.token;
    }

    isAdmin(): boolean {
        const user = this.storageService.getUser();
        if (!user || !user.roles) {
            return false;
        }
        return user.roles.includes('ADMIN') || user.roles.includes('ROLE_ADMIN');
    }
}
