import prisma from "../config/database";

const calculateSeverity = (
  riskScore: number
): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" => {
  if (riskScore >= 90) return "CRITICAL";
  if (riskScore >= 70) return "HIGH";
  if (riskScore >= 40) return "MEDIUM";
  return "LOW";
};

/*
 * =====================================================
 * CREATE EXCEPTION
 * =====================================================
 */

export const createException = async (input: {
  orderId?: string;
  createdById?: string;

  type:
    | "INVENTORY_SHORTAGE"
    | "SHIPMENT_DELAY"
    | "SUPPLIER_DELAY"
    | "ORDER_AT_RISK";

  title: string;
  description: string;
  riskScore: number;
}) => {
  const riskScore = Math.max(
    0,
    Math.min(100, input.riskScore)
  );

  const severity = calculateSeverity(riskScore);

  return prisma.exception.create({
    data: {
      orderId: input.orderId,
      createdById: input.createdById,
      type: input.type,
      severity,
      title: input.title,
      description: input.description,
      riskScore,
    },
    include: {
      order: true,
      createdBy: true,
    },
  });
};

/*
 * =====================================================
 * GET ALL EXCEPTIONS
 * =====================================================
 */

export const getExceptions = async () => {
  return prisma.exception.findMany({
    include: {
      order: true,
      createdBy: true,
    },
    orderBy: [
      {
        resolved: "asc",
      },
      {
        riskScore: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
  });
};

/*
 * =====================================================
 * GET EXCEPTION BY ID
 * =====================================================
 */

export const getExceptionById = async (
  id: string
) => {
  const exception =
    await prisma.exception.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            customer: true,
            items: {
              include: {
                product: true,
              },
            },
            shipments: true,
          },
        },
        createdBy: true,
      },
    });

  if (!exception) {
    throw new Error("Exception not found");
  }

  return exception;
};

/*
 * =====================================================
 * RESOLVE EXCEPTION
 * =====================================================
 */

export const resolveException = async (
  id: string
) => {
  const exception =
    await prisma.exception.findUnique({
      where: { id },
    });

  if (!exception) {
    throw new Error("Exception not found");
  }

  if (exception.resolved) {
    return exception;
  }

  return prisma.exception.update({
    where: { id },
    data: {
      resolved: true,
    },
    include: {
      order: true,
      createdBy: true,
    },
  });
};

/*
 * =====================================================
 * INVENTORY SHORTAGE DETECTION
 * =====================================================
 *
 * A shortage exists when:
 *
 * available stock < 20% of warehouse capacity
 *
 * IMPORTANT:
 *
 * Only ONE OPEN inventory exception is allowed for the
 * same PRODUCT + WAREHOUSE combination.
 *
 * We identify the existing exception using:
 *
 * 1. type = INVENTORY_SHORTAGE
 * 2. resolved = false
 * 3. exact product SKU in title
 * 4. warehouse name in description
 *
 * This is more reliable than depending on the product
 * name appearing in the description.
 */

export const detectInventoryShortages = async () => {
  const inventoryRecords =
    await prisma.inventory.findMany({
      include: {
        warehouse: true,
        product: true,
      },
    });

  const createdExceptions = [];

  for (const inventory of inventoryRecords) {
    const available =
      inventory.quantity -
      inventory.reserved;

    const capacityThreshold =
      inventory.warehouse.capacity * 0.2;

    if (available >= capacityThreshold) {
      continue;
    }

    const shortageRatio =
      capacityThreshold > 0
        ? (capacityThreshold - available) /
          capacityThreshold
        : 1;

    const riskScore = Math.min(
      100,
      Math.round(
        60 + shortageRatio * 40
      )
    );

    const title =
      `Low inventory: ${inventory.product.sku}`;

    /*
     * IMPORTANT DUPLICATE CHECK
     *
     * We look for an OPEN inventory exception
     * belonging to the same warehouse and product.
     *
     * The SKU is part of the title.
     * The warehouse name is part of the description.
     */

    const existingExceptions =
      await prisma.exception.findMany({
        where: {
          type: "INVENTORY_SHORTAGE",
          resolved: false,
        },
        select: {
          id: true,
          title: true,
          description: true,
        },
      });

    const existing =
      existingExceptions.find(
        (exception) => {
          const sameProduct =
            exception.title === title;

          const sameWarehouse =
            exception.description.includes(
              inventory.warehouse.name
            );

          return (
            sameProduct &&
            sameWarehouse
          );
        }
      );

    if (existing) {
      continue;
    }

    const exception =
      await createException({
        type: "INVENTORY_SHORTAGE",

        title,

        description:
          `Available stock for ` +
          `${inventory.product.name} at ` +
          `${inventory.warehouse.name} is ` +
          `${available} units, below the ` +
          `warehouse warning threshold of ` +
          `${capacityThreshold} units. ` +
          `Product SKU: ${inventory.product.sku}.`,

        riskScore,
      });

    createdExceptions.push(exception);
  }

  return createdExceptions;
};

/*
 * =====================================================
 * SHIPMENT DELAY DETECTION
 * =====================================================
 *
 * A shipment is considered risky when:
 *
 * 1. It is explicitly marked DELAYED
 *
 * OR
 *
 * 2. Its expected date has already passed
 *
 * DELIVERED and CANCELLED shipments are ignored.
 */

