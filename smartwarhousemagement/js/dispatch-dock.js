/**
 * NexusWMS - Order Dispatch, Carrier Dock Scheduling & Printable Shipping Manifests
 */
import { state } from './state.js';
import { soundFx } from './config.js';

export class DispatchDockManager {
  constructor(containerId) {
    this.container = document.getElementById(containerId);

    if (this.container) {
      this.init();
    }
  }

  init() {
    this.render();

    state.subscribe("order_updated", () => this.render());
  }

  render() {
    if (!this.container) return;

    const readyOrders = state.orders.filter(o => o.status === "READY_FOR_DISPATCH");
    const dispatchedOrders = state.orders.filter(o => o.status === "DISPATCHED");
    const dockDoors = state.dockDoors || [];

    this.container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <!-- Dock Doors Header Grid -->
        <div class="grid-kpi" style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));">
          ${dockDoors.map(dock => `
            <div class="kpi-card" style="border-top: 3px solid ${dock.status === 'OCCUPIED' ? 'var(--brand-primary)' : (dock.status === 'SCHEDULED' ? 'var(--status-warning)' : 'var(--border-subtle)')};">
              <div class="kpi-card-header">
                <span class="kpi-title">${dock.name}</span>
                <span class="badge badge-${dock.status === 'OCCUPIED' ? 'cyan' : (dock.status === 'SCHEDULED' ? 'warning' : 'neutral')}">
                  ${dock.status}
                </span>
              </div>
              <div style="font-weight: 700; font-size: 1.05rem; color: #fff; margin-top: 4px;">
                ${dock.carrier}
              </div>
              <div class="kpi-footer" style="justify-content: space-between; margin-top: 6px;">
                <span>Truck Status: <strong style="color: #cbd5e1;">${dock.truckEta}</strong></span>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Orders Ready for Staging & Loading -->
        <div class="glass-panel" style="padding: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
            <div>
              <h3 style="font-size: 1.15rem;">Staged Shipments Awaiting Dispatch</h3>
              <p style="font-size: 0.8rem; color: var(--text-secondary);">Packages verified, weighed and queued for dock door loading.</p>
            </div>
            <button id="btn-print-full-manifest" class="btn btn-secondary btn-sm">
              📄 Generate Full Daily Manifest
            </button>
          </div>

          ${readyOrders.length === 0 ? `
            <div style="text-align: center; padding: 2rem; color: var(--text-muted); background: var(--bg-tertiary); border-radius: var(--radius-md);">
              📦 No orders currently waiting in staging bay. Complete packing in Packing Station tab.
            </div>
          ` : `
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer & SLA</th>
                    <th>Carrier & Gate</th>
                    <th>Weight / Box</th>
                    <th>Tracking #</th>
                    <th style="text-align: right;">Dispatch Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${readyOrders.map(ord => `
                    <tr>
                      <td class="font-mono" style="font-weight: 700; color: var(--brand-primary);">${ord.orderNumber}</td>
                      <td>
                        <div style="font-weight: 600;">${ord.customer.name}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${ord.slaType}</div>
                      </td>
                      <td>
                        <div style="font-weight: 600;">${ord.carrier}</div>
                        <div style="font-size: 0.75rem; color: var(--brand-secondary); font-family: var(--font-mono);">${ord.dockAssigned || 'Dock 1'}</div>
                      </td>
                      <td class="font-mono">${ord.grossWeightKg || 1.8} kg <br><span style="font-size: 0.7rem; color: var(--text-muted);">Medium Box</span></td>
                      <td class="font-mono text-cyan" style="font-size: 0.8rem;">${ord.trackingNumber || 'FDX-88219-US'}</td>
                      <td style="text-align: right;">
                        <div style="display: inline-flex; gap: 0.5rem;">
                          <button class="btn btn-secondary btn-sm btn-print-label" data-order-id="${ord.id}">
                            🏷️ Label
                          </button>
                          <button class="btn btn-success btn-sm btn-dispatch-now" data-order-id="${ord.id}">
                            🚚 Dispatch
                          </button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>

        <!-- Dispatched Stream History -->
        <div class="glass-panel" style="padding: 1.5rem;">
          <h3 style="font-size: 1.1rem; margin-bottom: 0.75rem;">Recently Dispatched Fleet Vehicles</h3>
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            ${dispatchedOrders.map(ord => `
              <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-tertiary); padding: 0.75rem 1rem; border-radius: var(--radius-md);">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <span style="font-size: 1.2rem;">🚚</span>
                  <div>
                    <span class="font-mono font-bold text-cyan">${ord.orderNumber}</span>
                    <span style="color: var(--text-muted);"> • ${ord.customer.name}</span>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">Carrier: ${ord.carrier} • Tracking: <span class="font-mono">${ord.trackingNumber || 'N/A'}</span></div>
                  </div>
                </div>
                <div style="text-align: right;">
                  <span class="badge badge-success">IN TRANSIT</span>
                  <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;">
                    ${ord.dispatchedAt ? new Date(ord.dispatchedAt).toLocaleTimeString() : 'Recently'}
                  </div>
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
    // Print Label click
    const labelBtns = this.container.querySelectorAll('.btn-print-label');
    labelBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const orderId = btn.getAttribute('data-order-id');
        this.openShippingLabelModal(orderId);
      });
    });

    // Dispatch action
    const dispatchBtns = this.container.querySelectorAll('.btn-dispatch-now');
    dispatchBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const orderId = btn.getAttribute('data-order-id');
        const order = state.getOrderById(orderId);
        if (order) {
          state.updateOrderStatus(orderId, "DISPATCHED", {
            dispatchedAt: new Date().toISOString()
          });
          soundFx.playSuccessChime();
          state.showToast(`🚚 Order ${order.orderNumber} dispatched via ${order.carrier}!`, "success");
          this.render();
        }
      });
    });

    // Print full manifest
    const manifestBtn = document.getElementById("btn-print-full-manifest");
    if (manifestBtn) {
      manifestBtn.addEventListener('click', () => {
        this.openManifestModal();
      });
    }
  }

  openShippingLabelModal(orderId) {
    const order = state.getOrderById(orderId);
    if (!order) return;

    const modal = document.getElementById("generic-modal");
    const modalTitle = document.getElementById("generic-modal-title");
    const modalBody = document.getElementById("generic-modal-body");

    if (!modal || !modalTitle || !modalBody) return;

    modalTitle.innerHTML = `🏷️ GS1-128 Compliant Shipping Label: <span class="font-mono text-cyan">${order.orderNumber}</span>`;

    modalBody.innerHTML = `
      <div id="printable-shipping-label" style="background: #ffffff; color: #000000; padding: 1.5rem; border-radius: 8px; font-family: 'Inter', sans-serif; max-width: 480px; margin: 0 auto; border: 2px solid #000;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 8px;">
          <div>
            <div style="font-weight: 900; font-size: 1.2rem; font-family: 'Outfit', sans-serif;">NEXUS LOGISTICS</div>
            <div style="font-size: 0.7rem;">Apex Hub #04, Tech Highway</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 800; font-size: 1.1rem;">${order.carrier.split(' ')[0].toUpperCase()}</div>
            <div style="font-size: 0.75rem; font-weight: 700;">PRIORITY OVERNIGHT</div>
          </div>
        </div>

        <!-- Ship To -->
        <div style="border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 8px;">
          <div style="font-size: 0.65rem; font-weight: 700; text-transform: uppercase;">SHIP TO:</div>
          <div style="font-weight: 800; font-size: 1rem;">${order.customer.name}</div>
          <div style="font-size: 0.85rem;">${order.shippingAddress || '100 Gateway Boulevard, Hub 4'}</div>
        </div>

        <!-- Package Specs -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 8px; font-size: 0.8rem;">
          <div>WEIGHT: <strong>${order.grossWeightKg || 1.82} KG</strong></div>
          <div>DOCK DOOR: <strong>${order.dockAssigned || 'Dock 1'}</strong></div>
          <div>ORDER: <strong>${order.orderNumber}</strong></div>
          <div>DATE: <strong>${new Date().toISOString().split('T')[0]}</strong></div>
        </div>

        <!-- Barcode Representation -->
        <div style="text-align: center; padding: 12px 0;">
          <div class="barcode-visual" style="font-size: 2.2rem; font-weight: 400;">*${order.trackingNumber || 'FDX88219US'}*</div>
          <div style="font-family: monospace; font-size: 0.85rem; font-weight: 700; letter-spacing: 2px; margin-top: 4px;">
            (420) 90210 (92) ${order.trackingNumber || 'FDX-88219-US'}
          </div>
        </div>
      </div>

      <div style="margin-top: 1.25rem; display: flex; justify-content: flex-end; gap: 0.75rem;">
        <button class="btn btn-primary" onclick="window.print()">
          🖨️ Print Label
        </button>
      </div>
    `;

    modal.classList.add("active");
  }

  openManifestModal() {
    const modal = document.getElementById("generic-modal");
    const modalTitle = document.getElementById("generic-modal-title");
    const modalBody = document.getElementById("generic-modal-body");

    if (!modal || !modalTitle || !modalBody) return;

    modalTitle.innerHTML = `📄 Outbound Carrier Dispatch Manifest`;

    const allDispatched = state.orders.filter(o => o.status === "DISPATCHED" || o.status === "READY_FOR_DISPATCH");

    modalBody.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-secondary); background: var(--bg-tertiary); padding: 0.75rem; border-radius: var(--radius-md);">
          <div>Facility: <strong>Apex Core Hub #04</strong></div>
          <div>Date: <strong>${new Date().toLocaleDateString()}</strong></div>
          <div>Total Shipments: <strong>${allDispatched.length}</strong></div>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Recipient</th>
                <th>Carrier</th>
                <th>Tracking</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${allDispatched.map(o => `
                <tr>
                  <td class="font-mono font-bold">${o.orderNumber}</td>
                  <td>${o.customer.name}</td>
                  <td>${o.carrier}</td>
                  <td class="font-mono text-cyan">${o.trackingNumber || 'PENDING'}</td>
                  <td><span class="badge badge-${o.status === 'DISPATCHED' ? 'success' : 'warning'}">${o.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
          <button class="btn btn-primary" onclick="window.print()">
            🖨️ Print Manifest
          </button>
        </div>
      </div>
    `;

    modal.classList.add("active");
  }
}
