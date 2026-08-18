/**
 * NexusWMS - Configuration, Initial Seed Data & Audio FX Synthesizer
 */

export const CONFIG = {
  WAREHOUSE_NAME: "Apex Core Alpha - Facility #04",
  TOTAL_ZONES: 4,
  TOTAL_AISLES: 16,
  TOTAL_BINS: 64,
  TICK_INTERVAL_MS: 3000,
  DEFAULT_SIM_SPEED: 1,
  AUTO_RESOLVE_CONFLICTS: false,
};

// Initial Seed Products
export const INITIAL_PRODUCTS = [
  {
    id: "SKU-EL-101",
    name: "AeroShield Wireless NVMe Enclosure 4TB",
    category: "High-Value Electronics",
    zone: "Zone D",
    aisle: "D-01",
    bin: "D-01-02",
    barcode: "8901234001019",
    unitPrice: 249.99,
    weightKg: 0.35,
    dimensionsCm: { l: 14, w: 8, h: 2 },
    stockOnHand: 7, // Set to 7 specifically for the hackathon conflict scenario!
    stockAllocated: 0,
    safetyStock: 15,
    maxCapacity: 100,
    reorderPoint: 20,
    reorderQuantity: 50,
    batchNo: "BATCH-2026-08A",
    expiryDate: null,
    temperatureReq: "Ambient (18-24°C)",
    isFragile: true,
    substituteSku: "SKU-EL-102", // AI Variant substitute
    substituteReason: "Pro Series Variant (Double Speed)",
    dailyVelocity: 14,
    status: "CRITICAL" // Low stock alert
  },
  {
    id: "SKU-EL-102",
    name: "AeroShield PRO NVMe Enclosure 4TB (Gen5)",
    category: "High-Value Electronics",
    zone: "Zone D",
    aisle: "D-01",
    bin: "D-01-04",
    barcode: "8901234001026",
    unitPrice: 299.99,
    weightKg: 0.38,
    dimensionsCm: { l: 14, w: 8, h: 2.2 },
    stockOnHand: 45,
    stockAllocated: 0,
    safetyStock: 10,
    maxCapacity: 80,
    reorderPoint: 15,
    reorderQuantity: 40,
    batchNo: "BATCH-2026-07B",
    expiryDate: null,
    temperatureReq: "Ambient (18-24°C)",
    isFragile: true,
    substituteSku: null,
    dailyVelocity: 9,
    status: "HEALTHY"
  },
  {
    id: "SKU-MD-201",
    name: "CryoVial Rapid Diagnostic Test Kit (Box of 50)",
    category: "Cold Chain Medical",
    zone: "Zone C",
    aisle: "C-02",
    bin: "C-02-01",
    barcode: "8901234002016",
    unitPrice: 180.00,
    weightKg: 1.2,
    dimensionsCm: { l: 25, w: 20, h: 15 },
    stockOnHand: 84,
    stockAllocated: 12,
    safetyStock: 25,
    maxCapacity: 200,
    reorderPoint: 35,
    reorderQuantity: 100,
    batchNo: "BATCH-CRYO-902",
    expiryDate: "2026-12-31",
    temperatureReq: "Cold Storage (2-8°C)",
    isFragile: true,
    substituteSku: null,
    dailyVelocity: 22,
    status: "HEALTHY"
  },
  {
    id: "SKU-AM-301",
    name: "Industrial Kevlar Grip Work Gloves (Size L)",
    category: "Ambient Bulk",
    zone: "Zone B",
    aisle: "B-03",
    bin: "B-03-03",
    barcode: "8901234003013",
    unitPrice: 18.50,
    weightKg: 0.22,
    dimensionsCm: { l: 28, w: 14, h: 4 },
    stockOnHand: 320,
    stockAllocated: 40,
    safetyStock: 50,
    maxCapacity: 600,
    reorderPoint: 80,
    reorderQuantity: 250,
    batchNo: "BATCH-2026-04G",
    expiryDate: null,
    temperatureReq: "Ambient",
    isFragile: false,
    substituteSku: null,
    dailyVelocity: 45,
    status: "HEALTHY"
  },
  {
    id: "SKU-FC-401",
    name: "HydroActive Electrolyte Energy Pods (12-Pack)",
    category: "Fast-Moving Consumer Goods",
    zone: "Zone A",
    aisle: "A-01",
    bin: "A-01-01",
    barcode: "8901234004010",
    unitPrice: 24.00,
    weightKg: 0.65,
    dimensionsCm: { l: 18, w: 12, h: 10 },
    stockOnHand: 410,
    stockAllocated: 60,
    safetyStock: 100,
    maxCapacity: 800,
    reorderPoint: 150,
    reorderQuantity: 400,
    batchNo: "BATCH-2026-08C",
    expiryDate: "2027-04-15",
    temperatureReq: "Ambient",
    isFragile: false,
    substituteSku: null,
    dailyVelocity: 68,
    status: "HEALTHY"
  },
  {
    id: "SKU-FC-402",
    name: "AuraClean Smart Microfiber Sanitizer Wand",
    category: "Fast-Moving Consumer Goods",
    zone: "Zone A",
    aisle: "A-02",
    bin: "A-02-04",
    barcode: "8901234004027",
    unitPrice: 42.00,
    weightKg: 0.48,
    dimensionsCm: { l: 30, w: 6, h: 5 },
    stockOnHand: 18,
    stockAllocated: 10,
    safetyStock: 25,
    maxCapacity: 250,
    reorderPoint: 30,
    reorderQuantity: 100,
    batchNo: "BATCH-2026-06K",
    expiryDate: null,
    temperatureReq: "Ambient",
    isFragile: true,
    substituteSku: null,
    dailyVelocity: 16,
    status: "LOW_STOCK"
  },
  {
    id: "SKU-EL-103",
    name: "Titanium Mechanical Cybernetic Switch Keyboard",
    category: "High-Value Electronics",
    zone: "Zone D",
    aisle: "D-03",
    bin: "D-03-01",
    barcode: "8901234001033",
    unitPrice: 349.00,
    weightKg: 1.45,
    dimensionsCm: { l: 44, w: 16, h: 5 },
    stockOnHand: 3,
    stockAllocated: 2,
    safetyStock: 8,
    maxCapacity: 50,
    reorderPoint: 10,
    reorderQuantity: 25,
    batchNo: "BATCH-2026-02X",
    expiryDate: null,
    temperatureReq: "Ambient",
    isFragile: true,
    substituteSku: null,
    dailyVelocity: 5,
    status: "CRITICAL"
  },
  {
    id: "SKU-MD-202",
    name: "BioStat Digital Pulse Oximeter & ECG Sensor",
    category: "Cold Chain Medical",
    zone: "Zone C",
    aisle: "C-01",
    bin: "C-01-03",
    barcode: "8901234002023",
    unitPrice: 129.50,
    weightKg: 0.28,
    dimensionsCm: { l: 12, w: 8, h: 6 },
    stockOnHand: 95,
    stockAllocated: 8,
    safetyStock: 20,
    maxCapacity: 180,
    reorderPoint: 30,
    reorderQuantity: 70,
    batchNo: "BATCH-BIO-811",
    expiryDate: "2028-01-01",
    temperatureReq: "Climate Controlled (15-22°C)",
    isFragile: true,
    substituteSku: null,
    dailyVelocity: 11,
    status: "HEALTHY"
  }
];

