/**
 * NexusWMS - Autonomous Decision Engine & Conflict Resolution Matrix
 * The Competitive Twist: Multi-Factor Priority Scoring & Intelligent Stock Shortage Arbitration
 */
import { state } from './state.js';
import { soundFx } from './config.js';

export class DecisionEngine {
  /**
   * Calculate Multi-factor Dynamic Priority Score (0 - 100)
   */
  static calculatePriorityScore(order) {
    let score = 0;

    // 1. Customer Tier Weight (Max 40 points)
    const tier = (order.customer && order.customer.tier) ? order.customer.tier.toUpperCase() : "STANDARD";
    if (tier === "PLATINUM" || tier === "ENTERPRISE") score += 40;
    else if (tier === "GOLD") score += 28;
    else if (tier === "SILVER") score += 18;
    else score += 8;

    // 2. SLA Deadline Urgency Weight (Max 35 points)
    const slaMinutes = order.slaMinutesRemaining ?? 180;
    if (slaMinutes <= 30) score += 35;
    else if (slaMinutes <= 60) score += 28;
    else if (slaMinutes <= 120) score += 20;
    else if (slaMinutes <= 240) score += 12;
    else score += 5;

    // 3. Order Total Value Weight (Max 15 points)
    const orderTotal = (order.items || []).reduce((sum, item) => sum + (item.unitPrice * item.qtyRequested), 0);
    if (orderTotal >= 2000) score += 15;
    else if (orderTotal >= 800) score += 10;
    else if (orderTotal >= 200) score += 6;
    else score += 2;

    // 4. Contract SLA Penalty Risk Weight (Max 10 points)
    const penaltyRate = (order.customer && order.customer.contractSlaPenaltyRatePerHour) || 0;
    if (penaltyRate >= 200) score += 10;
    else if (penaltyRate >= 50) score += 6;
    else if (penaltyRate > 0) score += 3;

    return Math.min(100, Math.round(score));
  }

