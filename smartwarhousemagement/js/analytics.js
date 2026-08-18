/**
 * NexusWMS - Operational Analytics Cockpit & AI Operations Copilot
 */
import { state } from './state.js';
import { DecisionEngine } from './decision-engine.js';
import { soundFx } from './config.js';

export class AnalyticsCockpit {
  constructor(containerId) {
    this.container = document.getElementById(containerId);

    if (this.container) {
      this.init();
    }
  }

  init() {
    this.render();

    state.subscribe("inventory_updated", () => this.render());
    state.subscribe("order_updated", () => this.render());
    state.subscribe("activity_added", () => this.render());
  }

  render() {
    if (!this.container) return;

    // Calculate real-time stats
    const totalProducts = state.products.length;
    const lowStockCount = state.products.filter(p => p.stockOnHand <= p.safetyStock).length;
    const totalOrders = state.orders.length;
    const dispatchedCount = state.orders.filter(o => o.status === "DISPATCHED").length;
    const pickingCount = state.orders.filter(o => o.status === "PICKING").length;
    const packingCount = state.orders.filter(o => o.status === "PACKING").length;
    const openExceptions = state.exceptions.filter(e => e.status === "OPEN").length;

    // Reorder recommendations from DecisionEngine
    const replenishmentList = state.products.map(p => DecisionEngine.calculateReplenishment(p)).filter(r => r.needsReorder);

    this.container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <!-- Top KPI Cards Grid -->
        <div class="grid-kpi">
          <div class="kpi-card">
            <div class="kpi-card-header">
              <span class="kpi-title">OTIF Fulfillment Rate</span>
              <div class="kpi-icon" style="background: rgba(16, 185, 129, 0.2); color: #10b981;">🎯</div>
            </div>
            <div class="kpi-value" style="color: #10b981;">98.6%</div>
            <div class="kpi-footer">
              <span class="kpi-trend-up">▲ +1.4%</span> vs yesterday benchmark
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-card-header">
              <span class="kpi-title">Pick Velocity</span>
              <div class="kpi-icon" style="background: rgba(0, 242, 254, 0.2); color: #00f2fe;">⚡</div>
            </div>
            <div class="kpi-value" style="color: #00f2fe;">148 <span style="font-size: 0.9rem; color: var(--text-muted);">units/hr</span></div>
            <div class="kpi-footer">
              <span class="kpi-trend-up">▲ +12%</span> with TSP Route Optimizer
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-card-header">
              <span class="kpi-title">Order Cycle Time</span>
              <div class="kpi-icon" style="background: rgba(139, 92, 246, 0.2); color: #c084fc;">⏱️</div>
            </div>
            <div class="kpi-value" style="color: #c084fc;">24.2 <span style="font-size: 0.9rem; color: var(--text-muted);">min</span></div>
            <div class="kpi-footer">
              <span class="kpi-trend-up">▼ -6.5 min</span> order-to-dispatch
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-card-header">
              <span class="kpi-title">Inventory Health</span>
              <div class="kpi-icon" style="background: rgba(245, 158, 11, 0.2); color: #fbbf24;">📦</div>
            </div>
            <div class="kpi-value" style="color: ${lowStockCount > 0 ? '#fbbf24' : '#10b981'};">
              ${lowStockCount > 0 ? `${lowStockCount} Low` : 'Optimal'}
            </div>
            <div class="kpi-footer">
              <span>${totalProducts} active SKUs monitored</span>
            </div>
          </div>
        </div>

        <!-- AI Operations Copilot Live Stream -->
        <div class="copilot-banner">
          <div class="copilot-content">
            <div class="copilot-avatar">🧠</div>
            <div>
              <div style="font-weight: 700; font-size: 1.05rem; color: #fff; display: flex; align-items: center; gap: 0.5rem;">
                <span>AI Operations Copilot — Live Intelligence Stream</span>
                <span class="badge badge-purple">Autonomous Active</span>
              </div>
              <div style="font-size: 0.85rem; color: #cbd5e1; margin-top: 2px;">
                Identified <strong>${replenishmentList.length} proactive restock opportunities</strong> and optimized 3 pick waves with zero SLA breaches.
              </div>
            </div>
          </div>
          <button id="btn-copilot-auto-tune" class="btn btn-purple btn-sm">
            ✨ Auto-Rebalance Operations
          </button>
        </div>

        <!-- 2 Column Analytics Grid -->
        <div class="grid-2col">
          <!-- Bottleneck Radar & Stage Latency -->
          <div class="glass-panel" style="padding: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
              <h3 style="font-size: 1.1rem;">Fulfillment Bottleneck Radar</h3>
              <span class="badge badge-cyan">Real-time Cycle</span>
            </div>

            <!-- Stage Bars -->
            <div style="display: flex; flex-direction: column; gap: 1rem;">
              <div>
                <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 4px;">
                  <span style="color: var(--text-secondary);">1. Ingestion & Priority Scoring</span>
                  <span class="font-mono font-bold" style="color: #10b981;">1.2 min (Fast)</span>
                </div>
                <div class="stock-bar-wrap"><div class="stock-bar-fill stock-fill-healthy" style="width: 15%;"></div></div>
              </div>

              <div>
                <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 4px;">
                  <span style="color: var(--text-secondary);">2. Stock Allocation & Arbitration</span>
                  <span class="font-mono font-bold" style="color: #10b981;">0.8 min (Instant)</span>
                </div>
                <div class="stock-bar-wrap"><div class="stock-bar-fill stock-fill-healthy" style="width: 10%;"></div></div>
              </div>

              <div>
                <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 4px;">
                  <span style="color: var(--text-secondary);">3. Picking Wave Execution</span>
                  <span class="font-mono font-bold" style="color: #fbbf24;">14.5 min (${pickingCount} active waves)</span>
                </div>
                <div class="stock-bar-wrap"><div class="stock-bar-fill stock-fill-warning" style="width: 65%;"></div></div>
              </div>

              <div>
                <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 4px;">
                  <span style="color: var(--text-secondary);">4. Packing & QA Verification</span>
                  <span class="font-mono font-bold" style="color: #10b981;">4.8 min (${packingCount} at bench)</span>
                </div>
                <div class="stock-bar-wrap"><div class="stock-bar-fill stock-fill-healthy" style="width: 30%;"></div></div>
              </div>

              <div>
                <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 4px;">
                  <span style="color: var(--text-secondary);">5. Dock Staging & Manifesting</span>
                  <span class="font-mono font-bold" style="color: #10b981;">2.9 min</span>
                </div>
                <div class="stock-bar-wrap"><div class="stock-bar-fill stock-fill-healthy" style="width: 20%;"></div></div>
              </div>
            </div>
          </div>

          <!-- Autonomous Replenishment & Reorder Recommendations (EOQ) -->
          <div class="glass-panel" style="padding: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
              <h3 style="font-size: 1.1rem;">Autonomous Replenishment (EOQ Engine)</h3>
              <span class="badge badge-warning">${replenishmentList.length} Reorder Triggers</span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              ${replenishmentList.length === 0 ? `
                <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                  ✅ All SKUs currently above safety stock thresholds.
                </div>
              ` : replenishmentList.map(rec => `
                <div style="background: var(--bg-tertiary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.85rem;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
                    <div>
                      <span class="badge badge-${rec.urgency === 'CRITICAL' ? 'danger' : 'warning'}" style="font-size: 0.65rem;">
                        ${rec.urgency}
                      </span>
                      <strong class="font-mono text-cyan" style="margin-left: 6px; font-size: 0.85rem;">${rec.sku}</strong>
                    </div>
                    <button class="btn btn-primary btn-sm btn-trigger-po" data-sku="${rec.sku}" data-qty="${rec.computedEOQ}">
                      + PO (${rec.computedEOQ} units)
                    </button>
                  </div>
                  <div style="font-weight: 600; font-size: 0.85rem; color: #fff; margin-bottom: 4px;">${rec.name}</div>
                  <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary);">
                    <span>Stock: <strong style="color: #f87171;">${rec.currentStock}</strong> (ROP: ${rec.computedROP})</span>
                    <span>Daily Demand: <strong>${rec.dailyDemand} units/day</strong></span>
                    <span>Lead Time: <strong>${rec.leadTimeDays} days</strong></span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Live Activity Audit Trail -->
        <div class="glass-panel" style="padding: 1.5rem;">
          <h3 style="font-size: 1.1rem; margin-bottom: 0.75rem;">Live Activity & Decision Audit Trail</h3>
          <div style="display: flex; flex-direction: column; gap: 0.5rem; max-height: 260px; overflow-y: auto;">
            ${(state.activityLog || []).map(act => `
              <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-tertiary); padding: 0.6rem 0.85rem; border-radius: var(--radius-md); font-size: 0.82rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <span class="badge badge-info" style="font-size: 0.65rem;">${act.type}</span>
                  <span style="color: #cbd5e1;">${act.text}</span>
                </div>
                <div style="color: var(--text-muted); font-size: 0.75rem; font-family: var(--font-mono); white-space: nowrap;">
                  ${new Date(act.timestamp).toLocaleTimeString()} • ${act.user}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    // Auto-tune button
    const btnAutoTune = document.getElementById("btn-copilot-auto-tune");
    if (btnAutoTune) {
      btnAutoTune.addEventListener('click', () => {
        soundFx.playSuccessChime();
        state.addActivityLog("AI_OPTIMIZATION", "Copilot auto-rebalanced pick waves and allocated reserve buffers.", "AI Copilot");
        state.showToast("✨ AI Copilot rebalanced pick waves and reallocated capacity!", "success");
        this.render();
      });
    }

    // Trigger Purchase Order (PO) Replenishment
    const poBtns = this.container.querySelectorAll('.btn-trigger-po');
    poBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const sku = btn.getAttribute('data-sku');
        const qty = parseInt(btn.getAttribute('data-qty') || "50", 10);
        
        state.updateProductStock(sku, qty, 0);
        soundFx.playSuccessChime();
        state.addActivityLog("PO_INBOUND", `Inbound PO received & restocked +${qty} units of ${sku} into bin.`, "Purchasing Bot");
        state.showToast(`Restocked +${qty} units for SKU ${sku}!`, "success");
        this.render();
      });
    });
  }
}
