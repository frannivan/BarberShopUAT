import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms'; // Template driven for simple dialogs? or Reactive

import { CashService, CashRegisterState, CashTransaction } from '../../../services/cash.service';
import { WithdrawalDialogComponent } from './withdrawal-dialog/withdrawal-dialog.component';
import { CashCutDialogComponent } from './cash-cut-dialog/cash-cut-dialog.component';

@Component({
    selector: 'app-cash-register',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatTableModule,
        MatDialogModule,
        MatSnackBarModule
    ],
    templateUrl: './cash-register.component.html',
    styleUrls: ['./cash-register.component.css']
})
export class CashRegisterComponent implements OnInit {
    state: CashRegisterState | null = null;
    history: CashTransaction[] = [];
    displayedColumns: string[] = ['date', 'type', 'description', 'user', 'amount', 'actions'];

    constructor(
        private cashService: CashService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit(): void {
        this.loadData();
    }

    loadData() {
        this.cashService.getBalance().subscribe({
            next: (data) => this.state = data,
            error: (e) => console.error('Error loading balance', e)
        });

        this.cashService.getHistory().subscribe({
            next: (data) => this.history = data,
            error: (e) => console.error('Error loading history', e)
        });
    }

    openWithdrawalDialog() {
        const dialogRef = this.dialog.open(WithdrawalDialogComponent, {
            width: '400px'
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.cashService.registerWithdrawal(result).subscribe({
                    next: () => {
                        this.snackBar.open('Retiro registrado', 'Ok', { duration: 2000 });
                        this.loadData();
                    },
                    error: () => this.snackBar.open('Error al registrar retiro', 'Cerrar')
                });
            }
        });
    }

    openCutDialog() {
        if (!this.state) return;

        const dialogRef = this.dialog.open(CashCutDialogComponent, {
            width: '500px',
            data: { expectedAmount: this.state.cashBalance }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.cashService.performCut(result).subscribe({
                    next: () => {
                        this.snackBar.open('Corte de caja realizado exitosamente', 'Ok', { duration: 3000 });
                        this.loadData();
                    },
                    error: () => this.snackBar.open('Error al realizar corte', 'Cerrar')
                });
            }
        });
    }

    printTicket(transaction: CashTransaction) {
        // Implement printing logic here
        // Usually reroute to a printable text view or open a popup
        console.log('Printing ticket for', transaction.id);

        // Simple mock print for now or integration with POS print service
        const content = `
        TICKET #${transaction.id}
        Fecha: ${new Date(transaction.date).toLocaleString()}
        Tipo: ${transaction.type}
        --------------------------------
        ${transaction.description}
        --------------------------------
        TOTAL: $${transaction.amount}
        --------------------------------
        Atendido por: ${transaction.user}
        `;

        // Create a hidden window or iframe later. For now, just alert or consistent log.
        // Or reuse the POS ticket printer logic.
        this.snackBar.open('Imprimiendo ticket...', 'Ok', { duration: 1000 });
    }

    printFullReport() {
        if (!this.state || !this.history) return;

        const dateStr = new Date().toLocaleString();
        let report = `
========================================
       REPORTE DE CORTE DE CAJA
========================================
Fecha: ${dateStr}
Último Corte: ${this.state.lastCutDate ? new Date(this.state.lastCutDate).toLocaleString() : 'N/A'}
----------------------------------------
RESUMEN DE SALDOS:
Efectivo en Caja:    $${this.state.cashBalance.toFixed(2)}
Total Ingresos:      $${this.state.totalRevenue.toFixed(2)}
Total Retiros:       $${this.state.totalWithdrawals.toFixed(2)}
----------------------------------------
HISTORIAL DE MOVIMIENTOS:
`;

        this.history.forEach(t => {
            const time = new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const type = t.type === 'SALE' ? '[VENTA]  ' : '[RETIRO] ';
            report += `${time} ${type} $${t.amount.toFixed(2).toString().padStart(8)}
    ${t.description}
    Usuario: ${t.user}
----------------------------------------
`;
        });

        report += `\nFin del Reporte\n========================================`;

        console.log(report);

        // Open in new window for printing
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write('<pre style="font-family: monospace; font-size: 12px; padding: 20px;">' + report + '</pre>');
            printWindow.document.close();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        }

        this.snackBar.open('Generando reporte técnico...', 'Ok', { duration: 2000 });
    }
}