// Initial Seed Orders (Designed with the Hackathon Conflict Scenario!)
export const INITIAL_ORDERS = [
  {
    id: "ORD-9821",
    orderNumber: "#9821",
    customer: {
      name: "Apex HyperScale Datacenters",
      tier: "PLATINUM", // VIP Customer Tier
      contractSlaPenaltyRatePerHour: 250
    },
    priority: "CRITICAL",
    priorityScore: 98,
    slaMinutesRemaining: 45, // Urgent deadline!
    slaType: "SAME_DAY_EXPRESS",
    createdAt: new Date(Date.now() - 35 * 60000).toISOString(),
    status: "PENDING_ALLOCATION", // Trigger for stock conflict!
    items: [
      {
        sku: "SKU-EL-101",
        name: "AeroShield Wireless NVMe Enclosure 4TB",
        qtyRequested: 10, // Demands 10, but only 7 in stock!
        qtyAllocated: 0,
        qtyPicked: 0,
        qtyPacked: 0,
        unitPrice: 249.99,
        zone: "Zone D",
        bin: "D-01-02"
      }
    ],
    shippingAddress: "Building 4, CyberPort Gateway, Dock 9, Tech City",
    carrier: "FedEx Priority Overnight",
    dockAssigned: "Dock 1",
    assignedPicker: "Devon Vance (AGV-01)",
    notes: "Urgent SLA: High penalty if delayed past 14:00."
  },
  {
    id: "ORD-9822",
    orderNumber: "#9822",
    customer: {
      name: "Solaria Consumer Tech Labs",
      tier: "STANDARD", // Lower Priority
      contractSlaPenaltyRatePerHour: 20
    },
    priority: "STANDARD",
    priorityScore: 42,
    slaMinutesRemaining: 360, // Standard 6-hour window
    slaType: "STANDARD_GROUND",
    createdAt: new Date(Date.now() - 20 * 60000).toISOString(),
    status: "PENDING_ALLOCATION", // Competing for SKU-EL-101!
    items: [
      {
        sku: "SKU-EL-101",
        name: "AeroShield Wireless NVMe Enclosure 4TB",
        qtyRequested: 5, // Demands 5 units of same SKU!
        qtyAllocated: 0,
        qtyPicked: 0,
        qtyPacked: 0,
        unitPrice: 249.99,
        zone: "Zone D",
        bin: "D-01-02"
      }
    ],
    shippingAddress: "Suite 102, Industrial Parkway, North Hub",
    carrier: "UPS Ground",
    dockAssigned: "Dock 3",
    assignedPicker: "Unassigned",
    notes: "Standard fulfillment batch."
  },
  {
    id: "ORD-9818",
    orderNumber: "#9818",
    customer: {
      name: "St. Jude Emergency Medical Center",
      tier: "PLATINUM",
      contractSlaPenaltyRatePerHour: 500
    },
    priority: "CRITICAL",
    priorityScore: 95,
    slaMinutesRemaining: 25,
    slaType: "EMERGENCY_MEDICAL",
    createdAt: new Date(Date.now() - 60 * 60000).toISOString(),
    status: "PICKING",
    items: [
      {
        sku: "SKU-MD-201",
        name: "CryoVial Rapid Diagnostic Test Kit",
        qtyRequested: 4,
        qtyAllocated: 4,
        qtyPicked: 2,
        qtyPacked: 0,
        unitPrice: 180.00,
        zone: "Zone C",
        bin: "C-02-01"
      },
      {
        sku: "SKU-MD-202",
        name: "BioStat Digital Pulse Oximeter",
        qtyRequested: 2,
        qtyAllocated: 2,
        qtyPicked: 0,
        qtyPacked: 0,
        unitPrice: 129.50,
        zone: "Zone C",
        bin: "C-01-03"
      }
    ],
    shippingAddress: "Emergency Receiving Bay 2, City Hospital",
    carrier: "DHL Medical Express",
    dockAssigned: "Dock 2",
    assignedPicker: "Maya Lin (Operator #14)",
    notes: "Cold-chain continuous temperature log required."
  },
  {
    id: "ORD-9815",
    orderNumber: "#9815",
    customer: {
      name: "Metro Retail Distribution Hub",
      tier: "GOLD",
      contractSlaPenaltyRatePerHour: 80
    },
    priority: "HIGH",
    priorityScore: 76,
    slaMinutesRemaining: 110,
    slaType: "EXPRESS_FREIGHT",
    createdAt: new Date(Date.now() - 95 * 60000).toISOString(),
    status: "PACKING",
    items: [
      {
        sku: "SKU-FC-401",
        name: "HydroActive Electrolyte Energy Pods (12-Pack)",
        qtyRequested: 10,
        qtyAllocated: 10,
        qtyPicked: 10,
        qtyPacked: 0,
        unitPrice: 24.00,
        zone: "Zone A",
        bin: "A-01-01"
      },
      {
        sku: "SKU-AM-301",
        name: "Industrial Kevlar Grip Work Gloves",
        qtyRequested: 6,
        qtyAllocated: 6,
        qtyPicked: 6,
        qtyPacked: 0,
        unitPrice: 18.50,
        zone: "Zone B",
        bin: "B-03-03"
      }
    ],
    shippingAddress: "Dock 18, Central Logistics Park",
    carrier: "BlueDart Express Freight",
    dockAssigned: "Dock 4",
    assignedPicker: "Alex Mercer (Operator #09)",
    notes: "Palletized shrink wrap."
  },
  {
    id: "ORD-9810",
    orderNumber: "#9810",
    customer: {
      name: "OmniTech Hardware Solutions",
      tier: "GOLD",
      contractSlaPenaltyRatePerHour: 75
    },
    priority: "MEDIUM",
    priorityScore: 62,
    slaMinutesRemaining: 180,
    slaType: "STANDARD_EXPRESS",
    createdAt: new Date(Date.now() - 140 * 60000).toISOString(),
    status: "DISPATCHED",
    items: [
      {
        sku: "SKU-FC-402",
        name: "AuraClean Smart Microfiber Sanitizer Wand",
        qtyRequested: 4,
        qtyAllocated: 4,
        qtyPicked: 4,
        qtyPacked: 4,
        unitPrice: 42.00,
        zone: "Zone A",
        bin: "A-02-04"
      }
    ],
    shippingAddress: "Gate 7, Silicon Boulevard",
    carrier: "FedEx Standard Air",
    dockAssigned: "Dock 1",
    assignedPicker: "Alex Mercer",
    trackingNumber: "FDX-88921-9941-US",
    dispatchedAt: new Date(Date.now() - 15 * 60000).toISOString()
  }
];

