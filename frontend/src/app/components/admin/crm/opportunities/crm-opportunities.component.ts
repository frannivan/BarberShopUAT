import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CRMService } from '../../../../services/crm.service';

@Component({
  selector: 'app-crm-opportunities',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, FormsModule],
  template: `
    <div class="crm-page animate-fade-in">
      <div class="header-section mb-5">
        <div class="d-flex justify-content-between align-items-end">
          <div>
            <h1 class="font-weight-bold mb-1">Oportunidades Avanzadas</h1>
            <p class="text-muted">Seguimiento de cierres y valor proyectado</p>
          </div>
          <div class="stats-badge success shadow-sm">
            <span class="count">{{ opportunities.length }}</span>
            <span class="label">Oportunidades Activas</span>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col-xl-4 col-md-6 mb-4" *ngFor="let opp of opportunities">
          <div class="premium-card shadow-hover animate-slide-up">
            <div class="card-glow"></div>
            <div class="status-ribbon" [ngClass]="opp.status">{{ opp.status }}</div>
            
            <div class="card-content p-4">
              <div class="customer-info mb-3">
                <div class="avatar-sm mr-3">
                  <i class="fas fa-user-circle"></i>
                </div>
                <div>
                  <h5 class="mb-0 font-weight-bold">{{ opp.lead?.name }}</h5>
                  <small class="text-primary">{{ opp.serviceType?.name }}</small>
                </div>
              </div>

              <div class="value-strip mb-4">
                <div class="d-flex justify-content-between align-items-center">
                  <span class="text-muted small">VALOR ESTIMADO</span>
                  <span class="price-text">{{ (opp.estimatedValue || 0) | currency }}</span>
                </div>
              </div>

              <div class="form-group mb-4">
                <label class="small font-weight-bold text-muted uppercase">Notas de Seguimiento</label>
                <textarea 
                  class="modern-textarea" 
                  rows="3" 
                  [(ngModel)]="opp.followUpNotes" 
                  placeholder="Detalles del avance..."></textarea>
              </div>

              <div class="action-bar d-flex justify-content-between align-items-center">
                <button class="btn-save" (click)="saveOpp(opp)">
                  <i class="fas fa-check mr-2"></i> Actualizar
                </button>
                <div class="status-actions">
                  <button class="btn-action won" (click)="updateStatus(opp, 'WON')" title="Ganada">
                    <i class="fas fa-trophy"></i>
                  </button>
                  <button class="btn-action lost" (click)="updateStatus(opp, 'LOST')" title="Perdida">
                    <i class="fas fa-times-circle"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="opportunities.length === 0" class="empty-placeholder text-center py-5">
        <div class="glass-icon mb-3">
          <i class="fas fa-search-dollar"></i>
        </div>
        <h3>No hay oportunidades activas</h3>
        <p class="text-muted">Convierte un prospecto para comenzar el seguimiento.</p>
      </div>
    </div>
  `,
  styles: [`
    .crm-page { padding: 3rem; background: #fafafa; min-height: 100vh; }
    .animate-fade-in { animation: fadeIn 0.8s ease-out; }
    .animate-slide-up { animation: slideUp 0.5s ease-out both; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

    .header-section h1 { font-size: 2.8rem; letter-spacing: -1.5px; color: #111; }
    .stats-badge.success { background: #059669; border-radius: 20px; color: white; padding: 15px 30px; text-align: center; }
    .stats-badge .count { font-size: 1.8rem; font-weight: 900; display: block; }
    .stats-badge .label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.9; }

    .premium-card { 
      background: white; border-radius: 30px; overflow: hidden; position: relative;
      border: 1px solid rgba(0,0,0,0.03); transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .premium-card:hover { transform: translateY(-10px); box-shadow: 0 20px 40px rgba(0,0,0,0.08); }
    
    .status-ribbon {
      position: absolute; top: 20px; right: -35px; width: 140px; transform: rotate(45deg);
      text-align: center; font-size: 0.65rem; font-weight: 800; text-transform: uppercase;
      padding: 4px 0; color: white; letter-spacing: 1px; z-index: 2;
    }
    .status-ribbon.PENDING_APPOINTMENT { background: #6366f1; }
    .status-ribbon.WON { background: #10b981; }

    .customer-info { display: flex; align-items: center; }
    .avatar-sm i { font-size: 2.5rem; color: #ddd; }
    
    .value-strip { background: #f8fafc; padding: 15px; border-radius: 18px; }
    .price-text { font-size: 1.4rem; font-weight: 800; color: #1e293b; }

    .modern-textarea {
      width: 100%; border: 1px solid #e2e8f0; border-radius: 15px; padding: 12px;
      font-size: 0.9rem; transition: all 0.3s; resize: none; background: #fff;
    }
    .modern-textarea:focus { border-color: #6366f1; outline: none; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1); }

    .btn-save {
      background: #111; color: white; border: none; padding: 10px 20px;
      border-radius: 14px; font-weight: 700; font-size: 0.85rem; transition: all 0.3s;
    }
    .btn-save:hover { background: #333; }

    .status-actions { display: flex; gap: 10px; }
    .btn-action { width: 38px; height: 38px; border-radius: 12px; border: none; font-size: 1rem; color: white; transition: all 0.2s; }
    .btn-action.won { background: #10b981; }
    .btn-action.lost { background: #ef4444; }
    .btn-action:hover { transform: scale(1.1); filter: brightness(1.1); }

    .empty-placeholder { color: #cbd5e1; }
    .glass-icon i { font-size: 5rem; opacity: 0.2; }
    `]
})
export class AdminCrmOpportunitiesComponent implements OnInit {
  opportunities: any[] = [];
  private crmService = inject(CRMService);

  ngOnInit(): void {
    this.loadOpps();
  }

  loadOpps() {
    this.crmService.getAllOpportunities().subscribe({
      next: (data) => this.opportunities = data,
      error: (err) => console.error('Error loading opportunities', err)
    });
  }

  saveOpp(opp: any) {
    this.crmService.updateOpportunity(opp.id, opp).subscribe({
      next: () => alert('Actualizado correctamente'),
      error: (err) => alert('Error al actualizar')
    });
  }

  updateStatus(opp: any, status: string) {
    opp.status = status;
    this.saveOpp(opp);
  }
}
