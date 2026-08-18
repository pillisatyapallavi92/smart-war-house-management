/**
 * NexusWMS - Exception Command Center & Conflict Arbitration Hub
 */
import { state } from './state.js';
import { DecisionEngine } from './decision-engine.js';
import { soundFx } from './config.js';

export class ExceptionCenter {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.filterSeverity = "ALL";

    if (this.container) {
      this.init();
    }
  }

  init() {
    this.render();

    state.subscribe("exception_added", () => this.render());
    state.subscribe("exception_resolved", () => this.render());
  }

  setFilter(severity) {
    this.filterSeverity = severity;
    this.render();
  }

  render() {
    if (!this.container) return;

    const allExceptions = state.exceptions || [];
    const filtered = this.filterSeverity === "ALL" 
      ? allExceptions 
      : allExceptions.filter(e => e.severity === this.filterSeverity || e.status === this.filterSeverity);

    const openCount = allExceptions.filter(e => e.status === "OPEN").length;
    const criticalCount = allExceptions.filter(e => e.status === "OPEN" && e.severity === "CRITICAL").length;

    this.container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <!-- Incident Command Ribbon -->
        <div class="glass-panel" style="padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; border-left: 4px solid var(--status-danger);">
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 1.3rem;">🚨</span>
              <h2 style="font-size: 1.25rem;">Active Warehouse Exceptions & Incident Command</h2>
            </div>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 2px;">
              Real-time exception arbitration, damage quarantine, and intelligent stock conflict resolution.
            </p>
          </div>

          <div style="display: flex; gap: 1rem;">
            <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); padding: 0.4rem 0.9rem; border-radius: var(--radius-md); text-align: center;">
              <div style="font-size: 0.7rem; color: #f87171; text-transform: uppercase; font-weight: 700;">Critical Incidents</div>
              <div style="font-size: 1.4rem; font-weight: 800; color: #ef4444; font-family: var(--font-heading);">${criticalCount}</div>
            </div>
            <div style="background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); padding: 0.4rem 0.9rem; border-radius: var(--radius-md); text-align: center;">
              <div style="font-size: 0.7rem; color: #fbbf24; text-transform: uppercase; font-weight: 700;">Total Open</div>
              <div style="font-size: 1.4rem; font-weight: 800; color: #f59e0b; font-family: var(--font-heading);">${openCount}</div>
            </div>
          </div>
        </div>

        <!-- Filter Bar -->
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-sm ${this.filterSeverity === 'ALL' ? 'btn-primary' : 'btn-secondary'}" data-filter="ALL">All (${allExceptions.length})</button>
            <button class="btn btn-sm ${this.filterSeverity === 'CRITICAL' ? 'btn-danger' : 'btn-secondary'}" data-filter="CRITICAL">Critical</button>
            <button class="btn btn-sm ${this.filterSeverity === 'WARNING' ? 'btn-warning' : 'btn-secondary'}" data-filter="WARNING">Warnings</button>
            <button class="btn btn-sm ${this.filterSeverity === 'RESOLVED' ? 'btn-success' : 'btn-secondary'}" data-filter="RESOLVED">Resolved</button>
          </div>
        </div>

        <!-- Exception Cards Stream -->
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          ${filtered.length === 0 ? `
            <div class="glass-panel" style="padding: 2.5rem; text-align: center;">
              <div style="font-size: 2rem; margin-bottom: 0.5rem;">🛡️</div>
              <h3>No Exceptions Found</h3>
              <p style="color: var(--text-secondary);">All warehouse operations are running smoothly within nominal parameters.</p>
            </div>
          ` : filtered.map(exc => this.renderExceptionCard(exc)).join('')}
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  renderExceptionCard(exc) {
    const isConflict = exc.type === "STOCK_SHORTAGE_CONFLICT";
    const isOpen = exc.status === "OPEN";

    return `
      <div class="glass-panel" style="padding: 1.25rem; border-left: 4px solid ${exc.severity === 'CRITICAL' ? 'var(--status-danger)' : (isOpen ? 'var(--status-warning)' : 'var(--status-success)')};">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 4px;">
              <span class="badge badge-${exc.severity === 'CRITICAL' ? 'danger' : 'warning'}">${exc.severity}</span>
              <span class="font-mono" style="font-size: 0.75rem; color: var(--text-muted);">${exc.id}</span>
              <span style="font-size: 0.75rem; color: var(--text-muted);">• ${new Date(exc.createdAt).toLocaleTimeString()}</span>
            </div>
            <h3 style="font-size: 1.1rem; color: #fff;">${exc.title}</h3>
          </div>
          <div>
            <span class="badge badge-${isOpen ? 'warning' : 'success'}">${exc.status}</span>
          </div>
        </div>

        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem; line-height: 1.4;">
          ${exc.description}
        </p>

        <!-- Metadata Ribbon -->
        <div style="display: flex; gap: 1.5rem; font-size: 0.8rem; background: var(--bg-tertiary); padding: 0.6rem 0.85rem; border-radius: var(--radius-md); margin-bottom: 1rem; flex-wrap: wrap;">
          ${exc.sku ? `<div><span style="color: var(--text-muted);">SKU:</span> <strong class="font-mono text-cyan">${exc.sku}</strong></div>` : ''}
          ${exc.bin ? `<div><span style="color: var(--text-muted);">Bin:</span> <strong class="font-mono">${exc.bin}</strong></div>` : ''}
          ${exc.affectedOrders ? `<div><span style="color: var(--text-muted);">Affected Orders:</span> <strong class="font-mono">${exc.affectedOrders.join(', ')}</strong></div>` : ''}
        </div>

        <!-- Resolution Box -->
        ${isOpen ? `
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; border-top: 1px solid var(--border-subtle); padding-top: 0.85rem;">
            <div style="font-size: 0.8rem; color: #fbbf24; display: flex; align-items: center; gap: 0.4rem;">
              <span>💡 Suggested:</span>
              <span>${exc.suggestedAction}</span>
            </div>
            <div style="display: flex; gap: 0.5rem;">
              ${isConflict ? `
                <button class="btn btn-primary btn-sm btn-open-conflict-matrix" data-sku="${exc.sku}">
                  🧠 Launch AI Arbitration Matrix
                </button>
              ` : `
                <button class="btn btn-success btn-sm btn-quick-resolve" data-id="${exc.id}">
                  ⚡ 1-Click Auto Resolve
                </button>
              `}
            </div>
          </div>
        ` : `
          <div style="border-top: 1px solid var(--border-subtle); padding-top: 0.75rem; font-size: 0.8rem; color: #34d399; display: flex; align-items: center; gap: 0.5rem;">
            <span>✅ Resolution:</span>
            <span>${exc.resolutionDetails || 'Resolved by operator action.'}</span>
          </div>
        `}
      </div>
    `;
  }

  attachEventListeners() {
    // Filter buttons
    const filterBtns = this.container.querySelectorAll('[data-filter]');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const sev = btn.getAttribute('data-filter');
        this.setFilter(sev);
      });
    });

    // Launch Conflict Matrix Modal (The Hackathon dilemma!)
    const conflictBtns = this.container.querySelectorAll('.btn-open-conflict-matrix');
    conflictBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const sku = btn.getAttribute('data-sku');
        this.openConflictArbitrationModal(sku);
      });
    });

    // 1-Click Resolve
    const resolveBtns = this.container.querySelectorAll('.btn-quick-resolve');
    resolveBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const exc = state.exceptions.find(e => e.id === id);
        if (exc) {
          if (exc.type === "DAMAGED_ITEM_PICK") {
            state.resolveException(id, "Quarantined 1 unit to QUAR-01. Replaced with 1 unit from Reserve B-03-04.");
          } else if (exc.type === "MISSING_STOCK_BIN") {
            state.resolveException(id, "Supervisor cycle count audit created (Audit #AUD-902). Stock adjusted.");
          } else if (exc.type === "WEIGHT_DISCREPANCY") {
            state.resolveException(id, "Carton re-inspected and sealed; weight matches expected tolerance.");
          } else {
            state.resolveException(id, "Approved and cleared by Warehouse Supervisor.");
          }
        }
      });
    });
  }

  /**
   * Open the Full-Screen Conflict Arbitration Modal
   * Displays all 4 strategies for solving the Urgent vs Low Priority order dilemma!
   */
  openConflictArbitrationModal(skuId) {
    const conflictContext = DecisionEngine.evaluateStockShortageConflict(skuId);
    if (!conflictContext) {
      state.showToast("No active conflict detected for SKU " + skuId, "info");
      return;
    }

    const modal = document.getElementById("generic-modal");
    const modalTitle = document.getElementById("generic-modal-title");
    const modalBody = document.getElementById("generic-modal-body");

    if (!modal || !modalTitle || !modalBody) return;

    modalTitle.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <span style="font-size: 1.3rem;">🧠</span>
        <span>AI Conflict Arbitration Matrix: <span class="font-mono text-cyan">${skuId}</span></span>
      </div>
    `;

    const { product, availableStock, totalDemanded, conflictingOrders, strategies } = conflictContext;

    modalBody.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1.25rem;">
        <!-- Scenario Summary Box -->
        <div style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(245, 158, 11, 0.15) 100%); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: var(--radius-md); padding: 1rem;">
          <div style="font-size: 0.75rem; font-weight: 700; color: #f87171; text-transform: uppercase; margin-bottom: 4px;">
            ⚠️ The Shortage Dilemma
          </div>
          <div style="font-size: 0.95rem; font-weight: 600; color: #fff; margin-bottom: 0.5rem;">
            Total Demand (${totalDemanded} units) exceeds Available Physical Stock (${availableStock} units in ${product.bin}).
          </div>
          <div style="display: flex; gap: 1rem; font-size: 0.8rem; color: #cbd5e1; flex-wrap: wrap;">
            ${conflictingOrders.map((ord, idx) => {
              const reqQty = ord.items.find(i => i.sku === skuId)?.qtyRequested || 0;
              return `
                <div style="background: rgba(0,0,0,0.4); padding: 4px 8px; border-radius: 4px;">
                  <strong style="color: ${ord.priority === 'CRITICAL' ? '#ef4444' : '#60a5fa'};">${ord.orderNumber}</strong> (${ord.customer.tier} Tier): 
                  Demands <strong>${reqQty} units</strong> (SLA: ${ord.slaMinutesRemaining}m remaining)
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div style="font-weight: 700; font-size: 0.95rem; color: var(--brand-primary); display: flex; align-items: center; gap: 0.4rem;">
          <span>⚡ Select & Execute Arbitration Strategy:</span>
        </div>

        <!-- 4 Strategy Cards Grid -->
        <div class="decision-grid">
          ${strategies.map(strat => `
            <div class="decision-card ${strat.isRecommended ? 'selected' : ''}" data-strategy-id="${strat.id}">
              ${strat.isRecommended ? `<span class="decision-badge-recommended">★ ${strat.tag}</span>` : ''}
              
              <div>
                <h4 style="font-size: 0.95rem; margin-bottom: 0.5rem; color: #fff;">${strat.title}</h4>
                <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.75rem; line-height: 1.35;">
                  ${strat.summary}
                </p>

                <!-- Actions List -->
                <div style="background: rgba(0,0,0,0.3); padding: 0.5rem; border-radius: var(--radius-sm); margin-bottom: 0.75rem; font-size: 0.75rem;">
                  <div style="font-weight: 700; color: var(--text-muted); margin-bottom: 2px;">Execution Plan:</div>
                  <ul style="padding-left: 1.1rem; color: #cbd5e1;">
                    ${strat.actions.map(act => `<li>${act}</li>`).join('')}
                  </ul>
                </div>
              </div>

              <div>
                <!-- Impact Telemetry -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem; font-size: 0.72rem; margin-bottom: 0.75rem; background: var(--bg-tertiary); padding: 0.4rem; border-radius: var(--radius-sm);">
                  <div>SLA Protection: <strong style="color: #10b981;">${strat.metrics.slaProtectionRate}</strong></div>
                  <div>VIP NPS: <strong style="color: #00f2fe;">${strat.metrics.vipSatisfaction}</strong></div>
                  <div>Penalty Saved: <strong style="color: #f59e0b;">${strat.metrics.financialPenaltyAvoided}</strong></div>
                  <div>Overall Score: <strong style="color: #c084fc;">${strat.metrics.overallFulfillmentScore}</strong></div>
                </div>

                <button class="btn btn-primary btn-sm btn-execute-strat" data-strategy-id="${strat.id}" style="width: 100%;">
                  ⚡ Apply & Execute Strategy
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    modal.classList.add("active");

    // Attach strategy execution buttons
    const stratBtns = modalBody.querySelectorAll('.btn-execute-strat');
    stratBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const stratId = btn.getAttribute('data-strategy-id');
        const res = DecisionEngine.executeStrategy(stratId, conflictContext);
        if (res.success) {
          modal.classList.remove("active");
          this.render();
        }
      });
    });
  }
}
