import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-cash-cut-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule
    ],
    template: `
        <h2 mat-dialog-title>Realizar Corte de Caja</h2>
        <div mat-dialog-content>
            <div class="alert alert-info">
                <strong>Balance Calculado por Sistema:</strong> {{ expectedAmount | currency }}
            </div>
            <p>Por favor cuenta el dinero físico en la caja e ingrésalo para validación.</p>
            
            <form #f="ngForm">
                <mat-form-field appearance="outline" class="w-100 mb-2">
                    <mat-label>Monto Real (Contado)</mat-label>
                    <input matInput type="number" [(ngModel)]="data.totalActualAmount" name="actualAmount" required min="0">
                    <span matPrefix>$&nbsp;</span>
                </mat-form-field>
                <mat-form-field appearance="outline" class="w-100">
                    <mat-label>Notas / Observaciones</mat-label>
                    <textarea matInput [(ngModel)]="data.notes" name="notes" rows="3"></textarea>
                </mat-form-field>

                <div *ngIf="data.totalActualAmount !== null && data.totalActualAmount !== expectedAmount" class="alert alert-warning mt-2">
                    <small>Diferencia: {{ (data.totalActualAmount - expectedAmount) | currency }}</small>
                </div>
            </form>
        </div>
        <div mat-dialog-actions align="end">
            <button mat-button (click)="onCancel()">Cancelar</button>
            <button mat-flat-button color="primary" [disabled]="!f.valid" (click)="onSave()">Confirmar Corte y Resetear</button>
        </div>
    `,
    styles: [
        '.w-100 { width: 100%; }',
        '.mb-2 { margin-bottom: 0.5rem; }',
        '.alert { padding: 10px; border-radius: 4px; border: 1px solid transparent; margin-bottom: 1rem; }',
        '.alert-info { background-color: #e3f2fd; color: #0d47a1; border-color: #bbdefb; }',
        '.alert-warning { background-color: #fff3e0; color: #e65100; border-color: #ffe0b2; }'
    ]
})
export class CashCutDialogComponent {
    expectedAmount: number = 0;
    data = { totalActualAmount: null, notes: '' };

    constructor(
        public dialogRef: MatDialogRef<CashCutDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public inputData: any
    ) {
        if (inputData && inputData.expectedAmount) {
            this.expectedAmount = inputData.expectedAmount;
            // Pre-fill actual amount for convenience? No, force them to count.
        }
    }

    onCancel(): void {
        this.dialogRef.close();
    }

    onSave(): void {
        this.dialogRef.close(this.data);
    }
}
