import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule, MatTabChangeEvent } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ArticleDialogComponent } from './article-dialog/article-dialog.component';

// Services
import { ServiceTypeService } from '../../../services/service-type.service';
import { ProductService, Product } from '../../../services/product.service';
import { PromotionService, Promotion } from '../../../services/promotion.service';

@Component({
    selector: 'app-articles',
    standalone: true,
    imports: [
        CommonModule,
        MatTabsModule,
        MatButtonModule,
        MatIconModule,
        MatSnackBarModule,
        MatDialogModule
    ],
    templateUrl: './articles.component.html',
    styleUrls: ['./articles.component.css']
})
export class ArticlesComponent implements OnInit {
    selectedTabIndex = 0;

    services: any[] = [];
    products: Product[] = [];
    promotions: Promotion[] = [];

    constructor(
        private serviceTypeService: ServiceTypeService,
        private productService: ProductService,
        private promotionService: PromotionService,
        private snackBar: MatSnackBar,
        public dialog: MatDialog,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadAllData();
    }

    loadAllData() {
        this.loadServices();
        this.loadProducts();
        this.loadPromotions();
    }

    loadServices() {
        this.serviceTypeService.getAllTypes().subscribe({
            next: (data) => this.services = data,
            error: (e) => console.error('Error loading services', e)
        });
    }

    loadProducts() {
        this.productService.getAllProducts().subscribe({
            next: (data) => this.products = data,
            error: (e) => console.error('Error loading products', e)
        });
    }

    loadPromotions() {
        this.promotionService.getAllPromotions().subscribe({
            next: (data) => this.promotions = data,
            error: (e) => console.error('Error loading promotions', e)
        });
    }

    onTabChange(event: MatTabChangeEvent) {
        this.selectedTabIndex = event.index;
    }

    navigateToPos() {
        this.router.navigate(['/admin/pos']);
    }

    getCurrentTabName(): string {
        if (this.selectedTabIndex === 0) return 'Servicio';
        if (this.selectedTabIndex === 1) return 'Producto';
        return 'Promoción';
    }

    openCreateModal() {
        const type = this.getStartType();
        this.openDialog(type, null);
    }

    getStartType(): 'SERVICE' | 'PRODUCT' | 'PROMOTION' {
        if (this.selectedTabIndex === 0) return 'SERVICE';
        if (this.selectedTabIndex === 1) return 'PRODUCT';
        return 'PROMOTION';
    }

    openDialog(type: 'SERVICE' | 'PRODUCT' | 'PROMOTION', item: any) {
        const dialogRef = this.dialog.open(ArticleDialogComponent, {
            width: '500px',
            data: { type, item }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                if (item) {
                    // Update
                    this.handleUpdate(type, item.id, result);
                } else {
                    // Create
                    this.handleCreate(type, result);
                }
            }
        });
    }

    handleCreate(type: string, data: any) {
        if (type === 'SERVICE') {
            this.serviceTypeService.createType(data).subscribe({
                next: () => {
                    this.snackBar.open('Servicio creado', 'Ok', { duration: 2000 });
                    this.loadServices();
                },
                error: (e) => {
                    console.error('Error creating service:', e);
                    const msg = e.error?.message || 'Error al crear servicio';
                    this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
                }
            });
        } else if (type === 'PRODUCT') {
            this.productService.createProduct(data).subscribe({
                next: () => {
                    this.snackBar.open('Producto creado', 'Ok', { duration: 2000 });
                    this.loadProducts();
                },
                error: (e) => this.snackBar.open('Error al crear producto', 'Cerrar')
            });
        } else if (type === 'PROMOTION') {
            this.promotionService.createPromotion(data).subscribe({
                next: () => {
                    this.snackBar.open('Promoción creada', 'Ok', { duration: 2000 });
                    this.loadPromotions();
                },
                error: (e) => this.snackBar.open('Error al crear promoción', 'Cerrar')
            });
        }
    }

    handleUpdate(type: string, id: number, data: any) {
        if (type === 'SERVICE') {
            this.serviceTypeService.updateType(id, data).subscribe({
                next: () => {
                    this.snackBar.open('Servicio actualizado', 'Ok', { duration: 2000 });
                    this.loadServices();
                },
                error: (e) => this.snackBar.open('Error al actualizar servicio', 'Cerrar')
            });
        } else if (type === 'PRODUCT') {
            this.productService.updateProduct(id, data).subscribe({
                next: () => {
                    this.snackBar.open('Producto actualizado', 'Ok', { duration: 2000 });
                    this.loadProducts();
                },
                error: (e) => this.snackBar.open('Error al actualizar', 'Cerrar')
            });
        } else if (type === 'PROMOTION') {
            this.promotionService.updatePromotion(id, data).subscribe({
                next: () => {
                    this.snackBar.open('Promoción actualizada', 'Ok', { duration: 2000 });
                    this.loadPromotions();
                },
                error: (e) => this.snackBar.open('Error al actualizar', 'Cerrar')
            });
        }
    }

    editService(item: any) {
        this.openDialog('SERVICE', item);
    }

    editProduct(item: any) {
        this.openDialog('PRODUCT', item);
    }

    editPromotion(item: any) {
        this.openDialog('PROMOTION', item);
    }

    deleteService(item: any) {
        if (confirm(`¿Eliminar servicio ${item.name}?`)) {
            this.serviceTypeService.deleteType(item.id).subscribe({
                next: () => this.loadServices(),
                error: () => this.snackBar.open('Error al eliminar', 'Cerrar')
            });
        }
    }

    deleteProduct(item: any) {
        if (confirm(`¿Eliminar producto ${item.name}?`)) {
            this.productService.deleteProduct(item.id).subscribe({
                next: () => this.loadProducts(),
                error: () => this.snackBar.open('Error al eliminar', 'Cerrar')
            });
        }
    }

    deletePromotion(item: any) {
        if (confirm(`¿Eliminar promoción ${item.name}?`)) {
            this.promotionService.deletePromotion(item.id).subscribe({
                next: () => this.loadPromotions(),
                error: () => this.snackBar.open('Error al eliminar', 'Cerrar')
            });
        }
    }
}
