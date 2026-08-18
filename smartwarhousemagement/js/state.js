/**
 * NexusWMS - Reactive Central State Store & Event Bus
 */
import { INITIAL_PRODUCTS, INITIAL_ORDERS, WAREHOUSE_LAYOUT, soundFx } from './config.js';

class StateStore {
  constructor() {
    this.subscribers = new Map();
    this.loadInitialState();
  }

  loadInitialState() {
    const saved = localStorage.getItem('nexus_wms_state_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.products = parsed.products || INITIAL_PRODUCTS;
        this.orders = parsed.orders || INITIAL_ORDERS;
        this.exceptions = parsed.exceptions || this.getInitialExceptions();
        this.activityLog = parsed.activityLog || this.getInitialActivityLog();
        this.dockDoors = parsed.dockDoors || WAREHOUSE_LAYOUT.dockDoors;
        this.packingStations = parsed.packingStations || WAREHOUSE_LAYOUT.packingStations;
        this.pickers = parsed.pickers || WAREHOUSE_LAYOUT.pickers;
        this.activeSimScenario = parsed.activeSimScenario || null;
        this.simRunning = false;
        return;
      } catch (e) {
        console.warn('Failed to parse saved state, resetting to initial seed', e);
      }
    }

    this.resetToDefaults(false);
  }

  getInitialExceptions() {
    return [
      {
        id: "EXC-109",
        type: "STOCK_SHORTAGE_CONFLICT",
        severity: "CRITICAL",
        title: "Stock Shortage & Priority Conflict: SKU-EL-101",
        description: "Urgent Order #9821 demands 10 units of AeroShield NVMe 4TB, but only 7 units are available in Bin D-01-02. Competing Order #9822 demands 5 units.",
        sku: "SKU-EL-101",
        bin: "D-01-02",
        affectedOrders: ["ORD-9821", "ORD-9822"],
        status: "OPEN",
        suggestedAction: "Run AI Allocation Conflict Matrix to decide optimal split/preemption.",
        createdAt: new Date(Date.now() - 12 * 60000).toISOString(),
        resolvedAt: null,
        resolutionDetails: null
      },
      {
        id: "EXC-108",
        type: "DAMAGED_ITEM_PICK",
        severity: "WARNING",
        title: "Item Dropped During Pick in Aisle B-03",
        description: "1 unit of Kevlar Gloves carton torn/punctured during high-rack reach truck retrieve.",
        sku: "SKU-AM-301",
        bin: "B-03-03",
        affectedOrders: ["ORD-9815"],
        status: "OPEN",
        suggestedAction: "Quarantine damaged unit to Bin QUAR-01 and pull 1 reserve unit from B-03-04.",
        createdAt: new Date(Date.now() - 40 * 60000).toISOString(),
        resolvedAt: null,
        resolutionDetails: null
      }
    ];
  }

  getInitialActivityLog() {
    return [
      { id: "ACT-1", timestamp: new Date(Date.now() - 15 * 60000).toISOString(), type: "DISPATCH", text: "Order #9810 loaded into FedEx Dock 1 and manifest signed.", user: "Dispatcher Miller" },
      { id: "ACT-2", timestamp: new Date(Date.now() - 25 * 60000).toISOString(), type: "PACKING", text: "Order #9815 packed at Station PK-01; scale weight verified (1.82 kg).", user: "Packer Sarah" },
      { id: "ACT-3", timestamp: new Date(Date.now() - 35 * 60000).toISOString(), type: "ALLOCATION", text: "Urgent Order #9821 ingested: High SLA Risk ($250/hr breach penalty).", user: "AI Engine" },
      { id: "ACT-4", timestamp: new Date(Date.now() - 45 * 60000).toISOString(), type: "WARNING", text: "Stock shortage detected for SKU-EL-101. Total on hand = 7, Total demanded = 15.", user: "Inventory Guard" }
    ];
  }

  resetToDefaults(notify = true) {
    this.products = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
    this.orders = JSON.parse(JSON.stringify(INITIAL_ORDERS));
    this.exceptions = this.getInitialExceptions();
    this.activityLog = this.getInitialActivityLog();
    this.dockDoors = JSON.parse(JSON.stringify(WAREHOUSE_LAYOUT.dockDoors));
    this.packingStations = JSON.parse(JSON.stringify(WAREHOUSE_LAYOUT.packingStations));
    this.pickers = JSON.parse(JSON.stringify(WAREHOUSE_LAYOUT.pickers));
    this.activeSimScenario = null;
    this.simRunning = false;
    this.save();
    if (notify) {
      this.notify("state_reset", null);
      this.showToast("Warehouse state reset to default benchmark data.", "info");
    }
  }

  save() {
    const payload = {
      products: this.products,
      orders: this.orders,
      exceptions: this.exceptions,
      activityLog: this.activityLog,
      dockDoors: this.dockDoors,
      packingStations: this.packingStations,
      pickers: this.pickers,
      activeSimScenario: this.activeSimScenario
    };
    try {
      localStorage.setItem('nexus_wms_state_v1', JSON.stringify(payload));
    } catch (e) {
      console.warn("Storage quota exceeded or error saving state", e);
    }
  }

  subscribe(event, callback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, []);
    }
    this.subscribers.get(event).push(callback);
    return () => {
      const arr = this.subscribers.get(event) || [];
      this.subscribers.set(event, arr.filter(cb => cb !== callback));
    };
  }

  notify(event, data) {
    if (this.subscribers.has(event)) {
      this.subscribers.get(event).forEach(cb => cb(data));
    }
    // Also notify wildcard subscribers
    if (this.subscribers.has("*")) {
      this.subscribers.get("*").forEach(cb => cb({ event, data }));
    }
    this.save();
  }

  addActivityLog(type, text, user = "System AI") {
    const entry = {
      id: "ACT-" + Date.now().toString(36),
      timestamp: new Date().toISOString(),
      type,
      text,
      user
    };
    this.activityLog.unshift(entry);
    if (this.activityLog.length > 80) this.activityLog.pop();
    this.notify("activity_added", entry);
  }

  showToast(message, type = "info", duration = 4000) {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    
    let icon = "ℹ️";
    if (type === "success") icon = "✅";
    if (type === "warning") icon = "⚠️";
    if (type === "danger") icon = "🚨";

    toast.innerHTML = `
      <div style="font-size: 1.2rem;">${icon}</div>
      <div style="flex: 1;">
        <div style="font-weight: 600; font-size: 0.85rem;">${message}</div>
      </div>
    `;

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  getProductById(id) {
    return this.products.find(p => p.id === id);
  }

  getOrderById(id) {
    return this.orders.find(o => o.id === id || o.orderNumber === id);
  }

  updateProductStock(sku, deltaOnHand, deltaAllocated = 0) {
    const p = this.getProductById(sku);
    if (!p) return;
    p.stockOnHand = Math.max(0, p.stockOnHand + deltaOnHand);
    p.stockAllocated = Math.max(0, p.stockAllocated + deltaAllocated);
    
    // Auto status
    if (p.stockOnHand === 0) p.status = "OUT_OF_STOCK";
    else if (p.stockOnHand <= p.safetyStock) p.status = "CRITICAL";
    else if (p.stockOnHand <= p.reorderPoint) p.status = "LOW_STOCK";
    else p.status = "HEALTHY";

    this.notify("inventory_updated", p);
  }

  updateOrderStatus(orderId, newStatus, extraData = {}) {
    const order = this.getOrderById(orderId);
    if (!order) return;
    const oldStatus = order.status;
    order.status = newStatus;
    Object.assign(order, extraData);

    this.addActivityLog(
      "ORDER_STATUS",
      `Order ${order.orderNumber} transitioned from ${oldStatus} ➔ ${newStatus}`,
      "Lifecycle Engine"
    );
    this.notify("order_updated", order);
  }

  addException(exception) {
    const entry = {
      id: "EXC-" + Math.floor(100 + Math.random() * 900),
      createdAt: new Date().toISOString(),
      status: "OPEN",
      ...exception
    };
    this.exceptions.unshift(entry);
    this.addActivityLog("EXCEPTION_RAISED", `[${entry.severity}] ${entry.title}`, "Exception Guard");
    soundFx.playWarningTone();
    this.notify("exception_added", entry);
    this.showToast(`Exception Raised: ${entry.title}`, "danger");
    return entry;
  }

  resolveException(exceptionId, resolutionDetails, actionType = "RESOLVED") {
    const exc = this.exceptions.find(e => e.id === exceptionId);
    if (!exc) return;
    exc.status = "RESOLVED";
    exc.resolvedAt = new Date().toISOString();
    exc.resolutionDetails = resolutionDetails;
    exc.actionType = actionType;

    this.addActivityLog("EXCEPTION_RESOLVED", `Resolved ${exc.id}: ${resolutionDetails}`, "Supervisor");
    soundFx.playSuccessChime();
    this.notify("exception_resolved", exc);
    this.showToast(`Exception ${exc.id} resolved successfully!`, "success");
  }
}

export const state = new StateStore();