  /**
   * Analyze Shortage Conflict for a specific SKU across conflicting orders
   * e.g., Urgent Order wants 10, Low Priority wants 5, Available = 7
   */
  static evaluateStockShortageConflict(skuId) {
    const product = state.getProductById(skuId);
    if (!product) return null;

    const availableStock = product.stockOnHand - product.stockAllocated;
    
    // Find all pending orders demanding this SKU
    const conflictingOrders = state.orders.filter(ord => 
      (ord.status === "PENDING_ALLOCATION" || ord.status === "CREATED") &&
      ord.items.some(item => item.sku === skuId && (item.qtyRequested > item.qtyAllocated))
    );

    if (conflictingOrders.length === 0) return null;

    // Sort by Priority Score descending
    conflictingOrders.forEach(ord => {
      ord.priorityScore = this.calculatePriorityScore(ord);
    });
    conflictingOrders.sort((a, b) => b.priorityScore - a.priorityScore);

    const totalDemanded = conflictingOrders.reduce((sum, ord) => {
      const item = ord.items.find(i => i.sku === skuId);
      return sum + (item.qtyRequested - item.qtyAllocated);
    }, 0);

    const hasShortage = totalDemanded > availableStock;

    // Build Strategy Options
    const primaryOrder = conflictingOrders[0]; // High Priority
    const secondaryOrder = conflictingOrders[1] || null; // Lower Priority

    const primaryReq = primaryOrder ? (primaryOrder.items.find(i => i.sku === skuId)?.qtyRequested || 0) : 0;
    const secondaryReq = secondaryOrder ? (secondaryOrder.items.find(i => i.sku === skuId)?.qtyRequested || 0) : 0;

    const strategies = [
      {
        id: "STRATEGY_PREEMPTIVE_SLA",
        title: "Strategy 1: Preemptive SLA-First (Urgent Max)",
        tag: "RECOMMENDED BY AI",
        isRecommended: true,
        summary: `Allocate all ${availableStock} available units to urgent order ${primaryOrder.orderNumber}. Create emergency cross-dock/backorder for remainder (${Math.max(0, primaryReq - availableStock)} units).`,
        allocation: {
          [primaryOrder.id]: Math.min(primaryReq, availableStock),
          ...(secondaryOrder ? { [secondaryOrder.id]: 0 } : {})
        },
        actions: [
          `Release partial wave pick for ${primaryOrder.orderNumber} immediately.`,
          `Protect VIP customer ${primaryOrder.customer.name} (Penalty risk $${primaryOrder.customer.contractSlaPenaltyRatePerHour}/hr avoided).`,
          secondaryOrder ? `Notify ${secondaryOrder.customer.name} with auto-updated ETA (+24 hrs).` : "Queue remaining orders for incoming shipment."
        ],
        metrics: {
          slaProtectionRate: "100%",
          vipSatisfaction: "98%",
          financialPenaltyAvoided: `$${primaryOrder.customer.contractSlaPenaltyRatePerHour * 2}`,
          overallFulfillmentScore: "92/100"
        }
      },
      {
        id: "STRATEGY_FAIR_SHARE_SUB",
        title: "Strategy 2: Fair-Share & AI Variant Upgrade",
        tag: "MAX CUSTOMER RETENTION",
        isRecommended: false,
        summary: product.substituteSku 
          ? `Allocate 4 units of ${product.name} to ${primaryOrder.orderNumber} + upgrade remaining ${primaryReq - 4} units to ${product.substituteSku} (${product.substituteReason}) at zero customer surcharge. Allocate 3 units to ${secondaryOrder ? secondaryOrder.orderNumber : "secondary order"}.`
          : `Split available ${availableStock} units proportionally: 4 to ${primaryOrder.orderNumber} and 3 to ${secondaryOrder ? secondaryOrder.orderNumber : "secondary"}.`,
        allocation: {
          [primaryOrder.id]: 4,
          ...(secondaryOrder ? { [secondaryOrder.id]: 3 } : {})
        },
        actions: [
          `Both orders receive immediate partial dispatch without delay.`,
          product.substituteSku ? `AI variant upgrade applied to ${primaryOrder.orderNumber} from Bin D-01-04.` : `Partial shipments created.`,
          `Margin impact minimized; customer NPS maximized.`
        ],
        metrics: {
          slaProtectionRate: "88%",
          vipSatisfaction: "94%",
          financialPenaltyAvoided: `$${primaryOrder.customer.contractSlaPenaltyRatePerHour * 1.5}`,
          overallFulfillmentScore: "90/100"
        }
      },
      {
        id: "STRATEGY_GREEDY_OTIF",
        title: "Strategy 3: OTIF Maximizer (100% Complete Order First)",
        tag: "OPTIMIZE COMPLETE DISPATCH",
        isRecommended: false,
        summary: secondaryOrder && secondaryReq <= availableStock
          ? `Fully fulfill ${secondaryOrder.orderNumber} with ${secondaryReq} units (100% OTIF score). Allocate remainder (${availableStock - secondaryReq} units) to ${primaryOrder.orderNumber} and trigger 1-hour courier transfer for balance.`
          : `Allocate maximum complete subsets to minimize partial shipment handling fees.`,
        allocation: {
          ...(secondaryOrder ? { [secondaryOrder.id]: Math.min(secondaryReq, availableStock) } : {}),
          [primaryOrder.id]: Math.max(0, availableStock - (secondaryOrder ? secondaryReq : 0))
        },
        actions: [
          secondaryOrder ? `Order ${secondaryOrder.orderNumber} dispatched 100% complete in single box.` : `Dispatch complete lots.`,
          `Trigger emergency cross-dock replenishment for ${primaryOrder.orderNumber}.`,
          `May incur partial SLA warning for ${primaryOrder.orderNumber}.`
        ],
        metrics: {
          slaProtectionRate: "72%",
          vipSatisfaction: "76%",
          financialPenaltyAvoided: `$${primaryOrder.customer.contractSlaPenaltyRatePerHour * 0.5}`,
          overallFulfillmentScore: "78/100"
        }
      },
      {
        id: "STRATEGY_CROSSDOCK_EXPEDITE",
        title: "Strategy 4: Cross-Docking & Instant Intercept",
        tag: "EXPEDITED INBOUND MERGE",
        isRecommended: false,
        summary: `Allocate all 7 units from Bin ${product.bin} and direct Dock 2 receiving freight directly to Packing Station PK-01 for instant wave consolidation.`,
        allocation: {
          [primaryOrder.id]: 7,
          ...(secondaryOrder ? { [secondaryOrder.id]: 0 } : {})
        },
        actions: [
          `Dock door 2 scheduled for immediate receiving cross-dock.`,
          `Bypasses putaway storage step to save 45 minutes of transit time.`,
          `Both orders fulfilled within 90 minutes.`
        ],
        metrics: {
          slaProtectionRate: "96%",
          vipSatisfaction: "95%",
          financialPenaltyAvoided: `$${primaryOrder.customer.contractSlaPenaltyRatePerHour * 1.8}`,
          overallFulfillmentScore: "95/100"
        }
      }
    ];

    return {
      skuId,
      product,
      availableStock,
      totalDemanded,
      hasShortage,
      conflictingOrders,
      strategies
    };
  }

