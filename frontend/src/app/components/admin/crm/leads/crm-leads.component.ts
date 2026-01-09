import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CRMService } from '../../../../services/crm.service';

@Component({
  selector: 'app-crm-leads',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  template: `
    <div class="crm-page animate-fade-in">
      <div class="header-section mb-4">
        <div class="d-flex justify-content-between align-items-end">
          <div>
            <h1 class="page-title-text mb-1">Prospectos Dashboard</h1>
            <p class="text-subtitle subtitle">Gestión de potenciales clientes capturados por el Chatbot</p>
          </div>
          <div class="d-flex align-items-center gap-3">
             <div class="stats-badge-premium shadow-lg">
                <span class="count">{{ leads.length }}</span>
                <span class="label">Leads Totales</span>
             </div>
          </div>
        </div>
      </div>

      <div class="card-glass-light shadow-lg overflow-hidden">
        <div class="table-responsive">
          <table class="table mb-0 premium-crm-table">
            <thead>
              <tr>
                <th>PROSPECTO</th>
                <th>CONTACTO</th>
                <th>INTERÉS</th>
                <th>ORIGEN</th>
                <th>ESTADO</th>
                <th class="text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let lead of leads" class="lead-row" (click)="openLeadModal(lead)" style="cursor: pointer;">
                <td>
                  <div class="lead-name">{{ lead.name }}</div>
                  <small class="text-muted">{{ lead.createdAt | date:'short' }}</small>
                </td>
                <td>
                  <div class="contact-info">
                    <i class="fas fa-phone-alt mr-2 text-primary"></i>{{ lead.phone }}
                  </div>
                </td>
                <td><span class="interest-tag">{{ lead.interest }}</span></td>
                <td><span class="source-tag-premium">{{ lead.source }}</span></td>
                <td>
                  <span class="status-indicator-premium" [ngClass]="lead.status">
                    {{ lead.status === 'CONVERTED' ? 'NUEVO CLIENTE' : lead.status }}
                  </span>
                </td>
                <td class="text-right">
                  <button class="btn-action-premium" (click)="$event.stopPropagation(); openLeadModal(lead)">
                    <i class="fas fa-cog mr-1"></i> Gestionar
                  </button>
                </td>
              </tr>
              <tr *ngIf="leads.length === 0">
                <td colspan="6" class="text-center py-10">
                  <div class="empty-state-lux">
                    <i class="fas fa-users-slash mb-3"></i>
                    <p>No hay prospectos registrados aún.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Lead Management Modal -->
    <div class="lead-modal-overlay" *ngIf="showLeadModal" (click)="closeLeadModal()">
      <div class="lead-modal-card" (click)="$event.stopPropagation()">
        <div class="modal-header-lux">
          <h3>Gestionar Prospecto</h3>
          <button class="close-btn" (click)="closeLeadModal()">&times;</button>
        </div>
        
        <div class="modal-body-lux" *ngIf="selectedLead">
          <div class="lead-info-card mb-4">
            <div class="d-flex align-items-center mb-3">
              <div class="user-avatar-lux">
                <i class="fas fa-user"></i>
              </div>
              <div class="ml-3">
                <h4 class="mb-0">{{ selectedLead.name }}</h4>
                <p class="text-muted mb-0">{{ selectedLead.email }}</p>
              </div>
            </div>
            <div class="info-grid">
              <div class="info-item">
                <label>Teléfono</label>
                <span>{{ selectedLead.phone || '-' }}</span>
              </div>
              <div class="info-item">
                <label>Interés</label>
                <span>{{ selectedLead.interest }}</span>
              </div>
              <div class="info-item">
                <label>Origen</label>
                <span class="source-tag-premium">{{ selectedLead.source }}</span>
              </div>
            </div>
          </div>

          <div class="status-actions">
            <label class="d-block mb-3 font-weight-bold">Cambiar Estado</label>
            <div class="status-buttons-grid">
              <button class="status-btn new" [class.active]="selectedLead.status === 'NEW'" (click)="updateStatus('NEW')">Nuevo</button>
              <button class="status-btn contacted" [class.active]="selectedLead.status === 'CONTACTED'" (click)="updateStatus('CONTACTED')">Contactado</button>
              <button class="status-btn qualified" [class.active]="selectedLead.status === 'QUALIFIED'" (click)="updateStatus('QUALIFIED')">Cualificado</button>
              <button class="status-btn discarded" [class.active]="selectedLead.status === 'DISCARDED'" (click)="updateStatus('DISCARDED')">Descartado</button>
            </div>
          </div>

          <div class="conversion-section mt-4 pt-4 border-top" *ngIf="selectedLead.status !== 'CONVERTED'">
            <div class="alert alert-info-lux">
              <i class="fas fa-info-circle mr-2"></i>
              Al convertir a este prospecto, se creará un usuario de tipo <strong>CLIENTE</strong> automáticamente.
            </div>
            <button class="btn-convert-lux" (click)="convertToClient()">
              <i class="fas fa-user-check mr-2"></i> Convertir a Cliente
            </button>
          </div>

          <div class="conversion-section mt-4 pt-4 border-top text-center" *ngIf="selectedLead.status === 'CONVERTED'">
            <div class="badge badge-success-lux p-3">
              <i class="fas fa-check-circle mr-2"></i> Este prospecto ya es un cliente oficial
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .crm-page { padding: 3rem 2rem; min-height: 100vh; background: #f8f9fa; }
    .animate-fade-in { animation: fadeIn 0.8s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

    .page-title-text { 
      font-size: 2.5rem; font-weight: 800; letter-spacing: -1px; color: #1a1a1a;
    }
    .text-subtitle { color: #666; font-size: 1.1rem; }
    .text-muted { color: #888; font-size: 0.75rem; }
    
    .btn-refresh {
        background: white; border: 1px solid #ddd; padding: 10px 20px; border-radius: 12px;
        color: #555; font-weight: 600; cursor: pointer; transition: all 0.3s;
    }
    .btn-refresh:hover { background: #f0f0f0; transform: translateY(-2px); }

    .stats-badge-premium { 
      background: var(--gradient-red, #e74c3c); color: white; padding: 10px 25px; 
      border-radius: 16px; display: flex; flex-direction: column; align-items: center;
      box-shadow: 0 10px 20px rgba(231, 76, 60, 0.3);
    }
    .stats-badge-premium .count { font-size: 1.5rem; font-weight: 900; line-height: 1; }
    .stats-badge-premium .label { font-size: 0.6rem; text-transform: uppercase; font-weight: 700; opacity: 0.9; letter-spacing: 1px; margin-top: 4px; }

    .card-glass-light { 
      background: #ffffff; border-radius: 20px; border: 1px solid rgba(0,0,0,0.05);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
    }

    .premium-crm-table { width: 100%; border-collapse: separate; border-spacing: 0; }
    .premium-crm-table thead th { 
      background: #f8f9fa; border: none; padding: 1.2rem 1rem; 
      font-size: 0.75rem; font-weight: 800; color: #555; letter-spacing: 1px;
      text-transform: uppercase; border-bottom: 2px solid #eee;
    }
    .lead-row { transition: all 0.3s ease; border-bottom: 1px solid #f0f0f0; }
    .lead-row:hover { background: #f9f9f9; }
    .lead-row td { padding: 1.2rem 1rem; vertical-align: middle; border: none; }

    .lead-name { font-size: 1rem; font-weight: 700; color: #333; margin-bottom: 2px; }
    .contact-info { color: #555; font-weight: 500; font-size: 0.9rem; }
    
    .interest-tag { 
      background: #fff0ed; color: #e74c3c; 
      padding: 6px 14px; border-radius: 12px; font-size: 0.75rem; font-weight: 700;
      border: 1px solid rgba(231, 76, 60, 0.2);
    }
    .source-tag-premium { 
      font-size: 0.7rem; color: #666; background: #eee; 
      padding: 4px 10px; border-radius: 6px; font-weight: 600; text-transform: uppercase;
    }

    .status-indicator-premium { 
      font-size: 0.65rem; font-weight: 800; padding: 6px 14px; border-radius: 50px; 
      text-transform: uppercase; display: inline-block; letter-spacing: 0.5px;
    }
    .status-indicator-premium.NEW { background: #e8f5e9; color: #2ecc71; border: 1px solid #c8e6c9; }
    .status-indicator-premium.CONTACTED { background: #e3f2fd; color: #3498db; border: 1px solid #bbdefb; }
    .status-indicator-premium.QUALIFIED { background: #fff8e1; color: #f1c40f; border: 1px solid #ffecb3; }

    .btn-action-premium { 
      background: #333; color: white; border: none; 
      padding: 8px 16px; border-radius: 12px; font-size: 0.8rem; font-weight: 700; 
      cursor: pointer; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .btn-action-premium:hover { background: #000; transform: translateY(-2px); }

    .empty-state-lux { padding: 6rem 0; color: #aaa; }
    .empty-state-lux i { font-size: 4rem; color: #ddd; margin-bottom: 1rem; }
    .empty-state-lux p { font-size: 1.1rem; font-weight: 500; }

    /* Modal Styles */
    .lead-modal-overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
      z-index: 2000; display: flex; justify-content: center; align-items: center;
      animation: fadeIn 0.3s ease-out;
    }
    .lead-modal-card {
      background: white; width: 90%; max-width: 550px; border-radius: 24px;
      overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    @keyframes slideUp { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    .modal-header-lux {
      padding: 1.5rem 2rem; background: #f8f9fa; border-bottom: 1px solid #eee;
      display: flex; justify-content: space-between; align-items: center;
    }
    .modal-header-lux h3 { margin: 0; font-weight: 800; color: #1a1a1a; font-size: 1.25rem; }
    .close-btn { background: none; border: none; font-size: 1.5rem; color: #aaa; cursor: pointer; }

    .modal-body-lux { padding: 2rem; }
    .lead-info-card {
      background: #fdfdfd; padding: 1.5rem; border-radius: 16px;
      border: 1px solid #f0f0f0;
    }
    .user-avatar-lux {
      width: 50px; height: 50px; background: #eee; border-radius: 50%;
      display: flex; justify-content: center; align-items: center; font-size: 1.2rem; color: #888;
    }
    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; margin-top: 1rem; }
    .info-item label { display: block; font-size: 0.65rem; font-weight: 800; color: #aaa; text-transform: uppercase; margin-bottom: 4px; }
    .info-item span { font-weight: 600; color: #333; }

    .status-buttons-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
    .status-btn {
      padding: 10px; border-radius: 12px; border: 2px solid #eee; background: white;
      font-weight: 700; font-size: 0.8rem; cursor: pointer; transition: all 0.2s;
    }
    .status-btn:hover { border-color: #ddd; background: #f9f9f9; }
    .status-btn.active { border-color: transparent !important; color: white !important; }

    .status-btn.new.active { background: #2ecc71; box-shadow: 0 4px 10px rgba(46, 204, 113, 0.3); }
    .status-btn.contacted.active { background: #3498db; box-shadow: 0 4px 10px rgba(52, 152, 219, 0.3); }
    .status-btn.qualified.active { background: #f1c40f; box-shadow: 0 4px 10px rgba(241, 196, 15, 0.3); }
    .status-btn.discarded.active { background: #95a5a6; box-shadow: 0 4px 10px rgba(149, 165, 166, 0.3); }

    .btn-convert-lux {
      width: 100%; padding: 14px; border-radius: 16px; border: none;
      background: var(--gradient-red, #e74c3c); color: white; font-weight: 800;
      font-size: 1rem; cursor: pointer; transition: all 0.3s;
      box-shadow: 0 8px 20px rgba(231, 76, 60, 0.3);
    }
    .btn-convert-lux:hover { transform: translateY(-3px); box-shadow: 0 12px 25px rgba(231, 76, 60, 0.4); }

    .alert-info-lux {
      background: #e3f2fd; color: #1976d2; padding: 1rem; border-radius: 12px;
      margin-bottom: 1.5rem; font-size: 0.85rem; border: 1px solid #bbdefb;
    }
    .badge-success-lux { background: #e8f5e9; color: #2e7d32; border-radius: 12px; font-weight: 700; width: 100%; display: block; }
    
    .status-indicator-premium.CONVERTED { background: #e8f5e9; color: #2ecc71; border: 1px solid #c8e6c9; }
    `]
})
export class AdminCrmLeadsComponent implements OnInit, OnDestroy {
  leads: any[] = [];
  isLoading = false;
  private crmService = inject(CRMService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private routerSubscription: Subscription | undefined;
  selectedLead: any = null;
  showLeadModal = false;

  constructor() {
    this.routerSubscription = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => {
      this.loadLeads();
    });
  }

