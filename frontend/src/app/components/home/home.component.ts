import { Component, OnInit, OnDestroy, ChangeDetectorRef, afterNextRender } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { BarberService } from '../../services/barber.service';

import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { ChatbotComponent } from '../chatbot/chatbot.component';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatButtonModule, MatProgressSpinnerModule, RouterModule, ChatbotComponent],
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
    private routerSubscription: Subscription | undefined;
    barbers: any[] = [];
    loading = true;
    error: string | null = null;

    constructor(
        private barberService: BarberService,
        private cdr: ChangeDetectorRef,
        private router: Router
    ) {
        // Force refresh when navigating to the same URL
        this.routerSubscription = this.router.events.pipe(
            filter(e => e instanceof NavigationEnd)
        ).subscribe(() => {
            this.loadBarbers();
        });
        // Ensure we load barbers after the view is fully rendered
        afterNextRender(() => {
            if (this.barbers.length === 0 && !this.loading) {
                this.loadBarbers();
            }
        });
    }

    ngOnInit(): void {
        this.loadBarbers();
    }

    ngOnDestroy(): void {
        if (this.routerSubscription) {
            this.routerSubscription.unsubscribe();
        }
    }

    loadBarbers(): void {
        this.loading = true;
        this.error = null;
        console.log('Loading barbers...');

        this.barberService.getBarbers().subscribe({
            next: data => {
                console.log('Barbers loaded:', data);
                this.barbers = data;
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: err => {
                console.error('Error loading barbers:', err);
                this.error = 'Failed to load barbers. Please try again.';
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }
}
