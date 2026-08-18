/**
 * NexusWMS - Packing Station Workbench & Quality Assurance Gate
 */
import { state } from './state.js';
import { soundFx } from './config.js';

export class PackingStation {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.activeOrder = null;
    this.scaleWeight = null;
    this.boxSize = "M-4 (Medium Heavy-Duty 30x20x15cm)";
    this.qcPassed = false;

    if (this.container) {
      this.init();
    }
  }

  init() {
    const packingOrder = state.orders.find(o => o.status === "PACKING") || state.orders[0];
    this.activeOrder = packingOrder ? packingOrder.id : null;
    this.render();

    state.subscribe("order_updated", () => this.render());
  }

  setOrder(orderId) {
    this.activeOrder = orderId;
    this.scaleWeight = null;
    this.qcPassed = false;
    this.render();
  }

  calculateExpectedWeight(order) {
    if (!order || !order.items) return 0;
    const itemsWeight = order.items.reduce((sum, item) => {
      const prod = state.getProductById(item.sku);
      const unitWeight = prod ? prod.weightKg : (item.weightKg || 0.5);
      return sum + (unitWeight * (item.qtyPacked || item.qtyPicked || item.qtyRequested || 1));
    }, 0);
    const tareBoxWeight = 0.25; // Box packaging weight
    return parseFloat((itemsWeight + tareBoxWeight).toFixed(2));
  }

  render() {
    if (!this.container) return;

    const packingOrders = state.orders.filter(o => o.status === "PACKING");
    const order = state.getOrderById(this.activeOrder);

    if (!order) {
      this.container.innerHTML = `
        <div class="glass-panel" style="padding: 3rem; text-align: center;">
          <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">📦</div>
          <h3>Packing Station Idle</h3>
          <p style="color: var(--text-secondary);">No orders currently waiting at Packing Station PK-01.</p>
        </div>
      `;
      return;
    }

    const expectedWeight = this.calculateExpectedWeight(order);
    const measuredWeight = this.scaleWeight ?? expectedWeight;
    const weightDiff = Math.abs(measuredWeight - expectedWeight);
    const isWeightAccurate = weightDiff <= 0.05;

    this.container.innerHTML = `
      <div class="grid-packing-layout">
        <!-- Left: Workbench & Packing Controls -->
        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
          <!-- Workbench Card -->
          <div class="glass-panel" style="padding: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
              <div>
                <span class="badge badge-purple">Station PK-01 • Active Workbench</span>
                <h2 style="font-size: 1.4rem; margin-top: 4px;">Order ${order.orderNumber}</h2>
                <div style="font-size: 0.85rem; color: var(--text-secondary);">${order.customer.name}</div>
              </div>
              <div style="text-align: right;">
                <span class="badge badge-${order.priority === 'CRITICAL' ? 'danger' : 'warning'}">${order.priority} PRIORITY</span>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">Carrier: ${order.carrier}</div>
              </div>
            </div>

            <!-- Items to Pack Checklist -->
            <div style="margin-bottom: 1.25rem;">
              <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.5rem;">
                Verified Tote Items
              </div>
              <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                ${(order.items || []).map(item => `
                  <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-tertiary); padding: 0.65rem 0.9rem; border-radius: var(--radius-md);">
                    <div>
                      <div style="font-weight: 600; font-size: 0.85rem;">${item.name}</div>
                      <div style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">${item.sku}</div>
                    </div>
                    <div style="font-weight: 700; color: #10b981; font-family: var(--font-mono);">
                      ✅ ${item.qtyPicked || item.qtyRequested} units packed
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- AI Recommended Carton Box -->
            <div style="background: rgba(139, 92, 246, 0.08); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1.25rem;">
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.3rem;">
                <span style="font-size: 1.1rem;">📐</span>
                <span style="font-weight: 700; font-size: 0.85rem; color: #c084fc;">AI Dimensional Packaging Recommendation</span>
              </div>
              <div style="font-size: 0.9rem; font-weight: 600; color: #fff;">
                Carton Type: ${this.boxSize}
              </div>
              <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">
                Dunnage: Bubble Wrap + Tamper Evident Tape #T-992
              </div>
            </div>

            <!-- Quality Assurance Checklist -->
            <div style="background: var(--bg-tertiary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1.25rem;">
              <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.6rem;">
                Quality Assurance (QA) Checklist
              </div>
              <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                <label style="display: flex; align-items: center; gap: 0.6rem; font-size: 0.85rem; cursor: pointer;">
                  <input type="checkbox" id="chk-seal" checked>
                  <span>Anti-tamper holographic security seal applied</span>
                </label>
                <label style="display: flex; align-items: center; gap: 0.6rem; font-size: 0.85rem; cursor: pointer;">
                  <input type="checkbox" id="chk-fragile" ${order.items.some(i => i.isFragile) ? 'checked' : ''}>
                  <span>Fragile / Orientation labels affixed</span>
                </label>
                <label style="display: flex; align-items: center; gap: 0.6rem; font-size: 0.85rem; cursor: pointer;">
                  <input type="checkbox" id="chk-slip" checked>
                  <span>Commercial invoice & packing slip inserted</span>
                </label>
              </div>
            </div>

            <!-- Action Buttons -->
            <div style="display: flex; gap: 0.75rem;">
              <button id="btn-complete-pack" class="btn btn-primary btn-lg" style="flex: 1;" ${!isWeightAccurate ? 'disabled' : ''}>
                🏷️ Finalize Pack & Generate Shipping Label
              </button>
            </div>
          </div>
        </div>

        <!-- Right: Digital Scale & Weight Validation Telemetry -->
        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
          <!-- Smart Scale Hardware Simulator -->
          <div class="glass-panel" style="padding: 1.5rem; text-align: center;">
            <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 1rem; display: flex; justify-content: space-between;">
              <span>Digital Scale Telemetry</span>
              <span class="font-mono" style="color: var(--brand-primary);">Scale #SCALE-04</span>
            </div>

            <!-- Scale LCD Screen -->
            <div style="background: #020617; border: 3px solid #334155; border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; box-shadow: inset 0 0 15px rgba(0,0,0,0.8);">
              <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 0.25rem;">MEASURED GROSS WEIGHT</div>
              <div style="font-family: var(--font-mono); font-size: 3rem; font-weight: 800; color: ${isWeightAccurate ? '#10b981' : '#ef4444'}; letter-spacing: 2px;">
                ${measuredWeight.toFixed(2)} <span style="font-size: 1.25rem;">KG</span>
              </div>
              <div style="display: flex; justify-content: center; gap: 1.5rem; margin-top: 0.75rem; font-size: 0.8rem; font-family: var(--font-mono);">
                <span style="color: #94a3b8;">Expected: <strong style="color: #fff;">${expectedWeight.toFixed(2)} kg</strong></span>
                <span style="color: ${isWeightAccurate ? '#10b981' : '#ef4444'};">Variance: <strong>${(measuredWeight - expectedWeight).toFixed(2)} kg</strong></span>
              </div>
            </div>

            <!-- Scale Status & Simulation Sliders -->
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              <div style="display: flex; gap: 0.5rem;">
                <button id="btn-scale-match" class="btn btn-secondary btn-sm" style="flex: 1;">
                  ⚖️ Tare & Match Expected
                </button>
                <button id="btn-scale-mismatch" class="btn btn-outline-primary btn-sm" style="flex: 1; border-color: #ef4444; color: #ef4444;">
                  ⚠️ Simulate Weight Anomaly
                </button>
              </div>

              ${!isWeightAccurate ? `
                <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: var(--radius-md); padding: 0.75rem; text-align: left;">
                  <div style="font-weight: 700; color: #ef4444; font-size: 0.85rem; margin-bottom: 2px;">🚨 Weight Discrepancy Gate Locked</div>
                  <div style="font-size: 0.75rem; color: #cbd5e1;">
                    Measured weight deviates by more than 2% tolerance. Potential missing accessory or incorrect quantity. Packing gate blocked until verified.
                  </div>
                </div>
              ` : `
                <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: var(--radius-md); padding: 0.75rem; text-align: left;">
                  <div style="font-weight: 700; color: #10b981; font-size: 0.85rem;">✅ Weight Tolerance Check: PASSED</div>
                  <div style="font-size: 0.75rem; color: #cbd5e1;">
                    Package weight verified within certified carrier tolerance threshold.
                  </div>
                </div>
              `}
            </div>
          </div>

          <!-- Other Orders in Packing Queue -->
          <div class="glass-panel" style="padding: 1.25rem;">
            <h3 style="font-size: 1rem; margin-bottom: 0.75rem;">Queue at Packing Station</h3>
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
              ${packingOrders.map(ord => `
                <div class="packing-queue-card ${ord.id === order.id ? 'active-queue-item' : ''}" 
                     data-order-id="${ord.id}"
                     style="background: ${ord.id === order.id ? 'rgba(0, 242, 254, 0.1)' : 'var(--bg-tertiary)'}; 
                            border: 1px solid ${ord.id === order.id ? 'var(--brand-primary)' : 'var(--border-subtle)'}; 
                            border-radius: var(--radius-md); padding: 0.6rem 0.85rem; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="font-weight: 700; font-family: var(--font-mono); color: #fff;">${ord.orderNumber}</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">${ord.customer.name}</div>
                  </div>
                  <span class="badge badge-${ord.priority === 'CRITICAL' ? 'danger' : 'warning'}">${ord.priority}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners(order, expectedWeight);
  }

  attachEventListeners(order, expectedWeight) {
    // Queue selection
    const cards = this.container.querySelectorAll('.packing-queue-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const orderId = card.getAttribute('data-order-id');
        this.setOrder(orderId);
      });
    });

    // Tare scale
    const btnScaleMatch = document.getElementById("btn-scale-match");
    if (btnScaleMatch) {
      btnScaleMatch.addEventListener('click', () => {
        this.scaleWeight = expectedWeight;
        soundFx.playScanBeep();
        this.render();
      });
    }

    // Simulate anomaly
    const btnScaleMismatch = document.getElementById("btn-scale-mismatch");
    if (btnScaleMismatch) {
      btnScaleMismatch.addEventListener('click', () => {
        this.scaleWeight = parseFloat((expectedWeight * 0.65).toFixed(2)); // Missing weight
        soundFx.playErrorBuzzer();
        state.addException({
          type: "WEIGHT_DISCREPANCY",
          severity: "WARNING",
          title: `Weight Discrepancy at Packing: ${order.orderNumber}`,
          description: `Package weighed ${this.scaleWeight} kg vs expected ${expectedWeight} kg. Missing components suspected.`,
          affectedOrders: [order.id],
          suggestedAction: "Reopen carton and cross-check packing manifest."
        });
        this.render();
      });
    }

    // Complete Pack
    const btnComplete = document.getElementById("btn-complete-pack");
    if (btnComplete) {
      btnComplete.addEventListener('click', () => {
        const trackingNum = `EXP-${Math.floor(100000 + Math.random() * 900000)}-USA`;
        
        state.updateOrderStatus(order.id, "READY_FOR_DISPATCH", {
          grossWeightKg: expectedWeight,
          boxType: this.boxSize,
          trackingNumber: trackingNum,
          packedAt: new Date().toISOString()
        });

        soundFx.playSuccessChime();
        state.showToast(`Order ${order.orderNumber} packed! Generated Tracking #${trackingNum}`, "success");
        
        // Auto navigate to dispatch tab
        const dispatchTab = document.querySelector('[data-tab="dispatch"]');
        if (dispatchTab) dispatchTab.click();
      });
    }
  }
}
