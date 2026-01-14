import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface CartItem {
    id: number;
    name: string;
    price: number;
    quantity: number;
    subtotal: number;
    type: 'SERVICE' | 'PRODUCT' | 'PROMOTION';
    barberId?: number; // Professional credited
    appointmentId?: number; // Linked Appointment ID
    discountPercentage?: number;
    isDynamic?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class PosService {
    private apiUrl = environment.apiUrl + '/pos'; // e.g. /api/pos
    private usersUrl = environment.apiUrl + '/admin'; // for barbers

    private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
    public cartItems$ = this.cartItemsSubject.asObservable();

    private cartTotalSubject = new BehaviorSubject<number>(0);
    public cartTotal$ = this.cartTotalSubject.asObservable();

    constructor(private http: HttpClient) { }

    // --- CART ACTIONS ---

    addToCart(item: any) {
        const currentItems = this.cartItemsSubject.value;
        const existingItem = currentItems.find(i => i.id === item.id && i.type === item.type);

        if (existingItem && item.type !== 'PROMOTION') {
            existingItem.quantity++;
            existingItem.subtotal = existingItem.quantity * existingItem.price;
            this.cartItemsSubject.next([...currentItems]);
        } else {
            let itemPrice = item.price || 0;

            // If it's a promotion with percentage, calculate its value based on current total
            if (item.type === 'PROMOTION' && item.discountPercentage) {
                const currentTotal = this.cartTotalSubject.value;
                itemPrice = -(currentTotal * (item.discountPercentage / 100));
            } else if (item.type === 'PROMOTION' && item.price) {
                itemPrice = item.price; // Use fixed price (positive for packages, negative for fixed discounts)
            }

            const newItem: CartItem = {
                id: item.id,
                name: item.name,
                price: itemPrice,
                quantity: 1,
                subtotal: itemPrice,
                type: item.type || 'SERVICE',
                appointmentId: item.appointmentId,
                discountPercentage: item.discountPercentage,
                isDynamic: item.isDynamic
            };
            this.cartItemsSubject.next([...currentItems, newItem]);
        }
        this.calculateTotal();
    }

    removeFromCart(itemId: number) {
        const currentItems = this.cartItemsSubject.value.filter(i => i.id !== itemId);
        this.cartItemsSubject.next(currentItems);
        this.calculateTotal();
    }

    updateItemBarber(itemId: number, barberId: number) {
        const currentItems = this.cartItemsSubject.value;
        const item = currentItems.find(i => i.id === itemId);
        if (item) {
            item.barberId = barberId;
            this.cartItemsSubject.next([...currentItems]);
        }
    }

    clearCart() {
        this.cartItemsSubject.next([]);
        this.calculateTotal();
    }

    getCurrentCartItems(): CartItem[] {
        return this.cartItemsSubject.value;
    }

    private calculateTotal() {
        const currentItems = this.cartItemsSubject.value;

        // 1. Calculate subtotal of non-dynamic items (Services, Products, Fixed-Price Promos)
        const subtotalOfNormalItems = currentItems.reduce((acc, item) => {
            return item.isDynamic ? acc : acc + (item.price * item.quantity);
        }, 0);

        // 2. Update dynamic promotions
        currentItems.forEach(item => {
            if (item.isDynamic && item.discountPercentage) {
                item.price = -(subtotalOfNormalItems * (item.discountPercentage / 100));
                item.subtotal = item.price * item.quantity;
            } else {
                item.subtotal = item.price * item.quantity;
            }
        });

        // 3. Final Total
        const total = currentItems.reduce((acc, item) => acc + item.subtotal, 0);

        this.cartItemsSubject.next([...currentItems]);
        this.cartTotalSubject.next(total);
    }

    // --- API CALLS ---

    createSale(saleData: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/sales`, saleData);
    }

    getActiveBarbers(): Observable<any[]> {
        return this.http.get<any[]>(`${this.usersUrl}/barbers`);
    }

    getTodayAppointments(): Observable<any[]> {
        return this.http.get<any[]>(`${environment.apiUrl}/appointments/today`);
    }

    processCheckout(paymentMethod: string): Observable<any> {
        const items = this.cartItemsSubject.value.map(item => {
            const saleItem: any = {
                itemName: item.name,
                quantity: item.quantity,
                price: item.price,
                subtotal: item.subtotal
            };

            // Map to backend entity structure
            if (item.type === 'SERVICE') {
                saleItem.service = { id: item.id };
            } else if (item.type === 'PRODUCT') {
                saleItem.product = { id: item.id };
            } else if (item.type === 'PROMOTION') {
                // Since the backend 'SaleItem' doesn't have a promotion field, 
                // we send it as a simple item with negative price for now.
                // The itemName will already be "Promo: name"
            }

            // Assign barber if present (assuming backend 'creditedBarber' or similar)
            // If backend SaleItem has 'barber' field:
            if (item.barberId) {
                saleItem.barber = { id: item.barberId };
            }

            return saleItem;
        });

        const totalAmount = this.cartTotalSubject.value;

        const salePayload = {
            paymentMethod: paymentMethod,
            status: 'COMPLETED',
            totalAmount: totalAmount,
            items: items
        };

        return this.createSale(salePayload);
    }
}