export const detectShipmentDelays = async () => {
  const now = new Date();

  const shipments =
    await prisma.shipment.findMany({
      where: {
        OR: [
          {
            status: "DELAYED",
          },
          {
            status: {
              notIn: [
                "DELIVERED",
                "CANCELLED",
              ],
            },
            expectedDate: {
              lt: now,
            },
          },
        ],
      },
      include: {
        order: true,
        supplier: true,
      },
    });

  const createdExceptions = [];

  for (const shipment of shipments) {
    const existing =
      await prisma.exception.findFirst({
        where: {
          orderId: shipment.orderId,
          type: "SHIPMENT_DELAY",
          resolved: false,
        },
      });

    if (existing) {
      continue;
    }

    let daysLate = 1;

    if (shipment.expectedDate < now) {
      daysLate = Math.max(
        1,
        Math.ceil(
          (now.getTime() -
            shipment.expectedDate.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );
    }

    const riskScore = Math.min(
      100,
      50 + daysLate * 10
    );

    const exception =
      await createException({
        orderId: shipment.orderId,

        type: "SHIPMENT_DELAY",

        title:
          `Shipment delayed: ${
            shipment.trackingNumber ??
            shipment.id
          }`,

        description:
          shipment.status === "DELAYED"
            ? `Shipment ${
                shipment.trackingNumber ??
                shipment.id
              } has been explicitly marked as delayed. ` +
              `Expected delivery date: ` +
              `${shipment.expectedDate.toISOString()}.`
            : `Shipment ${
                shipment.trackingNumber ??
                shipment.id
              } was expected on ` +
              `${shipment.expectedDate.toISOString()} ` +
              `and is ${daysLate} day(s) late.`,

        riskScore,
      });

    createdExceptions.push(exception);
  }

  return createdExceptions;
};

/*
 * =====================================================
 * SUPPLIER RISK DETECTION
 * =====================================================
 *
 * Reliability:
 *
 * >= 0.90 → LOW / no exception
 * >= 0.70 → acceptable
 * <  0.70 → supplier risk
 */

export const detectSupplierRisks = async () => {
  const suppliers =
    await prisma.supplier.findMany({
      include: {
        products: true,
      },
    });

  const createdExceptions = [];

  for (const supplier of suppliers) {
    if (supplier.reliability >= 0.7) {
      continue;
    }

    const riskScore = Math.min(
      100,
      Math.round(
        (1 - supplier.reliability) * 100
      )
    );

    const existing =
      await prisma.exception.findFirst({
        where: {
          type: "SUPPLIER_DELAY",
          resolved: false,
          description: {
            contains: supplier.id,
          },
        },
      });

    if (existing) {
      continue;
    }

    const exception =
      await createException({
        type: "SUPPLIER_DELAY",

        title:
          `Supplier reliability risk: ${supplier.name}`,

        description:
          `Supplier ${supplier.name} has ` +
          `reliability score ` +
          `${supplier.reliability}. ` +
          `Supplier ID: ${supplier.id}`,

        riskScore,
      });

    createdExceptions.push(exception);
  }

  return createdExceptions;
};

/*
 * =====================================================
 * ORDER AT RISK
 * =====================================================
 *
 * An order becomes risky when:
 *
 * - It is still open
 * - Promised date is within 3 days
 * - Shipment has not been delivered
 *
 * Delayed shipments receive additional risk.
 */

export const detectOrdersAtRisk = async () => {
  const now = new Date();

  const orders =
    await prisma.order.findMany({
      where: {
        status: {
          notIn: [
            "DELIVERED",
            "CANCELLED",
          ],
        },
      },
      include: {
        shipments: true,
      },
    });

  const createdExceptions = [];

  for (const order of orders) {
    const daysUntilPromise =
      Math.ceil(
        (order.promisedDate.getTime() -
          now.getTime()) /
          (1000 * 60 * 60 * 24)
      );

    const activeShipment =
      order.shipments.find(
        (shipment) =>
          shipment.status !==
            "DELIVERED" &&
          shipment.status !==
            "CANCELLED"
      );

    if (!activeShipment) {
      continue;
    }

    const deadlineRisk =
      daysUntilPromise <= 3 &&
      daysUntilPromise >= 0;

    const shipmentRisk =
      activeShipment.status ===
      "DELAYED";

    if (
      !deadlineRisk &&
      !shipmentRisk
    ) {
      continue;
    }

    let riskScore = 70;

    if (
      daysUntilPromise >= 0 &&
      daysUntilPromise <= 3
    ) {
      riskScore =
        70 +
        Math.max(
          0,
          3 - daysUntilPromise
        ) *
          10;
    }

    if (shipmentRisk) {
      riskScore = Math.max(
        riskScore,
        80
      );
    }

    riskScore = Math.min(
      100,
      riskScore
    );

    const existing =
      await prisma.exception.findFirst({
        where: {
          orderId: order.id,
          type: "ORDER_AT_RISK",
          resolved: false,
        },
      });

    if (existing) {
      continue;
    }

    const exception =
      await createException({
        orderId: order.id,

        type: "ORDER_AT_RISK",

        title:
          `Order at risk: ${order.id}`,

        description:
          shipmentRisk
            ? `Order has a delayed shipment and ` +
              `may miss its promised delivery date.`
            : `Order promised date is approaching ` +
              `in ${daysUntilPromise} day(s), ` +
              `but the shipment has not been delivered.`,

        riskScore,
      });

    createdExceptions.push(exception);
  }

  return createdExceptions;
};

/*
 * =====================================================
 * RUN ALL DETECTION RULES
 * =====================================================
 */

export const runExceptionDetection =
  async () => {
    const inventory =
      await detectInventoryShortages();

    const shipments =
      await detectShipmentDelays();

    const suppliers =
      await detectSupplierRisks();

    const orders =
      await detectOrdersAtRisk();

    return {
      inventory,
      shipments,
      suppliers,
      orders,

      total:
        inventory.length +
        shipments.length +
        suppliers.length +
        orders.length,
    };
  };