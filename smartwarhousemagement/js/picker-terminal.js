/**
 * NexusWMS - Rugged Handheld Picker Terminal & Scanner Simulator
 */
import { state } from './state.js';
import { soundFx } from './config.js';

export class PickerTerminal {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.activeOrder = null;
    this.currentStepIndex = 0;
    this.isScanning = false;

    if (this.container) {
      this.init();
    }
  }

  init() {
    // Select first picking order by default
    const pickingOrder = state.orders.find(o => o.status === "PICKING") || state.orders[0];
    this.activeOrder = pickingOrder ? pickingOrder.id : null;
    this.currentStepIndex = 0;
    this.render();

    state.subscribe("order_updated", () => this.render());
  }

  setOrder(orderId) {
    this.activeOrder = orderId;
    this.currentStepIndex = 0;
    this.render();
  }

  render() {
    if (!this.container) return;

    const order = state.getOrderById(this.activeOrder);
    const pickingOrders = state.orders.filter(o => o.status === "PICKING" || o.status === "PENDING_ALLOCATION");

    if (!order) {
      this.container.innerHTML = `
        <div class="glass-panel" style="padding: 2rem; text-align: center;">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">📱</div>
          <h3>No Active Pick Wave Selected</h3>
          <p style="color: var(--text-secondary); margin-bottom: 1rem;">Select an order in picking state to start the handheld terminal workflow.</p>
        </div>
      `;
      return;
    }

    const items = order.items || [];
    const currentItem = items[this.currentStepIndex] || items[0];
    const isCompleted = items.every(i => (i.qtyPicked || 0) >= (i.qtyAllocated || i.qtyRequested));

    this.container.innerHTML = `
      <div class="grid-2col" style="align-items: start;">
        <!-- Left: Handheld Device View -->
        <div class="scanner-device">
          <!-- Terminal Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; font-size: 0.75rem; color: #94a3b8;">
            <div style="display: flex; align-items: center; gap: 4px;">
              <span style="color: #00f2fe;">📶 5G-WMS</span>
              <span>| ID: OP-09 (Alex)</span>
            </div>
            <div style="display: flex; align-items: center; gap: 4px;">
              <span>🔋 94%</span>
              <span class="font-mono">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          <!-- Screen UI -->
          <div class="scanner-screen">
            <!-- Order Header in Scanner -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(0, 242, 254, 0.3); padding-bottom: 0.5rem; margin-bottom: 0.75rem;">
              <div>
                <span style="font-size: 0.7rem; color: #94a3b8; text-transform: uppercase;">Pick Wave</span>
                <div style="font-weight: 800; font-size: 1rem; color: #00f2fe;">${order.orderNumber}</div>
              </div>
              <div style="text-align: right;">
                <span class="badge badge-${order.priority === 'CRITICAL' ? 'danger' : 'warning'}">${order.priority}</span>
                <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 2px;">Item ${this.currentStepIndex + 1} of ${items.length}</div>
              </div>
            </div>

            ${isCompleted ? `
              <!-- Completed State -->
              <div style="text-align: center; padding: 2rem 1rem;">
                <div style="font-size: 3rem; margin-bottom: 0.5rem; animation: float-badge 2s infinite ease-in-out;">🎉</div>
                <h3 style="color: #10b981; margin-bottom: 0.5rem;">Pick Wave Complete!</h3>
                <p style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 1.5rem;">
                  All items for ${order.orderNumber} have been picked and verified into Tote #T-88.
                </p>
                <button id="btn-route-to-packing" class="btn btn-primary btn-lg" style="width: 100%;">
                  ➔ Route to Packing Station PK-01
                </button>
              </div>
            ` : `
              <!-- Active Picking Step -->
              <!-- Barcode Laser Scanner Viewport -->
              <div class="scanner-viewport">
                <div class="scanner-laser"></div>
                <div style="position: absolute; text-align: center; z-index: 5; background: rgba(0,0,0,0.6); padding: 4px 8px; border-radius: 4px;">
                  <span style="font-size: 0.7rem; color: #00f2fe; letter-spacing: 0.05em; font-family: var(--font-mono);">
                    [ AIM AT BIN / PRODUCT BARCODE ]
                  </span>
                </div>
              </div>

              <!-- Pick Instructions Card -->
              <div style="background: rgba(15, 23, 42, 0.9); border: 1px solid #334155; border-radius: 8px; padding: 0.75rem; margin-bottom: 0.75rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span style="font-size: 0.7rem; color: #94a3b8; text-transform: uppercase;">Target Location</span>
                  <span style="font-size: 0.7rem; color: #00f2fe; font-weight: 700;">${currentItem.zone}</span>
                </div>
                <div style="font-size: 1.3rem; font-weight: 800; font-family: var(--font-mono); color: #f8fafc; letter-spacing: 1px;">
                  📍 ${currentItem.bin}
                </div>
              </div>

              <!-- Target Item Details -->
              <div style="background: rgba(15, 23, 42, 0.9); border: 1px solid #334155; border-radius: 8px; padding: 0.75rem; margin-bottom: 1rem;">
                <div style="font-size: 0.7rem; color: #94a3b8; text-transform: uppercase;">Target SKU</div>
                <div style="font-weight: 700; color: #00f2fe; font-family: var(--font-mono); font-size: 0.95rem;">${currentItem.sku}</div>
                <div style="font-size: 0.85rem; font-weight: 600; margin: 2px 0 6px 0;">${currentItem.name}</div>
                <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.4); padding: 4px 8px; border-radius: 4px;">
                  <span style="font-size: 0.75rem; color: #94a3b8;">Required Pick Qty:</span>
                  <span style="font-weight: 800; font-size: 1.1rem; color: #10b981;">
                    ${currentItem.qtyAllocated || currentItem.qtyRequested} units
                  </span>
                </div>
              </div>

              <!-- Interactive Scan Actions -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 0.75rem;">
                <button id="btn-scan-bin-match" class="btn btn-secondary btn-sm" style="font-size: 0.75rem;">
                  📷 Scan Bin [${currentItem.bin}]
                </button>
                <button id="btn-scan-sku-match" class="btn btn-primary btn-sm" style="font-size: 0.75rem;">
                  ⚡ Scan & Pick SKU
                </button>
              </div>

              <!-- Exception Fast Buttons -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                <button id="btn-report-damaged" class="btn btn-outline-primary btn-sm" style="border-color: #ef4444; color: #ef4444; font-size: 0.7rem;">
                  ⚠️ Damaged Item
                </button>
                <button id="btn-report-missing" class="btn btn-outline-primary btn-sm" style="border-color: #f59e0b; color: #f59e0b; font-size: 0.7rem;">
                  🔍 Missing Stock
                </button>
              </div>
            `}
          </div>
        </div>

        <!-- Right: Pick Wave Queue & Active Route Summary -->
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <!-- Active Wave Queue Selector -->
          <div class="glass-panel" style="padding: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <h3 style="font-size: 1rem;">Active Picking Queue</h3>
              <span class="badge badge-info">${pickingOrders.length} In Queue</span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 0.6rem;">
              ${pickingOrders.map(ord => `
                <div class="order-queue-item ${ord.id === order.id ? 'active-queue-item' : ''}" 
                     data-order-id="${ord.id}"
                     style="background: ${ord.id === order.id ? 'rgba(0, 242, 254, 0.12)' : 'var(--bg-tertiary)'}; 
                            border: 1px solid ${ord.id === order.id ? 'var(--brand-primary)' : 'var(--border-subtle)'}; 
                            border-radius: var(--radius-md); padding: 0.75rem; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="font-weight: 700; font-family: var(--font-mono); color: #fff;">${ord.orderNumber}</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">${ord.customer.name}</div>
                  </div>
                  <div style="text-align: right;">
                    <span class="badge badge-${ord.priority === 'CRITICAL' ? 'danger' : 'warning'}">${ord.priority}</span>
                    <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;">${ord.items.length} items</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Pick Checklist -->
          <div class="glass-panel" style="padding: 1.25rem;">
            <h3 style="font-size: 1rem; margin-bottom: 0.75rem;">Wave Item Manifest</h3>
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
              ${items.map((item, idx) => {
                const picked = (item.qtyPicked || 0) >= (item.qtyAllocated || item.qtyRequested);
                return `
                  <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-tertiary); padding: 0.6rem 0.85rem; border-radius: var(--radius-md); border-left: 3px solid ${picked ? 'var(--status-success)' : 'var(--status-warning)'};">
                    <div>
                      <div style="font-weight: 600; font-size: 0.85rem;">${item.name}</div>
                      <div style="font-size: 0.75rem; color: var(--text-secondary); font-family: var(--font-mono);">
                        ${item.sku} • Bin: <span style="color: var(--brand-primary);">${item.bin}</span>
                      </div>
                    </div>
                    <div style="text-align: right;">
                      <div style="font-weight: 700; font-family: var(--font-mono); font-size: 0.9rem; color: ${picked ? '#10b981' : '#f59e0b'};">
                        ${item.qtyPicked || 0} / ${item.qtyAllocated || item.qtyRequested}
                      </div>
                      <div style="font-size: 0.7rem; color: var(--text-muted);">${picked ? '✅ Picked' : '⏳ Pending'}</div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners(order, currentItem);
  }

  attachEventListeners(order, currentItem) {
    // Queue item selection
    const queueItems = this.container.querySelectorAll('.order-queue-item');
    queueItems.forEach(item => {
      item.addEventListener('click', () => {
        const orderId = item.getAttribute('data-order-id');
        this.setOrder(orderId);
      });
    });

    // Scan Bin
    const btnScanBin = document.getElementById("btn-scan-bin-match");
    if (btnScanBin) {
      btnScanBin.addEventListener('click', () => {
        soundFx.playScanBeep();
        state.showToast(`Bin ${currentItem.bin} verified in ${currentItem.zone}!`, "info");
      });
    }

    // Scan SKU & Confirm Pick
    const btnScanSku = document.getElementById("btn-scan-sku-match");
    if (btnScanSku) {
      btnScanSku.addEventListener('click', () => {
        soundFx.playScanBeep();
        const requiredQty = currentItem.qtyAllocated || currentItem.qtyRequested;
        currentItem.qtyPicked = requiredQty;
        
        // Deduct from physical on-hand & allocated
        state.updateProductStock(currentItem.sku, -requiredQty, -requiredQty);

        state.addActivityLog(
          "ITEM_PICKED",
          `Picker Alex scanned and picked ${requiredQty}x ${currentItem.sku} from ${currentItem.bin}`,
          "Picker Terminal"
        );

        if (this.currentStepIndex < order.items.length - 1) {
          this.currentStepIndex++;
          state.showToast(`Item verified. Proceeding to next bin.`, "success");
        } else {
          soundFx.playSuccessChime();
          state.showToast(`All items picked for ${order.orderNumber}!`, "success");
        }

        this.render();
      });
    }

    // Report Damaged
    const btnReportDamaged = document.getElementById("btn-report-damaged");
    if (btnReportDamaged) {
      btnReportDamaged.addEventListener('click', () => {
        state.addException({
          type: "DAMAGED_ITEM_PICK",
          severity: "WARNING",
          title: `Damaged item discovered at ${currentItem.bin}`,
          description: `Picker detected physical damage on ${currentItem.sku} during pick wave for ${order.orderNumber}.`,
          sku: currentItem.sku,
          bin: currentItem.bin,
          affectedOrders: [order.id],
          suggestedAction: "Quarantine damaged unit and reallocate from adjacent bin."
        });
        this.render();
      });
    }

    // Report Missing
    const btnReportMissing = document.getElementById("btn-report-missing");
    if (btnReportMissing) {
      btnReportMissing.addEventListener('click', () => {
        state.addException({
          type: "MISSING_STOCK_BIN",
          severity: "CRITICAL",
          title: `Inventory discrepancy at Bin ${currentItem.bin}`,
          description: `Expected units for ${currentItem.sku} not physically found in bin ${currentItem.bin}.`,
          sku: currentItem.sku,
          bin: currentItem.bin,
          affectedOrders: [order.id],
          suggestedAction: "Trigger supervisor Cycle Count audit."
        });
        this.render();
      });
    }

    // Route to Packing Station
    const btnRouteToPacking = document.getElementById("btn-route-to-packing");
    if (btnRouteToPacking) {
      btnRouteToPacking.addEventListener('click', () => {
        state.updateOrderStatus(order.id, "PACKING", {
          packingStationAssigned: "PK-01"
        });
        soundFx.playSuccessChime();
        state.showToast(`Order ${order.orderNumber} routed to Packing Station PK-01!`, "success");
        
        // Auto navigate to packing tab
        const packTab = document.querySelector('[data-tab="packing"]');
        if (packTab) packTab.click();
      });
    }
  }
}
