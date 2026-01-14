import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-withdrawal-dialog',
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
        <h2 mat-dialog-title>Registrar Retiro de Caja</h2>
        <div mat-dialog-content>
            <form #f="ngForm">
                <mat-form-field appearance="outline" class="w-100 mb-2">
                    <mat-label>Monto</mat-label>
                    <input matInput type="number" [(ngModel)]="data.amount" name="amount" required min="0.01">
                    <span matPrefix>$&nbsp;</span>
                </mat-form-field>
                <mat-form-field appearance="outline" class="w-100">
                    <mat-label>Descripción / Motivo</mat-label>
                    <textarea matInput [(ngModel)]="data.description" name="description" required rows="3" placeholder="Ej: Pago de Luz"></textarea>
                </mat-form-field>
            </form>
        </div>
        <div mat-dialog-actions align="end">
            <button mat-button (click)="onCancel()">Cancelar</button>
            <button mat-flat-button color="warn" [disabled]="!f.valid" (click)="onSave()">Registrar Retiro</button>
        </div>
    `,
    styles: ['.w-100 { width: 100%; }', '.mb-2 { margin-bottom: 0.5rem; }']
})
export class WithdrawalDialogComponent {
    data = { amount: null, description: '' };

    constructor(public dialogRef: MatDialogRef<WithdrawalDialogComponent>) { }

    onCancel(): void {
        this.dialogRef.close();
    }

    onSave(): void {
        this.dialogRef.close(this.data);
    }
}
