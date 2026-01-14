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
      <div class="header-section mb-4 border-bottom border-secondary pb-3">
        <div class="d-flex justify-content-between align-items-end">
          <div>
            <h2 class="section-title-lux mb-0">Prospectos Dashboard</h2>
            <p class="text-gray mb-0 mt-2">Gestión de potenciales clientes capturados por el Chatbot</p>
          </div>
          <div class="d-flex align-items-center gap-3">
             <div class="stats-badge-premium">
                <span class="count">{{ leads.length }}</span>
                <span class="label">Leads Totales</span>
             </div>
          </div>
        </div>
      </div>

      <div class="card-glass shadow-lg overflow-hidden">
        <div class="table-responsive">
          <table class="premium-table mb-0">
            <thead>
              <tr class="mat-mdc-header-row">
                <th class="mat-mdc-header-cell pl-4">PROSPECTO</th>
                <th class="mat-mdc-header-cell">CONTACTO</th>
                <th class="mat-mdc-header-cell">INTERÉS</th>
                <th class="mat-mdc-header-cell">ORIGEN</th>
                <th class="mat-mdc-header-cell">ESTADO</th>
                <th class="mat-mdc-header-cell text-right pr-4">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let lead of leads" class="mat-mdc-row lead-row" (click)="openLeadModal(lead)">
                <td class="mat-mdc-cell pl-4">
                  <div class="lead-name text-white font-weight-bold">{{ lead.name }}</div>
                  <small class="text-gray">{{ lead.createdAt | date:'short' }}</small>
                </td>
                <td class="mat-mdc-cell">
                  <div class="contact-info text-light">
                    <i class="fas fa-phone-alt mr-2 text-accent"></i>{{ lead.phone }}
                  </div>
                </td>
                <td class="mat-mdc-cell"><span class="service-chip">{{ lead.interest }}</span></td>
                <td class="mat-mdc-cell"><span class="source-tag-lux">{{ lead.source }}</span></td>
                <td class="mat-mdc-cell">
                  <span class="status-indicator-lux" [ngClass]="lead.status">
                    {{ lead.status === 'CONVERTED' ? 'NUEVO CLIENTE' : lead.status }}
                  </span>
                </td>
                <td class="mat-mdc-cell text-right pr-4">
                  <button class="mat-mdc-icon-button mat-primary" (click)="$event.stopPropagation(); openLeadModal(lead)">
                    <i class="fas fa-cog"></i>
                  </button>
                </td>
              </tr>
              <tr *ngIf="leads.length === 0">
                <td colspan="6" class="text-center py-5">
                  <div class="empty-state-lux">
                    <i class="fas fa-users-slash mb-3 text-gray" style="font-size: 3rem;"></i>
                    <p class="text-gray">No hay prospectos registrados aún.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Lead Management Modal (Unified Lux Style) -->
    <div class="modal-overlay-lux" *ngIf="showLeadModal" (click)="closeLeadModal()">
      <div class="modal-card-lux medium" (click)="$event.stopPropagation()">
        
        <button class="close-btn-sexy" (click)="closeLeadModal()">
            <i class="fas fa-times"></i>
        </button>

        <div class="modal-header-lux mb-4 border-bottom border-secondary pb-3">
          <i class="fas fa-user-tag text-orange mr-2" style="font-size: 1.5rem;"></i>
          <h3 class="mb-0">Gestionar Prospecto</h3>
        </div>
        
        <div class="modal-body-lux" *ngIf="selectedLead">
          <div class="card-glass p-3 mb-4 d-flex align-items-center">
            <div class="user-avatar-lux mr-3" style="width: 50px; height: 50px; background: #333; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: #fff;">
                <i class="fas fa-user"></i>
            </div>
            <div>
                <h4 class="mb-0 text-white">{{ selectedLead.name }}</h4>
                <p class="text-gray mb-0 small">{{ selectedLead.email }}</p>
            </div>
          </div>

          <div class="row mb-4">
              <div class="col-6 mb-3">
                <label class="text-gray small text-uppercase font-weight-bold d-block mb-1">Teléfono</label>
                <div class="input-group-lux">
                    <div class="form-control-plaintext text-white pl-3">{{ selectedLead.phone || '-' }}</div>
                </div>
              </div>
              <div class="col-6 mb-3">
                <label class="text-gray small text-uppercase font-weight-bold d-block mb-1">Interés</label>
                <div class="input-group-lux">
                    <div class="form-control-plaintext text-white pl-3">{{ selectedLead.interest }}</div>
                </div>
              </div>
          </div>

          <div class="status-actions mb-4">
            <label class="text-gray small text-uppercase font-weight-bold d-block mb-3">Cambiar Estado</label>
            <div class="status-buttons-grid">
              <button class="status-btn new" [class.active]="selectedLead.status === 'NEW'" (click)="updateStatus('NEW')">Nuevo</button>
              <button class="status-btn contacted" [class.active]="selectedLead.status === 'CONTACTED'" (click)="updateStatus('CONTACTED')">Contactado</button>
              <button class="status-btn qualified" [class.active]="selectedLead.status === 'QUALIFIED'" (click)="updateStatus('QUALIFIED')">Cualificado</button>
              <button class="status-btn discarded" [class.active]="selectedLead.status === 'DISCARDED'" (click)="updateStatus('DISCARDED')">Descartado</button>
            </div>
          </div>

          <div class="conversion-section mt-4 pt-4 border-top border-secondary" *ngIf="selectedLead.status !== 'CONVERTED'">
            <div class="alert alert-info-lux mb-3">
              <i class="fas fa-info-circle mr-2"></i>
              Al convertir a este prospecto, se creará un usuario de tipo <strong>CLIENTE</strong> automáticamente.
            </div>
            <button class="btn-lux-primary w-100" (click)="convertToClient()">
              <i class="fas fa-user-check mr-2"></i> Convertir a Cliente
            </button>
          </div>

          <div class="conversion-section mt-4 pt-4 border-top border-secondary text-center" *ngIf="selectedLead.status === 'CONVERTED'">
            <div class="badge badge-success-lux p-3">
              <i class="fas fa-check-circle mr-2"></i> Este prospecto ya es un cliente oficial
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .crm-page { padding: 2rem; min-height: 100vh; background: var(--primary-dark); }
    .animate-fade-in { animation: fadeIn 0.8s ease-out; }
    
    .text-accent { color: var(--accent-orange); }
    
    .source-tag-lux { 
      font-size: 0.7rem; color: #fff; background: rgba(255,255,255,0.1); 
      padding: 4px 10px; border-radius: 6px; font-weight: 600; text-transform: uppercase;
      border: 1px solid rgba(255,255,255,0.1);
    }

    .status-indicator-lux { 
      font-size: 0.65rem; font-weight: 800; padding: 6px 14px; border-radius: 50px; 
      text-transform: uppercase; display: inline-block; letter-spacing: 0.5px;
    }
    .status-indicator-lux.NEW { background: rgba(46, 204, 113, 0.15); color: #2ecc71; border: 1px solid rgba(46, 204, 113, 0.3); }
    .status-indicator-lux.CONTACTED { background: rgba(52, 152, 219, 0.15); color: #3498db; border: 1px solid rgba(52, 152, 219, 0.3); }
    .status-indicator-lux.QUALIFIED { background: rgba(241, 196, 15, 0.15); color: #f1c40f; border: 1px solid rgba(241, 196, 15, 0.3); }
    .status-indicator-lux.DISCARDED { background: rgba(149, 165, 166, 0.15); color: #bdc3c7; border: 1px solid rgba(149, 165, 166, 0.3); }
    .status-indicator-lux.CONVERTED { background: rgba(46, 204, 113, 0.15); color: #2ecc71; border: 1px solid rgba(46, 204, 113, 0.3); }

    .status-buttons-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; }
    .status-btn {
      padding: 10px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05);
      font-weight: 700; font-size: 0.75rem; cursor: pointer; transition: all 0.2s; color: var(--text-gray);
      text-transform: uppercase;
    }
    .status-btn:hover { background: rgba(255,255,255,0.1); color: white; }
    
    .status-btn.new.active { background: #2ecc71; color: white; border-color: #2ecc71; box-shadow: 0 0 10px rgba(46, 204, 113, 0.4); }
    .status-btn.contacted.active { background: #3498db; color: white; border-color: #3498db; box-shadow: 0 0 10px rgba(52, 152, 219, 0.4); }
    .status-btn.qualified.active { background: #f1c40f; color: black; border-color: #f1c40f; box-shadow: 0 0 10px rgba(241, 196, 15, 0.4); }
    .status-btn.discarded.active { background: #95a5a6; color: white; border-color: #95a5a6; box-shadow: 0 0 10px rgba(149, 165, 166, 0.4); }

    .alert-info-lux {
      background: rgba(52, 152, 219, 0.1); color: #3498db; padding: 1rem; border-radius: 12px;
      font-size: 0.85rem; border: 1px solid rgba(52, 152, 219, 0.3);
    }
    .badge-success-lux { background: rgba(46, 204, 113, 0.15); color: #2ecc71; border: 1px solid rgba(46, 204, 113, 0.3); border-radius: 12px; font-weight: 700; width: 100%; display: block; }
    
    .lead-row { cursor: pointer; transition: background 0.2s; }
    .lead-row:hover { background: rgba(255,255,255,0.05) !important; }
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
        // Optimistic update
        this.selectedLead.status = status;
        const index = this.leads.findIndex(l => l.id === this.selectedLead.id);
        if (index !== -1) {
          this.leads[index].status = status;
        }
        this.cdr.detectChanges();
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
    this.openLeadModal(lead);
  }
}
