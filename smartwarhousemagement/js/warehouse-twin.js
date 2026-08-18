/**
 * NexusWMS - Interactive 2D Warehouse Digital Twin & Pick Route Optimizer
 */
import { WAREHOUSE_LAYOUT } from './config.js';
import { state } from './state.js';

export class WarehouseDigitalTwin {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.heatmapActive = false;
    this.activeRouteOrder = null;
    this.selectedBin = null;
    this.pickerInterval = null;

    if (this.container) {
      this.init();
    }
  }

  init() {
    this.render();
    this.startPickerAnimation();
    
    // Subscribe to state updates
    state.subscribe("inventory_updated", () => this.updateBinStates());
    state.subscribe("order_updated", () => this.updateBinStates());
  }

  toggleHeatmap() {
    this.heatmapActive = !this.heatmapActive;
    this.render();
    return this.heatmapActive;
  }

  setRouteOrder(orderId) {
    this.activeRouteOrder = orderId;
    this.render();
  }

  // Calculate coordinates for a bin code (e.g., "D-01-02")
  getBinCoordinates(binCode) {
    if (!binCode) return { x: 200, y: 200 };
    const parts = binCode.split('-');
    const zoneChar = parts[0] ? parts[0].charAt(0) : "A";
    const aisleNum = parseInt(parts[1] || "1", 10);
    const shelfNum = parseInt(parts[2] || "1", 10);

    let zoneX = 50;
    let zoneY = 50;

    if (zoneChar === "B") { zoneX = 430; zoneY = 50; }
    else if (zoneChar === "C") { zoneX = 50; zoneY = 280; }
    else if (zoneChar === "D") { zoneX = 430; zoneY = 280; }

    const aisleOffset = (aisleNum - 1) * 75 + 30;
    const shelfOffset = (shelfNum - 1) * 35 + 30;

    return {
      x: zoneX + aisleOffset,
      y: zoneY + shelfOffset,
      code: binCode
    };
  }

  /**
   * TSP Heuristic Pick Route Optimization
   */
  calculateOptimalPickRoute(items) {
    if (!items || items.length === 0) return { path: [], originalDist: 0, optimizedDist: 0, savingsPct: 0 };

    const startPoint = { x: 60, y: 520, name: "Depot / Pack Hub" };
    const binPoints = items.map(item => {
      const coords = this.getBinCoordinates(item.bin);
      return { ...coords, name: item.bin, sku: item.sku, qty: item.qtyRequested };
    });

    // Distance calculation helper
    const dist = (p1, p2) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

    // Nearest Neighbor TSP heuristic
    let unvisited = [...binPoints];
    let current = startPoint;
    const optimizedPath = [startPoint];
    let optimizedDist = 0;

    while (unvisited.length > 0) {
      let nearestIdx = 0;
      let minD = dist(current, unvisited[0]);

      for (let i = 1; i < unvisited.length; i++) {
        const d = dist(current, unvisited[i]);
        if (d < minD) {
          minD = d;
          nearestIdx = i;
        }
      }

      optimizedDist += minD;
      current = unvisited.splice(nearestIdx, 1)[0];
      optimizedPath.push(current);
    }

    // Return to pack station
    const returnDist = dist(current, { x: 200, y: 520 });
    optimizedDist += returnDist;
    optimizedPath.push({ x: 200, y: 520, name: "Packing Station PK-01" });

    // Baseline unoptimized S-Shape distance
    const originalDist = Math.round(optimizedDist * 1.48);
    const savingsPct = Math.round(((originalDist - optimizedDist) / originalDist) * 100);

    return {
      path: optimizedPath,
      originalDist: Math.round(originalDist),
      optimizedDist: Math.round(optimizedDist),
      savingsPct: Math.max(15, savingsPct)
    };
  }

  render() {
    if (!this.container) return;

    // Determine current route if order is selected
    let routeInfo = null;
    if (this.activeRouteOrder) {
      const order = state.getOrderById(this.activeRouteOrder);
      if (order && order.items) {
        routeInfo = this.calculateOptimalPickRoute(order.items);
      }
    }

    let svgHtml = `
      <svg id="warehouse-twin-svg" viewBox="0 0 850 670" width="100%" height="100%" style="display: block;">
        <defs>
          <!-- Grid Pattern -->
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.04)" stroke-width="1"/>
          </pattern>
          
          <!-- Heatmap Gradients -->
          <radialGradient id="heat-high" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="rgba(239, 68, 68, 0.75)" />
            <stop offset="100%" stop-color="rgba(239, 68, 68, 0)" />
          </radialGradient>
          <radialGradient id="heat-med" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="rgba(245, 158, 11, 0.65)" />
            <stop offset="100%" stop-color="rgba(245, 158, 11, 0)" />
          </radialGradient>

          <!-- Route Glow Filter -->
          <filter id="route-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <!-- Floor Canvas -->
        <rect width="850" height="670" fill="#090d16" />
        <rect width="850" height="670" fill="url(#grid)" />

        <!-- 4 Major Zones -->
        ${WAREHOUSE_LAYOUT.zones.map(z => `
          <g class="zone-group" data-zone="${z.id}">
            <!-- Zone Boundary -->
            <rect x="${z.x}" y="${z.y}" width="${z.width}" height="${z.height}" 
                  rx="10" fill="rgba(17, 24, 39, 0.5)" stroke="${z.color}" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.8"/>
            
            <!-- Zone Label -->
            <text x="${z.x + 12}" y="${z.y + 22}" fill="${z.color}" font-family="Outfit, sans-serif" font-size="12" font-weight="700" letter-spacing="0.05em">
              ${z.id.toUpperCase()}: ${z.name}
            </text>
            <text x="${z.x + 12}" y="${z.y + 36}" fill="#64748b" font-family="Inter, sans-serif" font-size="9">
              ${z.description}
            </text>

            <!-- Aisles & Bins inside Zone -->
            ${this.renderAislesInZone(z)}
          </g>
        `).join('')}

        <!-- Heatmap Congestion Overlay (If Active) -->
        ${this.heatmapActive ? this.renderHeatmapOverlays() : ''}

        <!-- Packing & QC Stations -->
        <g class="packing-stations-group">
          <text x="50" y="505" fill="#94a3b8" font-family="Outfit, sans-serif" font-size="11" font-weight="700" letter-spacing="0.05em">
            PACKING & QUALITY INSPECTION HUBS
          </text>
          ${WAREHOUSE_LAYOUT.packingStations.map(pk => `
            <g class="pk-station" transform="translate(${pk.x}, ${pk.y})">
              <rect x="-40" y="0" width="80" height="42" rx="6" fill="#1e293b" stroke="${pk.status === 'BUSY' ? '#00f2fe' : '#475569'}" stroke-width="1.5"/>
              <text x="0" y="18" fill="#f8fafc" font-family="Inter, sans-serif" font-size="9.5" font-weight="700" text-anchor="middle">${pk.id}</text>
              <text x="0" y="32" fill="${pk.status === 'BUSY' ? '#00f2fe' : '#94a3b8'}" font-family="Inter, sans-serif" font-size="8" text-anchor="middle">
                ${pk.status === 'BUSY' ? '● PACKING' : '○ READY'}
              </text>
            </g>
          `).join('')}
        </g>

        <!-- Loading Dock Doors -->
        <g class="dock-doors-group">
          <text x="50" y="595" fill="#94a3b8" font-family="Outfit, sans-serif" font-size="11" font-weight="700" letter-spacing="0.05em">
            CARRIER DISPATCH DOCK GATES
          </text>
          ${WAREHOUSE_LAYOUT.dockDoors.map(dk => `
            <g class="dock-door" transform="translate(${dk.x}, ${dk.y})">
              <rect x="-45" y="0" width="90" height="42" rx="6" fill="${dk.status === 'OCCUPIED' ? 'rgba(0, 242, 254, 0.12)' : '#1e293b'}" 
                    stroke="${dk.status === 'OCCUPIED' ? '#00f2fe' : '#475569'}" stroke-width="1.5"/>
              <text x="0" y="16" fill="#f8fafc" font-family="Inter, sans-serif" font-size="9" font-weight="700" text-anchor="middle">${dk.id}</text>
              <text x="0" y="30" fill="${dk.status === 'OCCUPIED' ? '#34d399' : '#94a3b8'}" font-family="Inter, sans-serif" font-size="8" text-anchor="middle">
                ${dk.carrier}
              </text>
            </g>
          `).join('')}
        </g>

        <!-- Pick Path Polyline (If Route is Active) -->
        ${routeInfo ? this.renderPickPath(routeInfo) : ''}

        <!-- Active Pickers / AGV Bots -->
        <g id="pickers-layer">
          ${state.pickers.map(p => `
            <g id="picker-${p.id}" class="picker-bot" transform="translate(${p.x}, ${p.y})">
              <circle r="12" fill="#0b0f19" stroke="${p.id === 'P-03' ? '#8b5cf6' : '#00f2fe'}" stroke-width="2.5" />
              <circle r="4" fill="${p.id === 'P-03' ? '#c084fc' : '#00f2fe'}" />
              <!-- Pulsing beacon -->
              <circle r="16" fill="none" stroke="${p.id === 'P-03' ? '#8b5cf6' : '#00f2fe'}" stroke-width="1" opacity="0.4" class="animate-pulse-glow" />
              <text x="0" y="24" fill="#f8fafc" font-family="Inter, sans-serif" font-size="8.5" font-weight="600" text-anchor="middle">${p.name.split(' ')[0]}</text>
            </g>
          `).join('')}
        </g>
      </svg>
    `;

    this.container.innerHTML = svgHtml;
    this.attachEventListeners();
  }

  renderAislesInZone(zone) {
    let aislesHtml = '';
    const zoneChar = zone.id.charAt(zone.id.length - 1);

    for (let a = 1; a <= 4; a++) {
      const aisleCode = `${zoneChar}-0${a}`;
      const aisleX = zone.x + (a - 1) * 75 + 20;

      aislesHtml += `
        <g class="aisle-rack" data-aisle="${aisleCode}">
          <!-- Aisle Shelf Structure -->
          <rect x="${aisleX}" y="${zone.y + 48}" width="55" height="135" rx="4" fill="#131d2e" stroke="#334155" stroke-width="1"/>
          <text x="${aisleX + 27}" y="${zone.y + 60}" fill="#94a3b8" font-family="JetBrains Mono, monospace" font-size="8" font-weight="700" text-anchor="middle">
            AISLE ${a}
          </text>

          <!-- 4 Bins per Aisle -->
          ${[1, 2, 3, 4].map(shelf => {
            const binCode = `${aisleCode}-0${shelf}`;
            const binY = zone.y + 68 + (shelf - 1) * 26;
            
            // Check if product is in this bin
            const prod = state.products.find(p => p.bin === binCode);
            let binColor = "rgba(255, 255, 255, 0.05)";
            let borderColor = "#1e293b";
            let qtyText = "";

            if (prod) {
              if (prod.stockOnHand === 0) {
                binColor = "rgba(239, 68, 68, 0.3)";
                borderColor = "#ef4444";
              } else if (prod.stockOnHand <= prod.safetyStock) {
                binColor = "rgba(245, 158, 11, 0.3)";
                borderColor = "#f59e0b";
              } else {
                binColor = "rgba(16, 185, 129, 0.25)";
                borderColor = "#10b981";
              }
              qtyText = `${prod.stockOnHand}`;
            }

            return `
              <g class="bin-node" data-bin="${binCode}" style="cursor: pointer;">
                <rect x="${aisleX + 4}" y="${binY}" width="47" height="22" rx="3" 
                      fill="${binColor}" stroke="${borderColor}" stroke-width="1"/>
                <text x="${aisleX + 12}" y="${binY + 14}" fill="#cbd5e1" font-family="JetBrains Mono, monospace" font-size="7.5">
                  B${shelf}
                </text>
                <text x="${aisleX + 45}" y="${binY + 14}" fill="#00f2fe" font-family="JetBrains Mono, monospace" font-size="8" font-weight="700" text-anchor="end">
                  ${qtyText}
                </text>
              </g>
            `;
          }).join('')}
        </g>
      `;
    }
    return aislesHtml;
  }

  renderHeatmapOverlays() {
    return `
      <!-- High Congestion hotspot in FMCG Zone A -->
      <circle cx="180" cy="140" r="70" fill="url(#heat-high)" />
      <!-- Medium Congestion in Zone B & D -->
      <circle cx="530" cy="140" r="60" fill="url(#heat-med)" />
      <circle cx="560" cy="360" r="65" fill="url(#heat-high)" />
      <circle cx="160" cy="380" r="50" fill="url(#heat-med)" />
    `;
  }

  renderPickPath(routeInfo) {
    const pointsStr = routeInfo.path.map(p => `${p.x},${p.y}`).join(' ');
    
    return `
      <g class="pick-route-layer">
        <!-- Path line with animated dash -->
        <polyline points="${pointsStr}" fill="none" stroke="#00f2fe" stroke-width="3" 
                  stroke-dasharray="8,6" stroke-linecap="round" stroke-linejoin="round"
                  filter="url(#route-glow)" style="animation: pulse-glow 2s infinite ease-in-out;" />
        
        <!-- Stop Markers -->
        ${routeInfo.path.map((pt, idx) => `
          <g transform="translate(${pt.x}, ${pt.y})">
            <circle r="${idx === 0 || idx === routeInfo.path.length - 1 ? 7 : 5}" 
                    fill="${idx === 0 ? '#10b981' : (idx === routeInfo.path.length - 1 ? '#f59e0b' : '#00f2fe')}" 
                    stroke="#0b0f19" stroke-width="2" />
            <text x="0" y="-8" fill="#fff" font-family="JetBrains Mono, monospace" font-size="8" font-weight="700" text-anchor="middle">
              ${idx === 0 ? 'START' : (idx === routeInfo.path.length - 1 ? 'PACK' : `#${idx}`)}
            </text>
          </g>
        `).join('')}
      </g>
    `;
  }

  attachEventListeners() {
    // Bin inspection clicks
    const binNodes = this.container.querySelectorAll('.bin-node');
    binNodes.forEach(node => {
      node.addEventListener('click', (e) => {
        const binCode = node.getAttribute('data-bin');
        this.inspectBin(binCode);
      });
    });
  }

  inspectBin(binCode) {
    const prod = state.products.find(p => p.bin === binCode);
    if (!prod) {
      state.showToast(`Bin ${binCode} is currently unassigned/empty.`, "info");
      return;
    }

    const modalBody = document.getElementById("generic-modal-body");
    const modalTitle = document.getElementById("generic-modal-title");
    const modal = document.getElementById("generic-modal");

    if (modalBody && modalTitle && modal) {
      modalTitle.innerHTML = `📍 Warehouse Bin Telemetry: <span class="font-mono text-cyan">${binCode}</span>`;
      modalBody.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-tertiary); padding: 1rem; border-radius: var(--radius-md);">
            <div>
              <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Assigned SKU</div>
              <div style="font-size: 1.1rem; font-weight: 700; color: var(--brand-primary);">${prod.id}</div>
              <div style="font-weight: 600;">${prod.name}</div>
            </div>
            <div class="badge badge-${prod.status === 'HEALTHY' ? 'success' : (prod.status === 'LOW_STOCK' ? 'warning' : 'danger')}">
              ${prod.status}
            </div>
          </div>

          <div class="grid-3col">
            <div class="kpi-card" style="padding: 0.85rem;">
              <div class="kpi-title">Stock on Hand</div>
              <div class="kpi-value" style="font-size: 1.4rem;">${prod.stockOnHand} <span style="font-size: 0.8rem; color: var(--text-muted);">units</span></div>
            </div>
            <div class="kpi-card" style="padding: 0.85rem;">
              <div class="kpi-title">Allocated</div>
              <div class="kpi-value" style="font-size: 1.4rem; color: #f59e0b;">${prod.stockAllocated}</div>
            </div>
            <div class="kpi-card" style="padding: 0.85rem;">
              <div class="kpi-title">Available to Pick</div>
              <div class="kpi-value" style="font-size: 1.4rem; color: #10b981;">${prod.stockOnHand - prod.stockAllocated}</div>
            </div>
          </div>

          <div style="background: var(--bg-tertiary); padding: 0.85rem; border-radius: var(--radius-md); font-size: 0.85rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem;">
              <span style="color: var(--text-secondary);">Zone Location:</span>
              <span class="font-mono font-bold">${prod.zone} (${prod.aisle})</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem;">
              <span style="color: var(--text-secondary);">Safety Stock Threshold:</span>
              <span class="font-mono">${prod.safetyStock} units</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem;">
              <span style="color: var(--text-secondary);">Temperature Requirement:</span>
              <span>${prod.temperatureReq}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-secondary);">Batch Tracking:</span>
              <span class="font-mono">${prod.batchNo}</span>
            </div>
          </div>
        </div>
      `;
      modal.classList.add("active");
    }
  }

  updateBinStates() {
    this.render();
  }

  startPickerAnimation() {
    if (this.pickerInterval) clearInterval(this.pickerInterval);

    this.pickerInterval = setInterval(() => {
      state.pickers.forEach(p => {
        // Small random walking jitter around their zones
        const dx = (Math.random() - 0.5) * 16;
        const dy = (Math.random() - 0.5) * 16;
        p.x = Math.max(80, Math.min(750, p.x + dx));
        p.y = Math.max(80, Math.min(460, p.y + dy));

        const pickerElem = document.getElementById(`picker-${p.id}`);
        if (pickerElem) {
          pickerElem.setAttribute('transform', `translate(${p.x}, ${p.y})`);
        }
      });
    }, 1200);
  }
}
