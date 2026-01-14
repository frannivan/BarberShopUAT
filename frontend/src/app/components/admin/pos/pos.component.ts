import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { PosService } from './pos.service';
import { ServiceTypeService } from '../../../services/service-type.service';
import { AppointmentService } from '../../../services/appointment.service';
import { ProductService } from '../../../services/product.service';
import { PromotionService } from '../../../services/promotion.service';
import { Observable, forkJoin } from 'rxjs';
import { Router } from '@angular/router';

@Component({
    selector: 'app-pos',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatIconModule,
        MatInputModule,
        MatFormFieldModule,
        MatSelectModule,
        MatButtonModule,
        MatSnackBarModule
    ],
    templateUrl: './pos.component.html',
    styleUrls: ['./pos.component.css']
})
export class PointOfSaleComponent implements OnInit {
    categories = ['Servicios', 'Productos', 'Promociones', 'Citas'];
    selectedCategory = 'Servicios';

    // All available items loaded from backend
    services: any[] = [];
    products: any[] = [];
    promotions: any[] = []; // Real Promotions
    appointments: any[] = [];

    // Items currently displayed in grid
    filteredGridItems: any[] = [];

    // Cart streams
    cartItems$: Observable<any[]>;
    cartTotal$: Observable<number>;

    // Barbers for selection
    barbers: any[] = [];

    // Checkout Modal State
    showCheckoutModal = false;
    paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' = 'CASH';
    amountReceived: number = 0;
    changeAmount: number = 0;

    constructor(
        private posService: PosService,
        private serviceTypeService: ServiceTypeService,
        private appointmentService: AppointmentService,
        private productService: ProductService,
        private promotionService: PromotionService,
        private snackBar: MatSnackBar,
        private router: Router
    ) {
        this.cartItems$ = this.posService.cartItems$;
        this.cartTotal$ = this.posService.cartTotal$;
    }

    ngOnInit(): void {
        this.loadInitialData();
    }

    loadInitialData() {
        // 1. Load Services
        this.serviceTypeService.getAllTypes().subscribe({
            next: (data) => {
                this.services = data.map(s => ({
                    id: s.id,
                    name: s.name,
                    price: s.price,
                    type: 'SERVICE',
                    icon: 'spa'
                }));

                // Initial grid load
                if (this.selectedCategory === 'Servicios') {
                    this.filteredGridItems = [...this.services];
                }
            },
            error: (err) => console.error('Error loading services', err)
        });

        // 2. Load Barbers
        this.posService.getActiveBarbers().subscribe({
            next: (data) => {
                this.barbers = data;
            },
            error: (err) => console.error('Error loading barbers', err)
        });

        // 3. Load POS Appointments (Today)
        this.posService.getTodayAppointments().subscribe({
            next: (data) => {
                this.appointments = data.map(appt => ({
                    id: appt.appointmentType?.id || 999,
                    appointmentId: appt.id,
                    name: (appt.clientName || appt.guestName || 'Cliente') + ' - ' + (appt.appointmentType?.name || 'Cita'),
                    price: appt.appointmentType?.price || 0,
                    type: 'SERVICE',
                    icon: 'event_available',
                    barberId: appt.barber?.id,
                    displayTime: new Date(appt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    clientName: appt.clientName || appt.guestName || 'Sin Nombre',
                    serviceName: appt.appointmentType?.name || 'Servicio General',
                    detailedStatus: appt.status,
                    isPaid: appt.status === 'COMPLETED',
                    barberName: appt.barber?.name || 'Sin Asignar'
                }));
            },
            error: (err) => console.error('Error loading appointments', err)
        });

        // 4. Load Products (Real)
        this.productService.getAllProducts().subscribe({
            next: (data) => {
                this.products = data.map(p => ({
                    id: p.id,
                    name: p.name,
                    price: p.price,
                    type: 'PRODUCT',
                    icon: 'invert_colors'
                }));
            },
            error: (err) => console.error('Error loading products', err)
        });

        // 5. Load Promotions
        this.promotionService.getAllPromotions().subscribe({
            next: (data) => {
                this.promotions = data.map(p => ({
                    id: p.id,
                    name: p.name,
                    price: p.price,
                    discountPercentage: p.discountPercentage,
                    isDynamic: !!p.discountPercentage && (!p.price || p.price === 0),
                    type: 'PROMOTION',
                    icon: 'local_offer'
                }));
                // If currently on promotions tab, refresh grid
                if (this.selectedCategory === 'Promociones') {
                    this.filteredGridItems = [...this.promotions];
                }
            },
            error: (err) => console.error('Error loading promotions', err)
        });
    }

    selectCategory(index: number) {
        this.selectedCategory = this.categories[index];
        if (index === 0) {
            this.filteredGridItems = [...this.services];
        } else if (index === 1) {
            this.filteredGridItems = [...this.products];
        } else if (index === 2) {
            this.filteredGridItems = [...this.promotions];
        } else if (index === 3) {
            this.filteredGridItems = [...this.appointments];
        } else {
            this.filteredGridItems = [];
        }
    }

    addToCart(item: any) {
        this.posService.addToCart(item);
    }

    removeFromCart(id: number) {
        this.posService.removeFromCart(id);
    }

    clearCart() {
        this.posService.clearCart();
    }

    assignProfessional(itemId: number, barberId: number) {
        this.posService.updateItemBarber(itemId, barberId);
    }

    navigateToCash() {
        this.router.navigate(['/admin/cash']);
    }

    // --- CHECKOUT FLOW ---

    processPayment() {
        this.showCheckoutModal = true;
        this.amountReceived = 0;
        this.changeAmount = 0;
    }

    closeCheckoutModal() {
        this.showCheckoutModal = false;
    }

    calculateChange() {
        let total = 0;
        const sub = this.cartTotal$.subscribe(t => total = t);
        sub.unsubscribe();

        if (this.amountReceived >= total) {
            this.changeAmount = this.amountReceived - total;
        } else {
            this.changeAmount = -1; // Indication of insufficient funds
        }
    }

    confirmSale() {
        this.posService.processCheckout(this.paymentMethod).subscribe({
            next: (sale) => {
                this.snackBar.open('Venta registrada con éxito', 'Cerrar', { duration: 3000 });

                // Update status of paid appointments
                const cartItems = this.posService.getCurrentCartItems();
                const updateReqs: Observable<any>[] = [];

                cartItems.forEach(item => {
                    if (item.appointmentId) {
                        updateReqs.push(
                            this.appointmentService.updateAppointment(item.appointmentId, { status: 'COMPLETED' })
                        );
                    }
                });

                if (updateReqs.length > 0) {
                    forkJoin(updateReqs).subscribe({
                        next: () => {
                            console.log('All appointments updated.');
                            this.finalizeSaleAndRefresh();
                        },
                        error: (err) => {
                            console.error('Error updating some appointments', err);
                            this.finalizeSaleAndRefresh();
                        }
                    });
                } else {
                    this.finalizeSaleAndRefresh();
                }
            },
            error: (err) => {
                console.error('Sale error', err);
                const errorMsg = err.error?.message || err.error?.error || err.message || 'Error desconocido';
                this.snackBar.open('Error al registrar venta: ' + errorMsg, 'Cerrar', { duration: 5000 });
            }
        });
    }

    finalizeSaleAndRefresh() {
        this.posService.clearCart();
        this.closeCheckoutModal();
        this.loadInitialData(); // Refresh lists
    }
}
