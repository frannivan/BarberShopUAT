import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

export interface DialogData {
    type: 'SERVICE' | 'PRODUCT' | 'PROMOTION';
    item?: any; // Existing item for edit, null for create
}

@Component({
    selector: 'app-article-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule
    ],
    templateUrl: './article-dialog.component.html',
    styles: [`
    .full-width { width: 100%; margin-bottom: 0.5rem; }
    .dialog-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .close-btn { margin-top: -10px; margin-right: -10px; }
    .color-picker-wrapper { display: flex; flex-direction: column; gap: 5px; }
    .color-input { width: 100%; height: 40px; border: none; cursor: pointer; }
  `]
})
export class ArticleDialogComponent implements OnInit {
    form: FormGroup;

    constructor(
        private fb: FormBuilder,
        public dialogRef: MatDialogRef<ArticleDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData
    ) {
        this.form = this.fb.group({
            id: [null],
            name: ['', Validators.required],
            description: [''],
            // Common fields that might be disabled based on type
            price: [0],
            stock: [0],
            imageUrl: [''],
            durationMinutes: [30],
            color: ['#000000'],
            discountPercentage: [0],
            validUntil: ['']
        });
    }

    ngOnInit(): void {
        this.setupForm();
        if (this.data.item) {
            const item = { ...this.data.item };
            if (item.validUntil) {
                // Parse "YYYY-MM-DD" to Date using "T00:00:00" to avoid timezone issues
                item.validUntil = new Date(item.validUntil + 'T00:00:00');
            }
            this.form.patchValue(item);
        }
    }

    setupForm() {
        const type = this.data.type;

        // Adjust validators based on type
        if (type === 'PRODUCT' || type === 'SERVICE') {
            this.form.get('price')?.setValidators([Validators.required, Validators.min(0)]);
        } else if (type === 'PROMOTION') {
            // Price is optional for promotions (they might use percentage instead)
            this.form.get('price')?.clearValidators();
        }

        if (type === 'PROMOTION') {
            // Both are optional, but ideally one should be provided
            this.form.get('discountPercentage')?.setValidators([Validators.min(0), Validators.max(100)]);
        }

        this.form.updateValueAndValidity();
    }

    getTitle(): string {
        switch (this.data.type) {
            case 'SERVICE': return 'Servicio';
            case 'PRODUCT': return 'Producto';
            case 'PROMOTION': return 'Promoción';
            default: return 'Artículo';
        }
    }

    onCancel(): void {
        this.dialogRef.close();
    }

    onSave(): void {
        if (this.form.valid) {
            const formData = { ...this.form.value };

            // Format Date to YYYY-MM-DD
            if (formData.validUntil && formData.validUntil instanceof Date) {
                formData.validUntil = formData.validUntil.toISOString().split('T')[0];
            }

            // Cleanup fields based on type
            if (this.data.type === 'SERVICE') {
                delete formData.stock;
                delete formData.imageUrl;
                delete formData.discountPercentage;
                delete formData.validUntil;
                delete formData.color;
            } else if (this.data.type === 'PRODUCT') {
                delete formData.durationMinutes;
                delete formData.color;
                delete formData.discountPercentage;
                delete formData.validUntil;
            } else if (this.data.type === 'PROMOTION') {
                delete formData.stock;
                delete formData.imageUrl;
                delete formData.durationMinutes;
                delete formData.color;
            }

            this.dialogRef.close(formData);
        }
    }
}
