import prisma from "../config/database";

/*
 * ============================================================
 * TYPES
 * ============================================================
 */

interface RiskAnalysisResult {
  orderId: string;
  riskScore: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  factors: string[];
  recommendations: string[];
}

interface ProductData {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  unitPrice: number;
}

interface OrderItemData {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  product: ProductData;
}

interface SupplierData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  reliability: number;
}

interface ShipmentData {
  id: string;
  orderId: string;
  supplierId: string | null;
  status:
    | "PENDING"
    | "IN_TRANSIT"
    | "DELIVERED"
    | "DELAYED"
    | "CANCELLED";
  expectedDate: Date;
  actualDate: Date | null;
  trackingNumber: string | null;
  createdAt: Date;
  supplier: SupplierData | null;
}

interface OrderData {
  id: string;
  customerId: string;
  createdById: string;
  status:
    | "PENDING"
    | "CONFIRMED"
    | "PROCESSING"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED";
  totalAmount: number;
  orderDate: Date;
  promisedDate: Date;
  items: OrderItemData[];
  shipments: ShipmentData[];
}

interface InventoryData {
  id: string;
  warehouseId: string;
  productId: string;
  quantity: number;
  reserved: number;
}

interface WarehouseData {
  id: string;
  name: string;
  location: string;
  capacity: number;
}

interface ExceptionData {
  id: string;
  orderId: string | null;
  createdById: string | null;
  type:
    | "INVENTORY_SHORTAGE"
    | "SHIPMENT_DELAY"
    | "SUPPLIER_DELAY"
    | "ORDER_AT_RISK";
  severity:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL";
  title: string;
  description: string;
  riskScore: number;
  resolved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/*
 * ============================================================
 * SEVERITY
 * ============================================================
 */

const calculateSeverity = (
  riskScore: number
): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" => {
  if (riskScore >= 90) {
    return "CRITICAL";
  }

  if (riskScore >= 70) {
    return "HIGH";
  }

  if (riskScore >= 40) {
    return "MEDIUM";
  }

  return "LOW";
};

/*
 * ============================================================
 * MAIN RISK ANALYSIS
 * ============================================================
 */

export const analyzeOrderRisk = async (
  orderId: string
): Promise<RiskAnalysisResult> => {
  /*
   * ==========================================================
   * 1. FETCH ORDER
   * ==========================================================
   */

  const orderRaw = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      shipments: {
        include: {
          supplier: true,
        },
      },
    },
  });

  if (!orderRaw) {
    throw new Error(
      `Order ${orderId} not found`
    );
  }

  const order =
    orderRaw as unknown as OrderData;

  /*
   * ==========================================================
   * 2. FETCH ACTIVE EXCEPTIONS
   * ==========================================================
   */

  const exceptionsRaw =
    await prisma.exception.findMany({
      where: {
        orderId: orderId,
        resolved: false,
      },
      orderBy: {
        riskScore: "desc",
      },
    });

  const exceptions =
    exceptionsRaw as unknown as ExceptionData[];

  /*
   * ==========================================================
   * 3. INITIALIZE RISK SIGNALS
   * ==========================================================
   */

  let inventoryRisk = 0;
  let shipmentRisk = 0;
  let supplierRisk = 0;
  let deadlineRisk = 0;
  let exceptionRisk = 0;

  const factors: string[] = [];
  const recommendations: string[] = [];

  /*
   * ==========================================================
   * 4. INVENTORY RISK
   * ==========================================================
   */

  for (const item of order.items) {
    const inventoryRaw =
      await prisma.inventory.findMany({
        where: {
          productId: item.productId,
        },
      });

    const inventoryRecords =
      inventoryRaw as unknown as InventoryData[];

    let totalAvailable = 0;

    for (
      const inventory of inventoryRecords
    ) {
      const available =
        inventory.quantity -
        inventory.reserved;

      totalAvailable += available;
    }

    /*
     * Cannot fulfill order
     */

    if (
      totalAvailable <
      item.quantity
    ) {
      inventoryRisk = Math.max(
        inventoryRisk,
        100
      );

      factors.push(
        `Insufficient inventory for ${item.product.sku}. ` +
        `Required: ${item.quantity}, ` +
        `available: ${totalAvailable}.`
      );

      recommendations.push(
        `Immediately replenish ${item.product.sku} ` +
        `or source additional stock.`
      );

      continue;
    }

    /*
     * Low order coverage
     */

    const coverage =
      item.quantity > 0
        ? totalAvailable /
          item.quantity
        : 0;

    if (coverage < 2) {
      inventoryRisk = Math.max(
        inventoryRisk,
        60
      );

      factors.push(
        `Low inventory coverage for ${item.product.sku}. ` +
        `Available: ${totalAvailable}, ` +
        `order quantity: ${item.quantity}.`
      );

      recommendations.push(
        `Monitor ${item.product.sku} inventory ` +
        `and consider replenishment.`
      );
    }

    /*
     * Warehouse-level shortage
     */

    for (
      const inventory of inventoryRecords
    ) {
      const available =
        inventory.quantity -
        inventory.reserved;

      const warehouseRaw =
        await prisma.warehouse.findUnique({
          where: {
            id: inventory.warehouseId,
          },
        });

      if (!warehouseRaw) {
        continue;
      }

      const warehouse =
        warehouseRaw as unknown as WarehouseData;

      const threshold =
        warehouse.capacity * 0.2;

      if (
        threshold > 0 &&
        available < threshold
      ) {
        inventoryRisk = Math.max(
          inventoryRisk,
          85
        );

        factors.push(
          `Warehouse inventory for ${item.product.sku} ` +
          `is critically low at ${warehouse.name}. ` +
          `Available: ${available}, ` +
          `warning threshold: ${threshold}.`
        );

        recommendations.push(
          `Replenish ${item.product.sku} inventory ` +
          `at ${warehouse.name}.`
        );
      }
    }
  }

  /*
 * ==========================================================
 * 5. SHIPMENT RISK
 * ==========================================================
 */