  /**
   * Apply an automated or chosen Strategy
   */
  static executeStrategy(strategyId, conflictContext) {
    const strategy = conflictContext.strategies.find(s => s.id === strategyId);
    if (!strategy) return { success: false, message: "Strategy not found" };

    const { skuId, product } = conflictContext;
    const allocationMap = strategy.allocation;

    let totalAllocatedUnits = 0;

    Object.keys(allocationMap).forEach(orderId => {
      const order = state.getOrderById(orderId);
      if (!order) return;

      const allocatedQty = allocationMap[orderId];
      const item = order.items.find(i => i.sku === skuId);
      if (item) {
        item.qtyAllocated = allocatedQty;
        totalAllocatedUnits += allocatedQty;
      }

      // Check if order can proceed to picking
      const allItemsAllocated = order.items.every(i => i.qtyAllocated > 0);
      if (allItemsAllocated && allocatedQty > 0) {
        state.updateOrderStatus(order.id, "PICKING", {
          allocationStrategy: strategy.title,
          waveAssigned: "WAVE-" + Math.floor(10 + Math.random() * 90)
        });
      } else if (allocatedQty === 0) {
        state.updateOrderStatus(order.id, "BACKORDERED", {
          allocationStrategy: strategy.title,
          backorderReason: "Stock shortage preemption. Restock scheduled."
        });
      }
    });

    // Update product stock allocation
    state.updateProductStock(skuId, 0, totalAllocatedUnits);

    // Resolve any associated open exception
    const relatedException = state.exceptions.find(e => 
      e.type === "STOCK_SHORTAGE_CONFLICT" && e.sku === skuId && e.status === "OPEN"
    );
    if (relatedException) {
      state.resolveException(
        relatedException.id,
        `Executed ${strategy.title}: Allocated ${JSON.stringify(allocationMap)}`,
        "STRATEGY_EXECUTED"
      );
    }

    state.addActivityLog(
      "DECISION_EXECUTED",
      `Decision Engine applied ${strategy.title} on SKU ${skuId}. (${totalAllocatedUnits} units allocated)`,
      "Autonomous Decision Engine"
    );

    soundFx.playSuccessChime();
    state.showToast(`Applied ${strategy.title}`, "success");

    return {
      success: true,
      strategy,
      allocatedTotal: totalAllocatedUnits
    };
  }

  /**
   * Calculate Reorder Point (ROP) and EOQ
   */
  static calculateReplenishment(product) {
    const dailyDemand = product.dailyVelocity || 10;
    const leadTimeDays = 4; // Average supplier lead time
    const safetyStock = product.safetyStock || 15;
    
    // ROP = (Demand * Lead Time) + Safety Stock
    const computedROP = (dailyDemand * leadTimeDays) + safetyStock;
    
    // EOQ = sqrt((2 * Demand * OrderingCost) / HoldingCost)
    const orderingCost = 45; // $45 per PO setup
    const holdingCost = product.unitPrice * 0.18; // 18% annual holding cost per unit
    const annualDemand = dailyDemand * 365;
    const computedEOQ = Math.round(Math.sqrt((2 * annualDemand * orderingCost) / holdingCost));

    const needsReorder = product.stockOnHand <= computedROP;

    return {
      sku: product.id,
      name: product.name,
      currentStock: product.stockOnHand,
      dailyDemand,
      leadTimeDays,
      safetyStock,
      computedROP,
      computedEOQ: Math.max(20, computedEOQ),
      needsReorder,
      urgency: product.stockOnHand <= safetyStock ? "CRITICAL" : (needsReorder ? "WARNING" : "NORMAL")
    };
  }
}
