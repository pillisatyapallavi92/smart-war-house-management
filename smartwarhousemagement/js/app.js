/**
 * NexusWMS - Main Application Controller, Routing & UI Assembly
 */
import { state } from './state.js';
import { soundFx } from './config.js';
import { DecisionEngine } from './decision-engine.js';
import { WarehouseDigitalTwin } from './warehouse-twin.js';
import { PickerTerminal } from './picker-terminal.js';
import { PackingStation } from './packing-station.js';
import { ExceptionCenter } from './exception-center.js';
import { DispatchDockManager } from './dispatch-dock.js';
import { AnalyticsCockpit } from './analytics.js';
import { ChaosSimulator } from './chaos-simulator.js';

class NexusApp {
  constructor() {
    this.currentTab = 'orders';
    this.digitalTwin = null;
    this.pickerTerminal = null;
    this.packingStation = null;
    this.exceptionCenter = null;
    this.dispatchManager = null;
    this.analyticsCockpit = null;
    this.chaosSimulator = null;
  }

  init() {
    this.initNavigation();
    this.initGlobalControls();
    this.initComponents();
    this.renderInventoryTab();
    this.renderOrdersTab();
    this.initModals();

    // Subscribe to state changes
    state.subscribe("inventory_updated", () => this.renderInventoryTab());
    state.subscribe("order_updated", () => {
      this.renderOrdersTab();
      this.updateTabBadges();
    });
    state.subscribe("exception_added", () => this.updateTabBadges());
    state.subscribe("exception_resolved", () => this.updateTabBadges());

    this.updateTabBadges();
  }

  initComponents() {
    this.digitalTwin = new WarehouseDigitalTwin("warehouse-twin-canvas-wrapper");
    this.pickerTerminal = new PickerTerminal("picker-terminal-wrapper");
    this.packingStation = new PackingStation("packing-station-wrapper");
    this.exceptionCenter = new ExceptionCenter("exception-center-wrapper");
    this.dispatchManager = new DispatchDockManager("dispatch-dock-wrapper");
    this.analyticsCockpit = new AnalyticsCockpit("analytics-cockpit-wrapper");
    this.chaosSimulator = new ChaosSimulator("chaos-simulator-wrapper");
  }