  ngOnInit(): void {
    this.loadLeads();
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  loadLeads() {
    this.isLoading = true;
    this.crmService.getAllLeads().subscribe({
      next: (data) => {
        this.leads = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading leads', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openLeadModal(lead: any) {
    this.selectedLead = { ...lead };
    this.showLeadModal = true;
  }

  closeLeadModal() {
    this.showLeadModal = false;
    this.selectedLead = null;
  }

  updateStatus(status: string) {
    this.crmService.updateLeadStatus(this.selectedLead.id, status).subscribe({
      next: () => {
        alert('Estado actualizado');
        this.loadLeads();
        this.closeLeadModal();
      },
      error: (err) => {
        console.error(err);
        const errorMsg = err.error?.message || err.message || 'Error desconocido';
        alert('Error al actualizar estado: ' + errorMsg);
      }
    });
  }

  convertToClient() {
    if (confirm(`¿Convertir a ${this.selectedLead.name} en Cliente oficial?`)) {
      this.crmService.convertLeadToClient(this.selectedLead.id).subscribe({
        next: () => {
          alert('¡Prospecto convertido en cliente con éxito!');
          this.loadLeads();
          this.closeLeadModal();
        },
        error: (err) => {
          console.error(err);
          const msg = err.error?.message || err.message || 'Error al convertir';
          alert('Error al convertir: ' + msg);
        }
      });
    }
  }

  convertLead(lead: any) {
    // Legacy mapping to opportunity if needed, but we prefer the modal now
    this.openLeadModal(lead);
  }
}