const activeShipments: ShipmentData[] =
  order.shipments.filter(
    (shipment: ShipmentData) =>
      shipment.status !== "DELIVERED" &&
      shipment.status !== "CANCELLED"
  );

/*
 * No shipment at all
 *
 * A delivered shipment is NOT considered missing.
 * It means the shipment has already completed.
 */
if (order.shipments.length === 0) {
  shipmentRisk = 80;

  factors.push(
    "No shipment is associated with the order."
  );

  recommendations.push(
    "Create or assign a shipment for the order."
  );
}

/*
 * Analyze active shipments
 */
for (const shipment of activeShipments) {
  /*
   * Explicitly delayed
   */
  if (shipment.status === "DELAYED") {
    shipmentRisk = Math.max(
      shipmentRisk,
      70
    );

    factors.push(
      `Shipment ${
        shipment.trackingNumber ??
        shipment.id
      } is delayed.`
    );

    recommendations.push(
      "Expedite the delayed shipment and monitor its delivery."
    );
  }

  /*
   * Expected date already passed
   *
   * Only check this for shipments that
   * are still active.
   */
  if (
    shipment.expectedDate <
      new Date() &&
    shipment.status !== "DELIVERED" &&
    shipment.status !== "CANCELLED"
  ) {
    shipmentRisk = Math.max(
      shipmentRisk,
      85
    );

    factors.push(
      `Shipment ${
        shipment.trackingNumber ??
        shipment.id
      } has passed its expected delivery date.`
    );

    recommendations.push(
      "Escalate the overdue shipment with the supplier."
    );
  }

  /*
   * Pending shipment approaching expected date
   */
  if (
    shipment.status === "PENDING" &&
    shipment.expectedDate > new Date()
  ) {
    const daysUntilShipment =
      Math.ceil(
        (
          shipment.expectedDate.getTime() -
          new Date().getTime()
        ) /
          (1000 *
            60 *
            60 *
            24)
      );

    if (daysUntilShipment <= 2) {
      shipmentRisk = Math.max(
        shipmentRisk,
        50
      );

      factors.push(
        `Shipment ${
          shipment.trackingNumber ??
          shipment.id
        } is approaching its expected delivery date.`
      );

      recommendations.push(
        "Monitor shipment progress closely."
      );
    }
  }
}

  /*
   * ==========================================================
   * 6. SUPPLIER RISK
   * ==========================================================
   */

  for (
    const shipment of activeShipments
  ) {
    const supplier =
      shipment.supplier;

    if (!supplier) {
      continue;
    }

    const reliability =
      supplier.reliability;

    if (
      reliability < 0.7
    ) {
      const calculatedSupplierRisk =
        Math.round(
          (1 - reliability) *
            100
        );

      supplierRisk = Math.max(
        supplierRisk,
        calculatedSupplierRisk
      );

      factors.push(
        `Supplier ${supplier.name} ` +
        `has low reliability: ${reliability}.`
      );

      recommendations.push(
        "Evaluate an alternate supplier for future requirements."
      );
    }
  }

  /*
   * ==========================================================
   * 7. PROMISED DATE / DEADLINE RISK
   * ==========================================================
   */

  const now = new Date();

  const daysUntilPromise =
    Math.ceil(
      (
        order.promisedDate.getTime() -
        now.getTime()
      ) /
        (1000 *
          60 *
          60 *
          24)
    );

  if (
    daysUntilPromise < 0
  ) {
    deadlineRisk = 100;

    factors.push(
      "Order promised delivery date has already passed."
    );

    recommendations.push(
      "Escalate the overdue order immediately."
    );
  } else if (
    daysUntilPromise <= 1
  ) {
    deadlineRisk = 90;

    factors.push(
      `Order promised date is only ` +
      `${daysUntilPromise} day(s) away.`
    );

    recommendations.push(
      "Immediately prioritize this order."
    );
  } else if (
    daysUntilPromise <= 3
  ) {
    deadlineRisk = 70;

    factors.push(
      `Order promised date is only ` +
      `${daysUntilPromise} day(s) away.`
    );

    recommendations.push(
      "Prioritize this order because the promised delivery date is approaching."
    );
  } else if (
    daysUntilPromise <= 7
  ) {
    deadlineRisk = 40;

    factors.push(
      `Order promised date is ` +
      `${daysUntilPromise} day(s) away.`
    );

    recommendations.push(
      "Monitor the order closely as the delivery date approaches."
    );
  }

  /*
   * ==========================================================
   * 8. EXISTING EXCEPTION RISK
   * ==========================================================
   */

  for (
    const exception of exceptions
  ) {
    exceptionRisk = Math.max(
      exceptionRisk,
      exception.riskScore
    );

    factors.push(
      `${exception.type}: ${exception.title} ` +
      `(risk score ${exception.riskScore}).`
    );

    if (
      exception.type ===
      "INVENTORY_SHORTAGE"
    ) {
      recommendations.push(
        "Resolve the inventory shortage before the order becomes unfulfillable."
      );
    }

    if (
      exception.type ===
      "SHIPMENT_DELAY"
    ) {
      recommendations.push(
        "Escalate the delayed shipment with the supplier."
      );
    }

    if (
      exception.type ===
      "SUPPLIER_DELAY"
    ) {
      recommendations.push(
        "Evaluate an alternate supplier."
      );
    }

    if (
      exception.type ===
      "ORDER_AT_RISK"
    ) {
      recommendations.push(
        "Prioritize this order and monitor it until delivery."
      );
    }
  }

  /*
   * ==========================================================
   * 9. COMPOSITE RISK SCORE
   * ==========================================================
   *
   * Inventory  = 30%
   * Shipment   = 30%
   * Supplier   = 15%
   * Deadline   = 15%
   * Exception  = 10%
   */

  const compositeScore =
    inventoryRisk * 0.30 +
    shipmentRisk * 0.30 +
    supplierRisk * 0.15 +
    deadlineRisk * 0.15 +
    exceptionRisk * 0.10;

  let riskScore =
    Math.round(
      compositeScore
    );

  /*
   * Critical exception protection
   */

  const hasCriticalException =
    exceptions.some(
      (
        exception: ExceptionData
      ) =>
        exception.severity ===
        "CRITICAL"
    );

  if (
    hasCriticalException &&
    riskScore < 70
  ) {
    riskScore = 70;
  }

  /*
   * Delayed shipment + order-at-risk
   */

  const hasDelayedShipment =
    activeShipments.some(
      (
        shipment: ShipmentData
      ) =>
        shipment.status ===
        "DELAYED"
    );

  const hasOrderAtRiskException =
    exceptions.some(
      (
        exception: ExceptionData
      ) =>
        exception.type ===
        "ORDER_AT_RISK"
    );

  if (
    hasDelayedShipment &&
    hasOrderAtRiskException &&
    riskScore < 75
  ) {
    riskScore = 75;
  }

  /*
   * Keep score within 0-100
   */

  riskScore = Math.min(
    100,
    Math.max(
      0,
      riskScore
    )
  );

  /*
   * ==========================================================
   * 10. REMOVE DUPLICATES
   * ==========================================================
   */

  const uniqueFactors =
    Array.from(
      new Set(factors)
    );

  const uniqueRecommendations =
    Array.from(
      new Set(
        recommendations
      )
    );

  /*
   * ==========================================================
   * 11. RETURN RESULT
   * ==========================================================
   */

  return {
    orderId,
    riskScore,
    severity:
      calculateSeverity(
        riskScore
      ),
    factors:
      uniqueFactors,
    recommendations:
      uniqueRecommendations,
  };
};