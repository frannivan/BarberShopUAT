import { Component, OnInit, ChangeDetectorRef, afterNextRender } from '@angular/core';
import { BarberService } from '../../services/barber.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatButtonModule, MatProgressSpinnerModule, RouterModule],
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
    barbers: any[] = [];
    loading = true;
    error: string | null = null;

    constructor(
        private barberService: BarberService,
        private cdr: ChangeDetectorRef
    ) {
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
