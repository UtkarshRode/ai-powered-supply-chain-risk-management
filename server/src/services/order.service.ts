import { riskQueue } from "../queues/risk.queue";
import prisma from "../config/database";

interface CreateOrderItemInput {
  productId: string;
  quantity: number;
}

interface CreateOrderInput {
  customerId: string;
  promisedDate: string;
  items: CreateOrderItemInput[];
}

export const createOrder = async (
  input: CreateOrderInput,
  createdById: string
) => {
  if (!input.customerId) {
    throw new Error("Customer is required");
  }

  if (!input.promisedDate) {
    throw new Error("Promised date is required");
  }

  if (!input.items || input.items.length === 0) {
    throw new Error("At least one order item is required");
  }

  const customer = await prisma.customer.findUnique({
    where: { id: input.customerId },
  });

  if (!customer) {
    throw new Error("Customer not found");
  }

  const productIds = input.items.map(
    (item) => item.productId
  );

  const products = await prisma.product.findMany({
    where: {
      id: {
        in: productIds,
      },
    },
  });

  if (products.length !== productIds.length) {
    throw new Error("One or more products not found");
  }

  const order = await prisma.$transaction(async (tx) => {
    let totalAmount = 0;

    const orderItems = [];

    for (const item of input.items) {
      if (item.quantity <= 0) {
        throw new Error(
          "Order quantity must be greater than 0"
        );
      }

      const product = products.find(
        (p) => p.id === item.productId
      );

      if (!product) {
        throw new Error("Product not found");
      }

      const inventory = await tx.inventory.findFirst({
        where: {
          productId: item.productId,
        },
      });

      if (!inventory) {
        throw new Error(
          `No inventory found for product ${product.sku}`
        );
      }

      const available =
        inventory.quantity - inventory.reserved;

      if (item.quantity > available) {
        throw new Error(
          `Insufficient stock for ${product.sku}. Available: ${available}`
        );
      }

      const itemTotal =
        product.unitPrice * item.quantity;

      totalAmount += itemTotal;

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.unitPrice,
      });
    }

    const order = await tx.order.create({
      data: {
        customerId: input.customerId,
        createdById,
        status: "PENDING",
        totalAmount,
        promisedDate: new Date(input.promisedDate),
        items: {
          create: orderItems,
        },
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    for (const item of input.items) {
      const inventory = await tx.inventory.findFirst({
        where: {
          productId: item.productId,
        },
      });

      if (!inventory) {
        throw new Error("Inventory not found");
      }

      await tx.inventory.update({
        where: {
          id: inventory.id,
        },
        data: {
          reserved: {
            increment: item.quantity,
          },
        },
      });
    }

    return order;
  });

  await riskQueue.add(
    "analyze-order-risk",
    {
      orderId: order.id,
      event: "ORDER_CREATED",
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

  return order;
};

export const getOrders = async () => {
  return prisma.order.findMany({
    include: {
      customer: true,
      createdBy: true,
      items: {
        include: {
          product: true,
        },
      },
      shipments: true,
      exceptions: true,
    },
    orderBy: {
      orderDate: "desc",
    },
  });
};

export const getOrderById = async (id: string) => {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      createdBy: true,
      items: {
        include: {
          product: true,
        },
      },
      shipments: true,
      exceptions: true,
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  return order;
};

export const updateOrderStatus = async (
  id: string,
  status: any
) => {
  const validStatuses = [
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ];

  if (!validStatuses.includes(status)) {
    throw new Error("Invalid order status");
  }

  return prisma.order.update({
    where: { id },
    data: { status },
    include: {
      customer: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });
};

export const getOrderRiskAnalysis = async (
  orderId: string
) => {
  return prisma.riskAnalysis.findMany({
    where: {
      orderId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};