  initNavigation() {
    const tabItems = document.querySelectorAll('.tab-item');
    tabItems.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.getAttribute('data-tab');
        this.switchTab(targetTab);
      });
    });
  }

  switchTab(tabId) {
    this.currentTab = tabId;

    // Update active tab header
    document.querySelectorAll('.tab-item').forEach(t => {
      if (t.getAttribute('data-tab') === tabId) t.classList.add('active');
      else t.classList.remove('active');
    });

    // Update view container
    document.querySelectorAll('.tab-view').forEach(v => {
      if (v.id === `view-${tabId}`) v.classList.add('active');
      else v.classList.remove('active');
    });

    // Lifecycle hooks for specific views
    if (tabId === 'twin' && this.digitalTwin) {
      this.digitalTwin.render();
    } else if (tabId === 'picker' && this.pickerTerminal) {
      this.pickerTerminal.render();
    } else if (tabId === 'packing' && this.packingStation) {
      this.packingStation.render();
    } else if (tabId === 'exceptions' && this.exceptionCenter) {
      this.exceptionCenter.render();
    } else if (tabId === 'dispatch' && this.dispatchManager) {
      this.dispatchManager.render();
    } else if (tabId === 'analytics' && this.analyticsCockpit) {
      this.analyticsCockpit.render();
    } else if (tabId === 'sandbox' && this.chaosSimulator) {
      this.chaosSimulator.render();
    }
  }

  updateTabBadges() {
    const openExceptions = state.exceptions.filter(e => e.status === "OPEN").length;
    const badgeExc = document.getElementById("badge-tab-exceptions");
    if (badgeExc) {
      badgeExc.textContent = openExceptions;
      badgeExc.style.display = openExceptions > 0 ? 'inline-flex' : 'none';
      if (openExceptions > 0) badgeExc.classList.add('animate-pulse-danger');
      else badgeExc.classList.remove('animate-pulse-danger');
    }

    const pickingCount = state.orders.filter(o => o.status === "PICKING").length;
    const badgePick = document.getElementById("badge-tab-picker");
    if (badgePick) {
      badgePick.textContent = pickingCount;
      badgePick.style.display = pickingCount > 0 ? 'inline-flex' : 'none';
    }

    const packingCount = state.orders.filter(o => o.status === "PACKING").length;
    const badgePack = document.getElementById("badge-tab-packing");
    if (badgePack) {
      badgePack.textContent = packingCount;
      badgePack.style.display = packingCount > 0 ? 'inline-flex' : 'none';
    }

    const dispatchCount = state.orders.filter(o => o.status === "READY_FOR_DISPATCH").length;
    const badgeDisp = document.getElementById("badge-tab-dispatch");
    if (badgeDisp) {
      badgeDisp.textContent = dispatchCount;
      badgeDisp.style.display = dispatchCount > 0 ? 'inline-flex' : 'none';
    }
  }

  initGlobalControls() {
    // Sound FX toggle
    const soundBtn = document.getElementById("btn-toggle-sound");
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        soundFx.enabled = !soundFx.enabled;
        soundBtn.innerHTML = soundFx.enabled ? '🔊 Audio ON' : '🔇 Audio OFF';
        state.showToast(`Sound FX ${soundFx.enabled ? 'Enabled' : 'Muted'}`, "info");
      });
    }

    // Global Sim Run toggle
    const simBtn = document.getElementById("btn-toggle-sim-global");
    if (simBtn) {
      simBtn.addEventListener('click', () => {
        if (this.chaosSimulator) {
          this.chaosSimulator.toggleSimulation();
        }
      });
    }

    // Heatmap button in Digital Twin tab
    const btnHeatmap = document.getElementById("btn-toggle-heatmap");
    if (btnHeatmap) {
      btnHeatmap.addEventListener('click', () => {
        if (this.digitalTwin) {
          const active = this.digitalTwin.toggleHeatmap();
          btnHeatmap.innerHTML = active ? '🔥 Heatmap ON' : '🗺️ Heatmap OFF';
        }
      });
    }

    // New Order Modal button
    const btnCreateOrder = document.getElementById("btn-open-create-order");
    if (btnCreateOrder) {
      btnCreateOrder.addEventListener('click', () => this.openCreateOrderModal());
    }
  }

  initModals() {
    const modal = document.getElementById("generic-modal");
    const closeBtn = document.getElementById("generic-modal-close");

    if (modal && closeBtn) {
      closeBtn.addEventListener('click', () => modal.classList.remove('active'));
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
      });
    }
  }

  renderInventoryTab() {
    const container = document.getElementById("inventory-table-tbody");
    if (!container) return;

    const products = state.products || [];
    container.innerHTML = products.map(p => {
      const avail = p.stockOnHand - p.stockAllocated;
      const stockPct = Math.min(100, Math.round((p.stockOnHand / p.maxCapacity) * 100));
      
      let badgeClass = "success";
      if (p.status === "CRITICAL" || p.status === "OUT_OF_STOCK") badgeClass = "danger";
      else if (p.status === "LOW_STOCK") badgeClass = "warning";

      return `
        <tr>
          <td>
            <div style="font-weight: 700; font-family: var(--font-mono); color: var(--brand-primary);">${p.id}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${p.barcode}</div>
          </td>
          <td>
            <div style="font-weight: 600;">${p.name}</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary);">${p.category} • ${p.temperatureReq}</div>
          </td>
          <td>
            <div style="font-weight: 700; font-family: var(--font-mono); color: #fff;">${p.bin}</div>
            <div style="font-size: 0.75rem; color: var(--brand-secondary);">${p.zone} (${p.aisle})</div>
          </td>
          <td>
            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 2px;">
              <span><strong>${p.stockOnHand}</strong> on hand</span>
              <span style="color: var(--text-muted);">${p.maxCapacity} max</span>
            </div>
            <div class="stock-bar-wrap">
              <div class="stock-bar-fill ${p.stockOnHand <= p.safetyStock ? 'stock-fill-danger' : (p.stockOnHand <= p.reorderPoint ? 'stock-fill-warning' : 'stock-fill-healthy')}" style="width: ${stockPct}%;"></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;">
              <span>Alloc: ${p.stockAllocated}</span>
              <span>Avail: <strong style="color: #10b981;">${avail}</strong></span>
            </div>
          </td>
          <td>
            <span class="badge badge-${badgeClass}">${p.status}</span>
            <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;">ROP: ${p.reorderPoint}</div>
          </td>
          <td style="text-align: right;">
            <div style="display: inline-flex; gap: 0.4rem;">
              <button class="btn btn-secondary btn-sm btn-inspect-sku" data-sku="${p.id}">
                🔍 Details
              </button>
              <button class="btn btn-outline-primary btn-sm btn-quick-stock-adjust" data-sku="${p.id}">
                ⚡ Restock
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach SKU inspection
    container.querySelectorAll('.btn-inspect-sku').forEach(btn => {
      btn.addEventListener('click', () => {
        const sku = btn.getAttribute('data-sku');
        const prod = state.getProductById(sku);
        if (prod && this.digitalTwin) {
          this.digitalTwin.inspectBin(prod.bin);
        }
      });
    });

    // Quick stock restock
    container.querySelectorAll('.btn-quick-stock-adjust').forEach(btn => {
      btn.addEventListener('click', () => {
        const sku = btn.getAttribute('data-sku');
        state.updateProductStock(sku, 20, 0);
        soundFx.playSuccessChime();
        state.showToast(`Restocked +20 units for ${sku}!`, "success");
      });
    });
  }

  renderOrdersTab() {
    const container = document.getElementById("orders-table-tbody");
    if (!container) return;

    const orders = state.orders || [];

    // Recalculate priority scores dynamically
    orders.forEach(ord => {
      ord.priorityScore = DecisionEngine.calculatePriorityScore(ord);
    });

    // Sort by priority score descending
    orders.sort((a, b) => b.priorityScore - a.priorityScore);

    container.innerHTML = orders.map(ord => {
      const itemsSummary = (ord.items || []).map(i => `${i.qtyRequested}x ${i.name}`).join(', ');
      
      let statusBadge = "info";
      if (ord.status === "PENDING_ALLOCATION" || ord.status === "CREATED") statusBadge = "warning";
      else if (ord.status === "PICKING") statusBadge = "cyan";
      else if (ord.status === "PACKING") statusBadge = "purple";
      else if (ord.status === "READY_FOR_DISPATCH" || ord.status === "DISPATCHED") statusBadge = "success";
      else if (ord.status === "BACKORDERED") statusBadge = "danger";

      return `
        <tr>
          <td>
            <div style="font-weight: 800; font-family: var(--font-mono); color: var(--brand-primary);">${ord.orderNumber}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${ord.slaType}</div>
          </td>
          <td>
            <div style="display: flex; align-items: center; gap: 0.4rem;">
              <span class="badge badge-${ord.customer.tier === 'PLATINUM' ? 'purple' : (ord.customer.tier === 'GOLD' ? 'warning' : 'neutral')}" style="font-size: 0.65rem;">
                ${ord.customer.tier}
              </span>
              <strong style="color: #fff;">${ord.customer.name}</strong>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
              Penalty risk: $${ord.customer.contractSlaPenaltyRatePerHour || 0}/hr
            </div>
          </td>
          <td>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <div style="font-family: var(--font-heading); font-size: 1.1rem; font-weight: 800; color: ${ord.priorityScore >= 90 ? '#ef4444' : (ord.priorityScore >= 70 ? '#f59e0b' : '#3b82f6')};">
                ${ord.priorityScore}
              </div>
              <span class="badge badge-${ord.priority === 'CRITICAL' ? 'danger' : (ord.priority === 'HIGH' ? 'warning' : 'info')}" style="font-size: 0.65rem;">
                ${ord.priority}
              </span>
            </div>
            <div style="font-size: 0.7rem; color: #f87171; font-family: var(--font-mono); margin-top: 2px;">
              ⏱️ ${ord.slaMinutesRemaining}m left
            </div>
          </td>
          <td style="max-width: 260px;">
            <div style="font-size: 0.85rem; font-weight: 600; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
              ${itemsSummary}
            </div>
            <div style="font-size: 0.75rem; color: var(--brand-secondary); font-family: var(--font-mono);">
              ${(ord.items || []).length} SKU lines
            </div>
          </td>
          <td>
            <span class="badge badge-${statusBadge}">${ord.status}</span>
            ${ord.waveAssigned ? `<div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;">Wave: ${ord.waveAssigned}</div>` : ''}
          </td>
          <td style="text-align: right;">
            <div style="display: inline-flex; gap: 0.4rem;">
              ${ord.status === 'PENDING_ALLOCATION' || ord.status === 'CREATED' ? `
                <button class="btn btn-primary btn-sm btn-allocate-order" data-order-id="${ord.id}">
                  🧠 Smart Allocate
                </button>
              ` : ord.status === 'PICKING' ? `
                <button class="btn btn-secondary btn-sm btn-view-route" data-order-id="${ord.id}">
                  🗺️ Pick Route
                </button>
              ` : `
                <button class="btn btn-secondary btn-sm btn-view-order-details" data-order-id="${ord.id}">
                  👁️ Inspect
                </button>
              `}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Allocate order button
    container.querySelectorAll('.btn-allocate-order').forEach(btn => {
      btn.addEventListener('click', () => {
        const orderId = btn.getAttribute('data-order-id');
        const order = state.getOrderById(orderId);
        if (!order) return;

        // Check if any items have a stock shortage conflict
        const conflictItem = order.items.find(i => {
          const p = state.getProductById(i.sku);
          return p && (p.stockOnHand - p.stockAllocated) < i.qtyRequested;
        });

        if (conflictItem) {
          // Trigger the Conflict Arbitration Matrix
          if (this.exceptionCenter) {
            const excTab = document.querySelector('[data-tab="exceptions"]');
            if (excTab) excTab.click();
            setTimeout(() => {
              this.exceptionCenter.openConflictArbitrationModal(conflictItem.sku);
            }, 100);
          }
        } else {
          // Standard auto-allocation
          order.items.forEach(i => {
            i.qtyAllocated = i.qtyRequested;
            state.updateProductStock(i.sku, 0, i.qtyRequested);
          });
          state.updateOrderStatus(order.id, "PICKING", { waveAssigned: "WAVE-AUTO-01" });
          soundFx.playSuccessChime();
          state.showToast(`Order ${order.orderNumber} stock allocated & assigned to Wave!`, "success");
        }
      });
    });

    // View Route button
    container.querySelectorAll('.btn-view-route').forEach(btn => {
      btn.addEventListener('click', () => {
        const orderId = btn.getAttribute('data-order-id');
        const twinTab = document.querySelector('[data-tab="twin"]');
        if (twinTab) twinTab.click();
        if (this.digitalTwin) {
          this.digitalTwin.setRouteOrder(orderId);
          state.showToast(`TSP Pick Path calculated for Order!`, "info");
        }
      });
    });
  }

  openCreateOrderModal() {
    const modal = document.getElementById("generic-modal");
    const modalTitle = document.getElementById("generic-modal-title");
    const modalBody = document.getElementById("generic-modal-body");

    if (!modal || !modalTitle || !modalBody) return;

    modalTitle.innerHTML = `🛒 Ingest New Customer Fulfillment Order`;

    modalBody.innerHTML = `
      <form id="form-create-order" style="display: flex; flex-direction: column; gap: 1rem;">
        <div class="grid-2col">
          <div class="form-group">
            <label class="form-label">Customer Company Name</label>
            <input type="text" id="inp-cust-name" class="form-input" value="BioTech Global Therapeutics" required>
          </div>
          <div class="form-group">
            <label class="form-label">Customer VIP Tier</label>
            <select id="inp-cust-tier" class="form-select">
              <option value="PLATINUM">Platinum (VIP SLA Guarantee)</option>
              <option value="GOLD">Gold Tier</option>
              <option value="SILVER">Silver Tier</option>
              <option value="STANDARD">Standard</option>
            </select>
          </div>
        </div>

        <div class="grid-2col">
          <div class="form-group">
            <label class="form-label">Select SKU</label>
            <select id="inp-order-sku" class="form-select">
              ${state.products.map(p => `
                <option value="${p.id}">${p.id} - ${p.name} (Stock: ${p.stockOnHand})</option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Quantity Demanded</label>
            <input type="number" id="inp-order-qty" class="form-input" min="1" max="100" value="8" required>
          </div>
        </div>

        <div class="grid-2col">
          <div class="form-group">
            <label class="form-label">SLA Window Urgency</label>
            <select id="inp-order-sla" class="form-select">
              <option value="45">⚡ 45 Minutes (Same-Day Express)</option>
              <option value="120">⏱️ 2 Hours (Priority Air)</option>
              <option value="360">🚚 6 Hours (Standard Ground)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Hourly Penalty Rate ($/hr)</label>
            <input type="number" id="inp-order-penalty" class="form-input" value="150">
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1rem;">
          <button type="submit" class="btn btn-primary btn-lg" style="width: 100%;">
            🚀 Ingest & Score Order
          </button>
        </div>
      </form>
    `;

    modal.classList.add("active");

    const form = document.getElementById("form-create-order");
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const sku = document.getElementById("inp-order-sku").value;
      const qty = parseInt(document.getElementById("inp-order-qty").value, 10);
      const tier = document.getElementById("inp-cust-tier").value;
      const custName = document.getElementById("inp-cust-name").value;
      const slaMin = parseInt(document.getElementById("inp-order-sla").value, 10);
      const penalty = parseInt(document.getElementById("inp-order-penalty").value, 10);

      const prod = state.getProductById(sku);

      const newOrder = {
        id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        orderNumber: `#${Math.floor(1000 + Math.random() * 9000)}`,
        customer: { name: custName, tier, contractSlaPenaltyRatePerHour: penalty },
        priority: slaMin <= 60 || tier === "PLATINUM" ? "CRITICAL" : "HIGH",
        priorityScore: 85,
        slaMinutesRemaining: slaMin,
        slaType: slaMin <= 60 ? "SAME_DAY_EXPRESS" : "STANDARD_GROUND",
        createdAt: new Date().toISOString(),
        status: "PENDING_ALLOCATION",
        items: [
          {
            sku: prod.id,
            name: prod.name,
            qtyRequested: qty,
            qtyAllocated: 0,
            qtyPicked: 0,
            unitPrice: prod.unitPrice,
            zone: prod.zone,
            bin: prod.bin
          }
        ],
        carrier: slaMin <= 60 ? "FedEx Priority Overnight" : "UPS Ground",
        dockAssigned: "Dock 1"
      };

      state.orders.unshift(newOrder);
      soundFx.playSuccessChime();
      state.showToast(`Ingested Order ${newOrder.orderNumber} for ${custName}!`, "success");
      modal.classList.remove("active");
      this.renderOrdersTab();
    });
  }
}

// Global bootstrap
window.addEventListener('DOMContentLoaded', () => {
  window.nexusApp = new NexusApp();
  window.nexusApp.init();
});
