/**
 * NexusWMS - Chaos Simulator & Hackathon Demo Sandbox
 */
import { state } from './state.js';
import { DecisionEngine } from './decision-engine.js';
import { soundFx } from './config.js';

export class ChaosSimulator {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.simTimer = null;
    this.simSpeed = 1;
    this.isRunning = false;

    if (this.container) {
      this.init();
    }
  }

  init() {
    this.render();
  }

  toggleSimulation() {
    this.isRunning = !this.isRunning;
    const dot = document.querySelector('.sim-status-dot');
    const simBtn = document.getElementById('btn-toggle-sim-global');

    if (this.isRunning) {
      if (dot) dot.classList.remove('paused');
      if (simBtn) simBtn.innerHTML = `⏸️ Pause Sim`;
      this.startSimTimer();
      state.showToast("Simulation Engine active (1x speed)", "info");
    } else {
      if (dot) dot.classList.add('paused');
      if (simBtn) simBtn.innerHTML = `▶️ Run Sim`;
      this.stopSimTimer();
      state.showToast("Simulation Engine paused", "info");
    }

    this.render();
  }

  startSimTimer() {
    this.stopSimTimer();
    const intervalMs = Math.max(1000, Math.floor(3000 / this.simSpeed));
    this.simTimer = setInterval(() => {
      this.tick();
    }, intervalMs);
  }

  stopSimTimer() {
    if (this.simTimer) {
      clearInterval(this.simTimer);
      this.simTimer = null;
    }
  }

  setSpeed(speed) {
    this.simSpeed = speed;
    if (this.isRunning) {
      this.startSimTimer();
    }
    this.render();
    state.showToast(`Simulation speed set to ${speed}x`, "info");
  }

  tick() {
    // 1. Advance SLAs
    state.orders.forEach(ord => {
      if (ord.status !== "DISPATCHED" && ord.slaMinutesRemaining > 0) {
        ord.slaMinutesRemaining = Math.max(0, ord.slaMinutesRemaining - 1);
        if (ord.slaMinutesRemaining === 15) {
          state.showToast(`⚠️ Urgent SLA Warning: Order ${ord.orderNumber} has only 15m remaining!`, "warning");
          soundFx.playWarningTone();
        }
      }
    });

    // 2. Advance Picking Orders
    const pickingOrders = state.orders.filter(o => o.status === "PICKING");
    pickingOrders.forEach(ord => {
      const unpickedItem = (ord.items || []).find(i => (i.qtyPicked || 0) < (i.qtyAllocated || i.qtyRequested));
      if (unpickedItem) {
        unpickedItem.qtyPicked = (unpickedItem.qtyPicked || 0) + 1;
        state.updateProductStock(unpickedItem.sku, -1, -1);
      } else {
        // Auto progress to PACKING
        state.updateOrderStatus(ord.id, "PACKING", { packingStationAssigned: "PK-01" });
        soundFx.playSuccessChime();
      }
    });

    state.notify("order_updated", null);
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <!-- Control Banner -->
        <div class="glass-panel" style="padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; border: 1px solid var(--border-glow); box-shadow: var(--shadow-neon-cyan);">
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 1.4rem;">⚡</span>
              <h2 style="font-size: 1.3rem;">Hackathon Live Simulation & Stress-Test Sandbox</h2>
            </div>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 2px;">
              Inject real-world operational challenges, stress-test the decision algorithms, and demonstrate edge cases.
            </p>
          </div>

          <!-- Speed & Ticking Controls -->
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <button id="btn-chaos-run" class="btn ${this.isRunning ? 'btn-warning' : 'btn-primary'}">
              ${this.isRunning ? '⏸️ Pause Engine' : '▶️ Start Live Engine'}
            </button>
            <button id="btn-chaos-step" class="btn btn-secondary">
              ⏭️ Step 1 Tick
            </button>
            <div style="display: flex; background: var(--bg-tertiary); border-radius: var(--radius-md); padding: 2px;">
              <button class="btn btn-sm ${this.simSpeed === 1 ? 'btn-primary' : 'btn-secondary'}" data-speed="1">1x</button>
              <button class="btn btn-sm ${this.simSpeed === 2 ? 'btn-primary' : 'btn-secondary'}" data-speed="2">2x</button>
              <button class="btn btn-sm ${this.simSpeed === 5 ? 'btn-primary' : 'btn-secondary'}" data-speed="5">5x</button>
            </div>
          </div>
        </div>

        <!-- 4 Hackathon Demo Scenarios Cards -->
        <div class="decision-grid" style="grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));">
          <!-- Scenario 1: The Problem Statement Stock Shortage -->
          <div class="glass-panel" style="padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between; border-top: 4px solid #00f2fe;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <span class="badge badge-cyan">🔥 THE HACKATHON DILEMMA</span>
                <span class="font-mono text-cyan" style="font-size: 0.75rem;">SCENARIO #01</span>
              </div>
              <h3 style="font-size: 1.1rem; color: #fff; margin-bottom: 0.5rem;">Stock Shortage & Priority Arbitration</h3>
              <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem; line-height: 1.4;">
                <strong>Prompt:</strong> Urgent Order #9821 demands 10 units of SKU-EL-101 ($250/hr SLA penalty). Lower priority Order #9822 demands 5 units. Only 7 units are physically in stock.
              </p>
            </div>
            <button id="btn-scenario-1" class="btn btn-primary" style="width: 100%;">
              🚀 Launch Scenario 1 (Open Decision Matrix)
            </button>
          </div>

          <!-- Scenario 2: Item Dropped & Broken during Pick -->
          <div class="glass-panel" style="padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between; border-top: 4px solid #f59e0b;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <span class="badge badge-warning">⚠️ DAMAGE EXCEPTION</span>
                <span class="font-mono" style="font-size: 0.75rem; color: var(--text-muted);">SCENARIO #02</span>
              </div>
              <h3 style="font-size: 1.1rem; color: #fff; margin-bottom: 0.5rem;">Mid-Pick Fragile Damage & Auto-Reroute</h3>
              <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem; line-height: 1.4;">
                A cold-chain diagnostic kit is dropped in Aisle C-02 during pick wave. Quarantines damaged lot and dynamically pulls replacement from reserve bin C-02-04 without delaying order.
              </p>
            </div>
            <button id="btn-scenario-2" class="btn btn-warning" style="width: 100%;">
              ⚡ Trigger Mid-Pick Damage
            </button>
          </div>

          <!-- Scenario 3: Black Friday Flash Surge -->
          <div class="glass-panel" style="padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between; border-top: 4px solid #8b5cf6;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <span class="badge badge-purple">📈 WAVE BATCHING</span>
                <span class="font-mono" style="font-size: 0.75rem; color: var(--text-muted);">SCENARIO #03</span>
              </div>
              <h3 style="font-size: 1.1rem; color: #fff; margin-bottom: 0.5rem;">Flash Surge: 15 High-Velocity Orders</h3>
              <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem; line-height: 1.4;">
                Simulates sudden flood of 15 e-commerce orders. Autonomous Priority Scoring immediately ranks SLAs, clusters items by warehouse zones, and generates multi-order pick waves.
              </p>
            </div>
            <button id="btn-scenario-3" class="btn btn-purple" style="width: 100%;">
              🌊 Ingest Flash Order Surge
            </button>
          </div>

          <!-- Scenario 4: Aisle Hazard & Route Recalculation -->
          <div class="glass-panel" style="padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between; border-top: 4px solid #ef4444;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <span class="badge badge-danger">🚧 AISLE HAZARD</span>
                <span class="font-mono" style="font-size: 0.75rem; color: var(--text-muted);">SCENARIO #04</span>
              </div>
              <h3 style="font-size: 1.1rem; color: #fff; margin-bottom: 0.5rem;">Forklift Fluid Leak & Digital Twin Reroute</h3>
              <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem; line-height: 1.4;">
                Fluid leak in Aisle B-03 blocks reach trucks. Digital twin recalculates all picker paths using perimeter bypass routing and alerts floor supervisors.
              </p>
            </div>
            <button id="btn-scenario-4" class="btn btn-danger" style="width: 100%;">
              💥 Block Aisle B-03 & Reroute
            </button>
          </div>
        </div>

        <!-- Reset All to Clean Benchmark -->
        <div style="text-align: center; padding-top: 1rem;">
          <button id="btn-reset-demo-state" class="btn btn-secondary btn-sm">
            🔄 Reset Entire Warehouse to Benchmark Data
          </button>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    // Toggle Sim
    const btnRun = document.getElementById("btn-chaos-run");
    if (btnRun) btnRun.addEventListener('click', () => this.toggleSimulation());

    // Step Tick
    const btnStep = document.getElementById("btn-chaos-step");
    if (btnStep) btnStep.addEventListener('click', () => {
      this.tick();
      state.showToast("Stepped 1 simulation tick forward.", "info");
    });

    // Speed buttons
    const speedBtns = this.container.querySelectorAll('[data-speed]');
    speedBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const spd = parseInt(btn.getAttribute('data-speed'), 10);
        this.setSpeed(spd);
      });
    });

    // Reset button
    const btnReset = document.getElementById("btn-reset-demo-state");
    if (btnReset) btnReset.addEventListener('click', () => state.resetToDefaults(true));

    // Scenario 1: Stock Shortage Dilemma
    const btnScen1 = document.getElementById("btn-scenario-1");
    if (btnScen1) {
      btnScen1.addEventListener('click', () => {
        // Reset stock to 7 units
        const p = state.getProductById("SKU-EL-101");
        if (p) {
          p.stockOnHand = 7;
          p.stockAllocated = 0;
          p.status = "CRITICAL";
        }
        
        // Ensure Orders #9821 and #9822 are pending
        const ord1 = state.getOrderById("ORD-9821");
        if (ord1) {
          ord1.status = "PENDING_ALLOCATION";
          ord1.items[0].qtyAllocated = 0;
          ord1.items[0].qtyPicked = 0;
        }

        const ord2 = state.getOrderById("ORD-9822");
        if (ord2) {
          ord2.status = "PENDING_ALLOCATION";
          ord2.items[0].qtyAllocated = 0;
          ord2.items[0].qtyPicked = 0;
        }

        state.notify("inventory_updated", null);

        // Switch to Exceptions Tab and trigger Conflict Matrix
        const excTab = document.querySelector('[data-tab="exceptions"]');
        if (excTab) excTab.click();

        setTimeout(() => {
          const excBtn = document.querySelector('.btn-open-conflict-matrix[data-sku="SKU-EL-101"]');
          if (excBtn) excBtn.click();
        }, 150);
      });
    }

    // Scenario 2: Damaged item
    const btnScen2 = document.getElementById("btn-scenario-2");
    if (btnScen2) {
      btnScen2.addEventListener('click', () => {
        state.addException({
          type: "DAMAGED_ITEM_PICK",
          severity: "WARNING",
          title: "CryoVial Box dropped in Aisle C-02",
          description: "Carton dropped during reach retrieve for Order #9818. Temperature seal broken.",
          sku: "SKU-MD-201",
          bin: "C-02-01",
          affectedOrders: ["ORD-9818"],
          suggestedAction: "Quarantine damaged unit and reallocate 1 unit from Reserve Bin C-02-04."
        });
        const excTab = document.querySelector('[data-tab="exceptions"]');
        if (excTab) excTab.click();
      });
    }

    // Scenario 3: Flash Surge
    const btnScen3 = document.getElementById("btn-scenario-3");
    if (btnScen3) {
      btnScen3.addEventListener('click', () => {
        for (let i = 1; i <= 6; i++) {
          const newOrder = {
            id: `ORD-SURGE-${Math.floor(100 + Math.random() * 900)}`,
            orderNumber: `#${Math.floor(1000 + Math.random() * 9000)}`,
            customer: { name: `Global Tech Client #${i}`, tier: i % 2 === 0 ? "GOLD" : "STANDARD" },
            priority: i % 2 === 0 ? "HIGH" : "MEDIUM",
            priorityScore: 65 + i * 4,
            slaMinutesRemaining: 90 + i * 20,
            slaType: "EXPRESS_SURGE",
            createdAt: new Date().toISOString(),
            status: "PICKING",
            items: [
              {
                sku: "SKU-FC-401",
                name: "HydroActive Electrolyte Energy Pods",
                qtyRequested: 4,
                qtyAllocated: 4,
                qtyPicked: 0,
                unitPrice: 24.0,
                zone: "Zone A",
                bin: "A-01-01"
              }
            ],
            carrier: "FedEx Express",
            dockAssigned: "Dock 1"
          };
          state.orders.unshift(newOrder);
        }
        soundFx.playSuccessChime();
        state.showToast("🌊 Ingested 6 flash surge orders! Batched into Wave #WAVE-SURGE-01", "success");
        state.notify("order_updated", null);

        const orderTab = document.querySelector('[data-tab="orders"]');
        if (orderTab) orderTab.click();
      });
    }

    // Scenario 4: Aisle Hazard
    const btnScen4 = document.getElementById("btn-scenario-4");
    if (btnScen4) {
      btnScen4.addEventListener('click', () => {
        state.addException({
          type: "HAZARD_BLOCKAGE",
          severity: "CRITICAL",
          title: "🚧 Hydraulic Fluid Spill in Aisle B-03",
          description: "Forklift leak reported. Aisle B-03 cordoned off for hazmat cleanup. Digital Twin route recalculation activated.",
          bin: "B-03-01",
          suggestedAction: "Reroute all active pickers around perimeter aisle B-01/B-04."
        });
        const twinTab = document.querySelector('[data-tab="twin"]');
        if (twinTab) twinTab.click();
      });
    }
  }
}
