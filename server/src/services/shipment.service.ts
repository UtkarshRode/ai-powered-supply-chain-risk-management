import prisma from "../config/database";
import { riskQueue } from "../queues/risk.queue";

interface CreateShipmentInput {
  orderId: string;
  supplierId?: string;
  expectedDate: string;
  trackingNumber?: string;
}

export const createShipment = async (
  input: CreateShipmentInput
) => {
  if (!input.orderId) {
    throw new Error("Order is required");
  }

  if (!input.expectedDate) {
    throw new Error("Expected date is required");
  }

  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (input.supplierId) {
    const supplier = await prisma.supplier.findUnique({
      where: { id: input.supplierId },
    });

    if (!supplier) {
      throw new Error("Supplier not found");
    }
  }

  const existingShipment =
    await prisma.shipment.findFirst({
      where: {
        orderId: input.orderId,
        status: {
          not: "CANCELLED",
        },
      },
    });

  if (existingShipment) {
    throw new Error(
      "An active shipment already exists for this order"
    );
  }

  return prisma.shipment.create({
    data: {
      orderId: input.orderId,
      supplierId: input.supplierId,
      expectedDate: new Date(input.expectedDate),
      trackingNumber: input.trackingNumber,
    },
    include: {
      order: {
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      },
      supplier: true,
    },
  });
};

export const getShipments = async () => {
  return prisma.shipment.findMany({
    include: {
      order: {
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      },
      supplier: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getShipmentById = async (
  id: string
) => {
  const shipment =
    await prisma.shipment.findUnique({
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
          },
        },
        supplier: true,
      },
    });

  if (!shipment) {
    throw new Error("Shipment not found");
  }

  return shipment;
};

export const updateShipmentStatus = async (
  id: string,
  status: string,
  actualDate?: string
) => {
  const validStatuses = [
    "PENDING",
    "IN_TRANSIT",
    "DELIVERED",
    "DELAYED",
    "CANCELLED",
  ];

  if (!validStatuses.includes(status)) {
    throw new Error("Invalid shipment status");
  }

  const shipment =
    await prisma.shipment.findUnique({
      where: { id },
    });

  if (!shipment) {
    throw new Error("Shipment not found");
  }

  const updatedShipment =
    await prisma.shipment.update({
      where: { id },
      data: {
        status: status as any,

        actualDate:
          actualDate !== undefined
            ? new Date(actualDate)
            : status === "DELIVERED"
              ? new Date()
              : undefined,
      },
      include: {
        order: true,
        supplier: true,
      },
    });

  /*
   * If the shipment has been delivered,
   * any unresolved shipment-delay exceptions
   * for this order are no longer valid.
   */
  if (status === "DELIVERED") {
    await prisma.exception.updateMany({
      where: {
        orderId: shipment.orderId,
        type: "SHIPMENT_DELAY",
        resolved: false,
      },
      data: {
        resolved: true,
      },
    });
  }

  /*
   * If the shipment becomes delayed,
   * create a shipment-delay exception if one
   * does not already exist.
   */
  if (status === "DELAYED") {
    const existingDelayException =
      await prisma.exception.findFirst({
        where: {
          orderId: shipment.orderId,
          type: "SHIPMENT_DELAY",
          resolved: false,
        },
      });

    if (!existingDelayException) {
      await prisma.exception.create({
        data: {
          orderId: shipment.orderId,
          type: "SHIPMENT_DELAY",
          severity: "HIGH",
          title: `Shipment delayed: ${
            shipment.trackingNumber ??
            shipment.id
          }`,
          description: `Shipment ${
            shipment.trackingNumber ??
            shipment.id
          } is delayed.`,
          riskScore: 60,
          resolved: false,
        },
      });
    }
  }

  /*
   * Every shipment status change triggers
   * a fresh AI risk analysis.
   */
  await riskQueue.add(
    "shipment-risk-analysis",
    {
      orderId: shipment.orderId,
      event: "SHIPMENT_STATUS_UPDATED",
    },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: 100,
      removeOnFail: 500,
    }
  );

  return updatedShipment;
};