// Warehouse Zones & Layout Specs
export const WAREHOUSE_LAYOUT = {
  zones: [
    {
      id: "Zone A",
      name: "High-Velocity FMCG",
      color: "#00f2fe",
      description: "Fast-moving consumer products with highest pick frequency",
      aisles: ["A-01", "A-02", "A-03", "A-04"],
      x: 50, y: 50, width: 340, height: 200
    },
    {
      id: "Zone B",
      name: "Ambient Bulk & Hardware",
      color: "#10b981",
      description: "Heavy & bulk goods, tools and general storage",
      aisles: ["B-01", "B-02", "B-03", "B-04"],
      x: 430, y: 50, width: 340, height: 200
    },
    {
      id: "Zone C",
      name: "Cold-Chain Pharma & Perishables",
      color: "#3b82f6",
      description: "Temperature-controlled 2-8°C medical & biologics",
      aisles: ["C-01", "C-02", "C-03", "C-04"],
      x: 50, y: 280, width: 340, height: 200
    },
    {
      id: "Zone D",
      name: "High-Value Electronics Vault",
      color: "#8b5cf6",
      description: "Secure, climate-controlled high-value electronics & chips",
      aisles: ["D-01", "D-02", "D-03", "D-04"],
      x: 430, y: 280, width: 340, height: 200
    }
  ],
  packingStations: [
    { id: "PK-01", name: "Packing Station 1 (Express)", x: 120, y: 520, status: "BUSY", currentOrder: "ORD-9815" },
    { id: "PK-02", name: "Packing Station 2 (Fragile/QC)", x: 280, y: 520, status: "AVAILABLE", currentOrder: null },
    { id: "PK-03", name: "Packing Station 3 (Cold Seal)", x: 440, y: 520, status: "AVAILABLE", currentOrder: null },
    { id: "PK-04", name: "Packing Station 4 (Bulk)", x: 600, y: 520, status: "AVAILABLE", currentOrder: null }
  ],
  dockDoors: [
    { id: "Dock 1", name: "Dock 1 (FedEx Priority)", x: 100, y: 610, status: "OCCUPIED", carrier: "FedEx Express", truckEta: "Ready to Depart" },
    { id: "Dock 2", name: "Dock 2 (DHL Cold Express)", x: 260, y: 610, status: "SCHEDULED", carrier: "DHL Medical", truckEta: "15 min" },
    { id: "Dock 3", name: "Dock 3 (UPS Ground)", x: 420, y: 610, status: "AVAILABLE", carrier: "UPS Ground", truckEta: "45 min" },
    { id: "Dock 4", name: "Dock 4 (FreightLine Heavy)", x: 580, y: 610, status: "OCCUPIED", carrier: "BlueDart Freight", truckEta: "Loading" }
  ],
  pickers: [
    { id: "P-01", name: "Alex Mercer", role: "Manual Picker", currentZone: "Zone A", x: 180, y: 140, status: "PICKING", activeWave: "WAVE-09" },
    { id: "P-02", name: "Maya Lin", role: "Cold Chain Specialist", currentZone: "Zone C", x: 200, y: 360, status: "PICKING", activeWave: "WAVE-04" },
    { id: "P-03", name: "AGV-Bot 01", role: "Autonomous Robot", currentZone: "Zone D", x: 580, y: 340, status: "TRANSIT", activeWave: "WAVE-11" }
  ]
};

// Audio Sound Synthesis using Web Audio API (Zero external audio file dependencies!)
class SoundSynthesizer {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
  }

  playScanBeep() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1800, now);
      osc.frequency.exponentialRampToValueAtTime(2400, now + 0.08);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  playSuccessChime() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = now + idx * 0.07;

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.18, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.26);
      });
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  playWarningTone() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.setValueAtTime(260, now + 0.12);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  playErrorBuzzer() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.setValueAtTime(110, now + 0.15);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.38);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }
}

export const soundFx = new SoundSynthesizer();
